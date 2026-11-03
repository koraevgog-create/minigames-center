'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const context={window:{}};
vm.createContext(context);
for(const name of ['track-model.js','race-physics.js','race-events.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const {TurboTrackModel:tracks,TurboRacePhysics:physics,TurboRaceEvents:events}=context.window;
const lengths={coast:6500,alpine:7200,desert:6800,night:6900};
const car=()=>({z:0,x:0,speed:0,nitro:100,health:100,topSpeed:0,steerVelocity:0,lateralVelocity:0,collide:0,slipstream:0});
const roster=()=>Array.from({length:19},(_,i)=>({
 id:i,z:65+(9-Math.floor(i/2))*42,lane:i%2?.46:-.46,baseLane:i%2?.46:-.46,
 velocity:0,speed:228+(18-i)*2.65+(i%4)*2.8,skill:.94+(18-i)*.003+(i%4)*.012,
 passCooldown:.3+(i%5)*.35,passTarget:null,finished:false
}));
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
