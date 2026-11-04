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
 const z=(ahead?72+row*93+(i%2)*18:-68-row*88-(i%2)*20)*physics.worldScale;
 const lane=i%2?.48:-.48;
 const pace=(ahead?258+(9-i)*2.9:253-(i-10)*1.8)+(i%4-1.5)*3.8;
 return {id:i,z,lane,baseLane:lane,cruiseLane:lane,speed:pace,velocity:0,
 skill:.99+(9-i)*.003+(i%3-1)*.018,passCooldown:.5+(i%4)*.6,
 passTarget:null,finished:false};
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

test('arcade world movement drives trees and reflectors past the car faster',()=>{
 const treeSpacing=17,reflectorSpacing=9;
 const worldUnitsPerSecond=(100/3.6)*physics.worldScale;
 const treePeriod=treeSpacing/worldUnitsPerSecond;
 const reflectorPeriod=reflectorSpacing/worldUnitsPerSecond;
 assert.ok(treePeriod>.20&&treePeriod<.25);
 assert.ok(reflectorPeriod>.10&&reflectorPeriod<.14);
});
test('opponent traffic spreads instead of collapsing into one stationary pack',()=>{
 const track={theme:'coast',length:17550},rivals=roster(),p=car(),dt=1/60;
 const startSpread=Math.max(...rivals.map(o=>o.z))-Math.min(...rivals.map(o=>o.z));
 assert.ok(startSpread>800,'field must occupy realistic distance');
 let regressions=0,overlaps=0;
 for(let tick=0;tick<60*120;tick++){
  const snapshot=[...rivals.map(o=>({...o})),{id:'player',z:p.z,lane:p.x,velocity:p.speed,finished:false}];
  for(const r of rivals){const oldZ=r.z;physics.planAI(r,snapshot,track,dt);if(r.z<oldZ)regressions++;}
  physics.resolveInteractions({player:p,rivals});
  for(let i=0;i<rivals.length;i++)for(let j=i+1;j<rivals.length;j++){
   if(Math.abs(rivals[i].z-rivals[j].z)<4&&Math.abs(rivals[i].lane-rivals[j].lane)<.26)overlaps++;
  }
 }
 const spread=Math.max(...rivals.map(o=>o.z))-Math.min(...rivals.map(o=>o.z));
 assert.equal(regressions,0,'AI must never teleport backwards');
 assert.equal(overlaps,0,'AI cars must not intersect in the same lane');
 assert.ok(spread>startSpread*.9,'cars should stay distributed');
});

test('arcade road scrolls faster than a metre-based world without changing indicated km/h',()=>{
 const track={theme:'coast',length:17550},p=car(),dt=1/60;
 p.speed=100;
 const before=p.z;
 physics.vehicle(p,{gas:false,brake:false,left:false,right:false},track,{maxSpeed:300},dt);
 const travelled=p.z-before;
 const expected=p.speed/3.6*dt*physics.worldScale;
 assert.ok(Math.abs(travelled-expected)<.01,'world advance must use arcade pace');
 assert.ok(physics.worldScale>=2.5,'at least 2.5x optical world traversal');
 assert.ok(travelled>.95,'100 km/h should scroll at least 0.95 world units per 60-Hz frame');
});
test('CPU and player progress use the same arcade world scale',()=>{
 const t={theme:'coast',length:17550},dt=1/60,p=car(),r=roster()[0];
 p.speed=150;r.velocity=150;r.speed=150;
 const p0=p.z,r0=r.z;
 physics.vehicle(p,{gas:false},t,{maxSpeed:300},dt);
 physics.planAI(r,[{...r}],t,dt);
 const playerDelta=p.z-p0,opponentDelta=r.z-r0;
 assert.ok(playerDelta>1.7&&opponentDelta>1.7,'both racers traverse world distance at arcade pace');
 assert.ok(Math.abs(playerDelta-opponentDelta)<.12,'their movement scales must stay synchronized');
});

