'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const context={window:{}};
vm.createContext(context);
for(const name of ['track-model.js','segment-road.js','race-physics.js','race-events.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const {TurboTrackModel:tracks,TurboRacePhysics:physics,TurboRaceEvents:events}=context.window;
const lengths={coast:6500,alpine:7200,desert:6800,night:6900};
const car=()=>({z:0,x:0,speed:0,nitro:100,health:100,topSpeed:0,steerVelocity:0,lateralVelocity:0,collide:0,slipstream:0});
const roster=()=>Array.from({length:19},(_,i)=>{
 const ahead=i<10,row=ahead?Math.floor((9-i)/2):Math.floor((i-10)/2);
 const z=ahead?36+row*39:-38-row*39,lane=i%2?.43:-.43;
 const pace=(ahead?269+(9-i)*1.55:261-(i-10)*1.15)+(i%4-1.5)*2.0;
 return {id:i,z,lane,baseLane:lane,velocity:0,speed:pace,
   skill:1.01+(9-i)*.002+(i%3-1)*.012,
   passCooldown:.5+(i%4)*.6,passTarget:null,finished:false};
});
test('all four circuits remain finite, controllable and nonnegative for long races',()=>{
 for(const theme of Object.keys(lengths)){
  const track={theme,length:lengths[theme]},p=car(),rivals=roster(),dt=1/60;
  const state={track,player:p,rivals};
  events.reset(state);
  for(let i=0;i<60*100;i++){
   p.collide=Math.max(0,p.collide-dt);
   const steer={gas:true,brake:false,nitro:false,left:p.x>.15,right:p.x<-.15};
   physics.vehicle(p,steer,track,{maxSpeed:300,handling:1,acceleration:1},dt);
   const snapshot=[...rivals.map(r=>({...r})),{id:'player',z:p.z,lane:p.x,velocity:p.speed,finished:false}];
   for(const r of rivals)physics.planAI(r,snapshot,track,dt);
   physics.resolveInteractions(state);
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(p.speed));
   assert.ok(p.speed>=0&&p.health>=0&&p.nitro>=0);
   for(const r of rivals)assert.ok(Number.isFinite(r.z)&&Number.isFinite(r.lane)&&r.velocity>=0);
  }
  assert.ok(Math.abs(p.x)<.6,'steering must maintain lane on '+theme);
  assert.ok(p.z>3000,'car must finish substantial distance on '+theme);
 }
});
test('contact never injects lateral steering impulse',()=>{
 const p={...car(),speed:225,z:100,x:0,lateralVelocity:0},op={id:1,z:103,lane:0,velocity:175,finished:false};
 const hit=physics.resolveInteractions({player:p,rivals:[op]});
 assert.ok(hit);assert.equal(p.x,0);assert.equal(p.lateralVelocity,0);
 assert.ok(p.speed<225&&p.health<100);
});
test('nitro is finite, useful and does not magically refill',()=>{
 const track={theme:'coast',length:6500},p=car(),dt=1/60;
 for(let i=0;i<60*22;i++)physics.vehicle(p,{gas:true,nitro:true},track,{maxSpeed:300},dt);
 assert.ok(p.nitro<5,'most nitro should be consumed');
 const after=p.nitro;
 for(let i=0;i<60*10;i++)physics.vehicle(p,{gas:true,nitro:false},track,{maxSpeed:300},dt);
 assert.equal(p.nitro,after,'nitro must not regenerate');
});
test('repeated contact cannot throw the car out of bounds',()=>{
 const p={...car(),speed:190,z:100,x:0,lateralVelocity:0},op={id:0,z:101,lane:0,velocity:150,finished:false};
 for(let i=0;i<100;i++){p.collide=0;physics.resolveInteractions({player:p,rivals:[op]})}
 assert.equal(p.x,0);assert.equal(p.lateralVelocity,0);assert.ok(p.health>=20);
});
test('bonuses only activate when car reaches the correct road lane',()=>{
 const state={track:{theme:'coast',length:6500},player:car()};
 events.reset(state);
 assert.equal(state.pickups.length,21);
 const item=state.pickups.find(p=>p.kind==='cash');
 state.player.z=item.z;state.player.x=-item.lane;
 assert.equal(events.update(state,{nitroCapacity:100}),null);
 state.player.x=item.lane;
 assert.match(events.update(state,{nitroCapacity:100}),/250/);
 assert.equal(events.update(state,{nitroCapacity:100}),null);
 assert.equal(state.pickupMoney,250);
});
test('opponents avoid perpetual lane changes while driving at nonzero speeds',()=>{
 const t={theme:'coast',length:6500},r=roster(),dt=1/60;
 for(let i=0;i<60*40;i++){
  const snapshot=r.map(o=>({...o}));
  for(const o of r)physics.planAI(o,snapshot,t,dt);
 }
 assert.ok(r.every(o=>Number.isFinite(o.z)&&o.z>500&&o.velocity>50));
 assert.ok(r.every(o=>Math.abs(o.lane)<.8));
});

test('road segment geometry shares perspective with the player and opponents',()=>{
 const road=context.window.TurboSegmentRoad,track={theme:'coast',length:6500};
 const state={track,player:{z:1100,x:0,speed:180}};
 const segments=road.sample(state);
 assert.ok(segments.length>=120);
 assert.ok(segments[0].width>segments[50].width);
 assert.ok(segments.every((p,i)=>i===0||p.z>segments[i-1].z));
 assert.ok(segments.some((p,i)=>i>0&&Math.abs(p.x-320)>10));
 assert.ok(segments.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 state.player.z=1100.5;
 const next=road.sample(state);
 assert.ok(Math.abs(next[45].x-segments[45].x)<15,'camera must not jump between frames');
});
test('authored hills vary in height and remain continuous at lap boundary',()=>{
 const road=context.window.TurboSegmentRoad,track={theme:'alpine',length:7200};
 const values=Array.from({length:50},(_,i)=>road.heightAt(i*track.length/50,track));
 assert.ok(Math.max(...values)-Math.min(...values)>40);
 assert.ok(Math.abs(road.heightAt(0,track)-road.heightAt(track.length-.001,track))<.01);
});

test('balanced grid has ten racers in front and nine behind at the start',()=>{
 const r=roster();
 assert.equal(r.filter(o=>o.z>0).length,10);
 assert.equal(r.filter(o=>o.z<0).length,9);
 assert.equal(new Set(r.map(o=>o.id)).size,19);
});
test('throttle requires time to build speed and the brake is effective',()=>{
 const t={theme:'coast',length:6500},dt=1/60,p=car();
 for(let i=0;i<60*2;i++)physics.vehicle(p,{gas:true},t,{maxSpeed:300,acceleration:1},dt);
 assert.ok(p.speed>20&&p.speed<100,'no instant 100 km/h');
 for(let i=0;i<60*14;i++)physics.vehicle(p,{gas:true},t,{maxSpeed:300,acceleration:1},dt);
 assert.ok(p.speed>155&&p.speed<290,'reasonable acceleration curve');
 const before=p.speed;
 for(let i=0;i<60;i++)physics.vehicle(p,{gas:false,brake:true},t,{maxSpeed:300,acceleration:1},dt);
 assert.ok(p.speed<before-100,'strong braking');
});
test('a wrong turn cannot leave the player permanently stalled on the shoulder',()=>{
 for(const theme of Object.keys(lengths)){
  const t={theme,length:lengths[theme]},p=car(),dt=1/60;
  for(let i=0;i<60*120;i++)physics.vehicle(p,{gas:true,left:false,right:false},t,{maxSpeed:300,handling:1},dt);
  assert.ok(p.speed>35,'must remain driveable on grass '+theme);
  assert.ok(p.z>1500,'must keep progressing '+theme);
 }
});
test('CPU cars maintain separation and the race permits gradual overtakes',()=>{
 const t={theme:'coast',length:6500},dt=1/60,p=car(),rivals=roster();
 let rankAt60=null,rankAt120=null,rankAt180=null;
 for(let tick=0;tick<60*180;tick++){
  p.collide=Math.max(0,p.collide-dt);
  physics.vehicle(p,{gas:true,left:p.x>.12,right:p.x<-.12},t,{maxSpeed:300,handling:1},dt);
  const snapshot=[...rivals.map(o=>({...o})),{id:'player',z:p.z,lane:p.x,velocity:p.speed,finished:false}];
  for(const r of rivals)physics.planAI(r,snapshot,t,dt);
  physics.resolveInteractions({player:p,rivals});
  if(tick===60*60-1)rankAt60=1+rivals.filter(o=>o.z>p.z).length;
  if(tick===60*120-1)rankAt120=1+rivals.filter(o=>o.z>p.z).length;
  if(tick===60*180-1)rankAt180=1+rivals.filter(o=>o.z>p.z).length;
 }
 assert.ok(rankAt60>1,'player should not win in the first minute');
 assert.ok(rankAt180<rankAt60,'race must allow overtakes with controlled driving');
 assert.ok(rankAt120>=1&&rankAt120<=20);
 assert.ok(rivals.every(o=>o.z>1000&&Number.isFinite(o.lane)));
});

test('CPU overtake keeps lateral movement bounded and does not oscillate wildly',()=>{
 const t={theme:'coast',length:6500},dt=1/60;
 const leader={id:0,z:195,lane:-.34,baseLane:-.34,velocity:170,speed:170,skill:1,passCooldown:0,passTarget:null,finished:false};
 const pursuer={id:1,z:160,lane:-.34,baseLane:-.34,velocity:205,speed:275,skill:1,passCooldown:0,passTarget:null,finished:false};
 let previous=pursuer.lane,maxStep=0,turns=0,lastDirection=0;
 for(let i=0;i<60*9;i++){
  const snapshot=[{...leader},{...pursuer}];
  physics.planAI(pursuer,snapshot,t,dt);
  physics.planAI(leader,snapshot,t,dt);
  const delta=pursuer.lane-previous;
  maxStep=Math.max(maxStep,Math.abs(delta));
  const direction=Math.sign(delta);
  if(direction&&lastDirection&&direction!==lastDirection)turns++;
  if(direction)lastDirection=direction;
  previous=pursuer.lane;
 }
 assert.ok(maxStep<.012,'lane movement must be smooth every physics tick');
 assert.ok(turns<8,'avoid lane oscillation');
 assert.ok(pursuer.z>160,'AI makes progress');
});
