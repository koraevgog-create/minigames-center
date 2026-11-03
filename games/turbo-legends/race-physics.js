/* Turbo Legends 2.0 - deterministic arcade race simulation, no external dependencies.
   Distances: metres. Speed: km/h. Steering coordinate: +/-1 is one road half-width.
   The road renderer owns camera motion; physics owns only road-relative position. */
(()=>{'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const approach=(a,b,step)=>a<b?Math.min(b,a+step):Math.max(b,a-step);
const model=()=>window.TurboTrackModel;
const curve=(z,t)=>model()?.curvature(z,t)||0;
function vehicle(p,input,track,garage,dt){
 dt=clamp(dt,0,1/30);
 const gas=!!input.gas,brake=!!input.brake;
 const steer=Number(!!input.right)-Number(!!input.left);
 const weatherGrip=(track.theme==='alpine'||track.theme==='night')?.93:1;
 const grip=clamp((garage?.handling||1)*weatherGrip,.78,1.65);
 const accel=clamp(garage?.acceleration||1,.8,1.7);
 const capacity=garage?.nitroCapacity||100;
 const baseMax=garage?.maxSpeed||300;
 const top=baseMax*(.87+.13*p.health/100);
 const boost=!!input.nitro&&gas&&!brake&&p.nitro>1&&p.speed>42;
 const resistance=9+p.speed*.038+.00024*p.speed*p.speed;
 const engine=gas?122*accel*(1-.65*Math.pow(Math.min(1,p.speed/top),1.25)):0;
 const nitroPower=boost?145*(garage?.nitroBoost||1):0;
 const braking=brake?265:0;
 p.speed=clamp(p.speed+(engine+nitroPower-resistance-braking)*dt,0,boost?top+78:top);
 p.nitro=clamp(p.nitro+(boost?-9.5/(garage?.nitroEfficiency||1):0)*dt,0,capacity);
 p.boosting=boost;p.gear=clamp(1+Math.floor(p.speed/54),1,6);
 p.topSpeed=Math.max(p.topSpeed,p.speed);
 // Smooth but responsive steering. At normal speed the road cannot throw you off.
 p.steerVelocity=approach(p.steerVelocity||0,steer,dt*4.8*grip);
 const speedFactor=clamp(p.speed/190,.22,1.6);
 const currentCurve=curve(p.z,track);
 const overspeed=clamp((p.speed-175)/155,0,1.25);
 const bendForce=currentCurve*.11*overspeed*overspeed/(grip*.9);
 // Slight natural grip recovery at road edge; no arbitrary forced collision steering.
 const assist=(Math.abs(p.x)>1.02&&steer===0)?-Math.sign(p.x)*.29:0;
 const desired=p.steerVelocity*(.42+.55*speedFactor)*grip-bendForce+assist;
 p.lateralVelocity=approach(p.lateralVelocity||0,desired,dt*(3.9+grip));
 p.x=clamp(p.x+p.lateralVelocity*dt*1.35,-1.43,1.43);
 p.drift=p.lateralVelocity;
 p.offRoad=Math.abs(p.x)>1.06;
 if(p.offRoad){
  const outside=clamp((Math.abs(p.x)-1.06)/.37,0,1);
  p.speed=Math.max(0,p.speed-(40+75*outside)*dt);
  if(p.speed>65)p.health=clamp(p.health-(.08+.36*outside)*dt,20,100);
 }
 p.z+=p.speed/3.6*dt;
 return {curve:currentCurve,speed:p.speed};
}
const LANE_OPTIONS=[-.70,-.37,0,.37,.70];
function canUseLane(driver,near,lane){
 return near.every(v=>{
  if(v.id===driver.id||v.finished)return true;
  const relative=v.z-driver.z;
  return relative < -16||relative>21||Math.abs(v.lane-lane)>.28;
 });
}
function planAI(o,participants,track,dt){
 if(o.finished)return;
 dt=clamp(dt,0,1/30);
 const skill=clamp(o.skill||1,.85,1.16);
 const curveAhead=Math.abs(model()?.upcoming(o.z+55,track,190)||0);
 const cornerSpeed=clamp(297-curveAhead*45,168,300);
 let targetSpeed=Math.min(o.speed,cornerSpeed*skill);
 const sorted=participants.filter(v=>v.id!==o.id&&!v.finished&&v.z>o.z&&v.z-o.z<90&&Math.abs(v.lane-o.lane)<.26).sort((a,b)=>a.z-b.z);
 const ahead=sorted[0];
 o.passCooldown=Math.max(0,(o.passCooldown||0)-dt);
 let targetLane=o.baseLane;
 if(ahead){
  const gap=ahead.z-o.z;
  if(gap<40&&o.passCooldown<=0){
   const alternatives=LANE_OPTIONS.filter(l=>Math.abs(l-o.lane)>.23&&canUseLane(o,participants,l));
   alternatives.sort((a,b)=>Math.abs(a-o.lane)-Math.abs(b-o.lane));
   if(alternatives.length){o.passTarget=alternatives[0];o.passCooldown=2.9}
  }
  const overlap=Math.abs(ahead.lane-o.lane)<.27;
  if(overlap&&gap<clamp(13+o.velocity*.085,13,36))
   targetSpeed=Math.min(targetSpeed,Math.max(55,(ahead.velocity||0)+(gap-12)*1.1));
 }
 if(o.passTarget!=null){
  targetLane=o.passTarget;
  const unsafe=!canUseLane(o,participants,targetLane);
  if(unsafe){o.passTarget=null;o.passCooldown=1.8;targetLane=o.baseLane}
  else if(!ahead&&o.passCooldown<.9){o.passTarget=null;targetLane=o.baseLane}
 }
 // AI follows a trajectory; it never teleports between lanes.
 o.lane=approach(o.lane,clamp(targetLane,-.74,.74),dt*(.21+.07*skill));
 const diff=targetSpeed-o.velocity;
 const accel=diff>0?Math.min(80*skill,diff*1.9):Math.max(-165,diff*2.5);
 o.braking=accel<-18;
 o.velocity=clamp(o.velocity+accel*dt,0,o.speed);
 o.z+=o.velocity/3.6*dt;
}
function resolveInteractions(state){
 const p=state.player;
 let hit=null;
 for(const o of state.rivals){
  if(o.finished||p.collide>0||Math.abs(o.z-p.z)>5.2||Math.abs(o.lane-p.x)>.24)continue;
  const relative=Math.abs(p.speed-o.velocity);
  const loss=clamp(relative*.14+3,3,23);
  p.speed=Math.max(0,p.speed-loss);o.velocity=Math.max(0,o.velocity-loss*.20);
  p.health=clamp(p.health-(1.2+relative*.028),20,100);
  p.collide=.78;hit={other:o,impact:relative};
  break;
 }
 // Resolve traffic within nearby road strips, preserving order without lane kicks.
 const cars=state.rivals.filter(v=>!v.finished).sort((a,b)=>b.z-a.z);
 for(let i=0;i<cars.length;i++){
  const lead=cars[i];
  for(let j=i+1;j<cars.length;j++){
   const follow=cars[j],gap=lead.z-follow.z;
   if(gap>9)break;
   if(Math.abs(lead.lane-follow.lane)>.22)continue;
   const separation=6.5;
   if(gap<separation){follow.z=lead.z-separation;follow.velocity=Math.min(follow.velocity,lead.velocity)}
  }
 }
 return hit;
}
window.TurboRacePhysics={vehicle,planAI,resolveInteractions};
})();