test('racing AI avoids nearby traffic when selecting an overtaking corridor',()=>{
 const t={theme:'coast',length:17550},dt=1/60;
 const driver={id:60,z:0,lane:-.36,baseLane:-.36,cruiseLane:-.36,
  velocity:260,speed:278,skill:1,aggression:1,passCooldown:0,passTarget:null,finished:false};
 const ahead={id:61,z:47*physics.worldScale,lane:-.36,velocity:190,speed:190,finished:false};
 const blocker={id:62,z:5*physics.worldScale,lane:0,velocity:220,speed:230,finished:false};
 for(let i=0;i<60*3;i++){
  const snapshot=[{...driver},{...ahead},{...blocker}];
  physics.planAI(driver,snapshot,t,dt);
  physics.planAI(ahead,snapshot,t,dt);
  physics.planAI(blocker,snapshot,t,dt);
  assert.ok(Number.isFinite(driver.lane)&&Number.isFinite(driver.velocity));
  assert.ok(Math.abs(driver.lane)<=.78);
 }
 assert.ok(driver.z>0);
});
test('rivals keep safe progress without backwards jumps through a three minute session',()=>{
 const t={theme:'alpine',length:19440},r=roster(),dt=1/60;
 let rewinds=0,illegalOverlaps=0;
 for(let i=0;i<60*180;i++){
  const snapshot=r.map(car=>({...car}));
  for(const car of r){const previous=car.z;physics.planAI(car,snapshot,t,dt);if(car.z<previous)rewinds++;}
  physics.resolveInteractions({player:car(),rivals:r});
  for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++){
   if(Math.abs(r[a].z-r[b].z)<4*physics.worldScale&&Math.abs(r[a].lane-r[b].lane)<.23)illegalOverlaps++;
  }
 }
 assert.equal(rewinds,0);
 assert.equal(illegalOverlaps,0);
});

test('recoverable cornering at arcade speed on every track',()=>{
 const lengths={coast:17550,alpine:19440,desert:18360,night:18630};
 for(const theme of Object.keys(lengths)){
  const t={theme,length:lengths[theme]},p=car(),dt=1/60;
  let offroad=0,maximumLoad=0;
  for(let tick=0;tick<60*120;tick++){
   const result=physics.vehicle(p,{gas:true,left:p.x>.17,right:p.x<-.17},t,{maxSpeed:300,handling:1,acceleration:1},dt);
   if(p.offRoad)offroad++;
   maximumLoad=Math.max(maximumLoad,result.cornerLoad);
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(p.lateralVelocity));
  }
  assert.ok(maximumLoad>.1,'corners should exert measurable load '+theme);
  assert.ok(offroad<60*2,'countersteering should keep the car recoverable '+theme);
  assert.ok(p.z>10000,'arcade world pace must be preserved '+theme);
 }
});
test('steering has proportional effect and releasing it damps lateral motion',()=>{
 const t={theme:'coast',length:17550},dt=1/60,p=car();
 p.speed=175;p.z=t.length*.12;
 for(let i=0;i<30;i++)physics.vehicle(p,{gas:true,right:true},t,{maxSpeed:300,handling:1},dt);
 const drift=p.lateralVelocity;
 assert.ok(drift>.15,'steering should generate a rightwards response');
 for(let i=0;i<45;i++)physics.vehicle(p,{gas:false,left:false,right:false},t,{maxSpeed:300,handling:1},dt);
 assert.ok(p.lateralVelocity<drift*.35,'car should settle when steering is released');
});

test('sustained overlap creates one collision event until cars separate',()=>{
 const p={...car(),speed:190,z:100,x:0,lateralVelocity:0,collide:0};
 const op={id:71,z:103,lane:0,velocity:170,finished:false};
 const state={player:p,rivals:[op]};
 const first=physics.resolveInteractions(state);
 assert.ok(first&&first.damage>0);
 const health=p.health;
 for(let i=0;i<30;i++){p.collide=0;assert.equal(physics.resolveInteractions(state),null)}
 assert.equal(p.health,health,'prolonged side contact should not repeatedly drain health');
 op.lane=.8;physics.resolveInteractions(state);
 op.lane=0;p.collide=0;
 const second=physics.resolveInteractions(state);
 assert.ok(second,'a fresh contact after separation should count again');
 assert.ok(p.health<health);
});
test('two racers driving nearly together do not get a large collision penalty',()=>{
 const p={...car(),z:220,x:0,speed:180,collide:0};
 const op={id:72,z:221,lane:0,velocity:178,finished:false};
 const hit=physics.resolveInteractions({player:p,rivals:[op]});
 assert.ok(hit);
 assert.ok(hit.speedLoss<6);
 assert.equal(p.x,0);
});

test('difficulty-dependent acceleration factor changes CPU progress without teleporting',()=>{
 const track={theme:'coast',length:17550},dt=1/60;
 const low={...roster()[0],id:100,z:0,lane:-.4,cruiseLane:-.4,baseLane:-.4,accelerationMultiplier:.91};
 const high={...roster()[0],id:101,z:0,lane:.4,cruiseLane:.4,baseLane:.4,accelerationMultiplier:1.08};
 low.speed=high.speed=290;
 for(let i=0;i<60*15;i++){
  physics.planAI(low,[{...low}],track,dt);
  physics.planAI(high,[{...high}],track,dt);
 }
 assert.ok(high.z>low.z+60,'hard driver acceleration should create a measurable gap');
 assert.ok(low.z>0&&high.z>0,'both should move forward');
});
