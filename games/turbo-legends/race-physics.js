/* Turbo Legends 2.2 — skill-based arcade race dynamics.
 * Road-relative coordinates (x = +/-1 track edge), speed km/h, z metres.
 * Shared corner geometry drives steering and CPU speed planning. */
(()=>{'use strict';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const approach=(from,to,step)=>from<to?Math.min(to,from+step):Math.max(to,from-step);
const model=()=>window.TurboTrackModel;
const corner=(z,track)=>model()?.curvature(z,track)||0;
const lookAhead=(z,track,range)=>{
 let peak=0;
 for(let d=0;d<=range;d+=25){const k=corner(z+d,track);if(Math.abs(k)>Math.abs(peak))peak=k}
 return peak;
};
function cornerLimit(z,track,grip=1){
 const severity=Math.abs(lookAhead(z+35,track,115));
 return clamp((295-38*severity)*Math.sqrt(grip),190,306);
}
function vehicle(p,input,track,garage,dt){
 dt=clamp(dt,0,1/30);
 const gas=!!input.gas,brake=!!input.brake;
 const steer=Number(!!input.right)-Number(!!input.left);
 const weather=(track.theme==='alpine'||track.theme==='night')?.94:1;
 const grip=clamp((garage?.handling||1)*weather,.8,1.65);
 const acc=clamp(garage?.acceleration||1,.8,1.8);
 const max=(garage?.maxSpeed||300)*(.86+.14*p.health/100)+(p.slipstream||0)*8;
 const activeNitro=!!input.nitro&&gas&&!brake&&p.speed>55&&p.nitro>.1;
 // Acceleration builds over time; a high top speed does not mean instant 300 km/h.
 const engine=gas?28*acc*(1-.22*Math.pow(Math.min(p.speed/max,1),2)):0;
 const drag=2.5+p.speed*.038+.00011*p.speed*p.speed;
 const boost=activeNitro?64*(garage?.nitroBoost||1):0;
 p.speed=clamp(p.speed+(engine+boost-drag-(brake?180:0))*dt,0,activeNitro?max+65:max);
 const capacity=garage?.nitroCapacity||100;
 p.nitro=clamp(p.nitro-(activeNitro?11/(garage?.nitroEfficiency||1):0)*dt,0,capacity);
 p.boosting=activeNitro;
 p.topSpeed=Math.max(p.topSpeed,p.speed);
 p.gear=clamp(1+Math.floor(p.speed/51),1,6);
 // Curves exert sideways force only when moving quickly. Player input always
 // has enough authority to recover, but a fast uncorrected bend costs distance.
 const localCurve=corner(p.z,track),safeSpeed=cornerLimit(p.z,track,grip);
 const speedFactor=clamp(p.speed/235,0,1.40);
 const over=clamp((p.speed-safeSpeed)/85,0,1.7);
 const turnPush=localCurve*(.030+.10*speedFactor*speedFactor+.12*over);
 p.steerVelocity=approach(p.steerVelocity||0,steer,dt*(4.4+grip));
 const steeringPower=(.30+.52*speedFactor)*grip*(1-.12*over);
 const rescue=(p.offRoad&&steer===0&&p.speed<105)?-Math.sign(p.x)*.48:0;
 const target=p.steerVelocity*steeringPower-turnPush+rescue;
 p.lateralVelocity=approach(p.lateralVelocity||0,target,dt*(2.6+grip));
 p.x=clamp(p.x+p.lateralVelocity*dt*1.34,-1.55,1.55);
 p.drift=p.lateralVelocity;
 p.offRoad=Math.abs(p.x)>1.04;
 if(p.offRoad){
  const outside=clamp((Math.abs(p.x)-1.04)/.51,0,1);
  p.speed=Math.max(0,p.speed-Math.min(p.speed*.27,36+95*outside)*dt);
  p.health=Math.max(20,p.health-(.12+.38*outside)*dt*(p.speed>55?1:0));
 }
 // Fast corners scrub speed even if the player holds full throttle.
 const scrub=Math.abs(localCurve)>1.0?Math.max(0,over-.10)*Math.abs(localCurve)*16:0;
 p.speed=Math.max(0,p.speed-scrub*dt);
 p.z+=p.speed/3.6*dt;
 return {safeSpeed,curve:localCurve,overSpeed:over};
}
const LANES=[-.68,-.34,0,.34,.68];
function laneClear(driver,participants,lane){
 return participants.every(v=>{
  if(v.id===driver.id||v.finished)return true;
  const gap=v.z-driver.z;
  return gap < -20||gap>32||Math.abs(v.lane-lane)>.30;
 });
}
function planAI(o,participants,track,dt){
 if(o.finished)return;
 dt=clamp(dt,0,1/30);
 const skill=clamp(o.skill||1,.82,1.18);
 const range=clamp(o.velocity/3.6*2.1,85,210);
 const bend=Math.abs(lookAhead(o.z+40,track,range));
 const safe=clamp((301-33*bend)*(.93+.08*skill),205,310);
 let desired=Math.min(o.speed,safe);
 const traffic=participants.filter(v=>v.id!==o.id&&!v.finished&&v.z>o.z&&v.z-o.z<95&&Math.abs(v.lane-o.lane)<.27).sort((a,b)=>a.z-b.z);
 const ahead=traffic[0];
 o.passCooldown=Math.max(0,(o.passCooldown||0)-dt);
 let targetLane=o.baseLane;
 if(o.passTarget!=null)targetLane=o.passTarget;
 if(ahead){
  const gap=ahead.z-o.z;
  if(gap<50&&o.passTarget==null&&o.passCooldown<=0){
   const options=LANES.filter(l=>Math.abs(l-o.lane)>.25&&laneClear(o,participants,l));
   options.sort((a,b)=>Math.abs(a-o.lane)-Math.abs(b-o.lane));
   if(options.length){o.passTarget=options[0];o.passCooldown=3.5;targetLane=o.passTarget;}
  }
  if(Math.abs(o.lane-ahead.lane)<.29&&gap<36){
    desired=Math.min(desired,Math.max(40,(ahead.velocity||0)+(gap-19)*.85));
  }
 }
 if(o.passTarget!=null){
  if(!laneClear(o,participants,o.passTarget)){
   o.passTarget=null;o.passCooldown=2;targetLane=o.baseLane;
  }else if(!ahead&&o.passCooldown<1.2){
   o.passTarget=null;targetLane=o.baseLane;
  }
 }
 // CPU changes lanes gradually, and plans off a consistent snapshot each frame.
 o.lane=approach(o.lane,clamp(targetLane,-.73,.73),dt*(.19+.06*skill));
 const difference=desired-o.velocity;
 const acceleration=difference>=0?Math.min(32*skill,difference*.58):Math.max(-118,difference*2.4);
 o.braking=acceleration<-8;
 o.velocity=clamp(o.velocity+acceleration*dt,0,o.speed);
 o.z+=o.velocity/3.6*dt;
}
function resolveInteractions(state){
 const p=state.player;
 let hit=null;
 for(const o of state.rivals){
  if(o.finished||p.collide>0||Math.abs(o.z-p.z)>5.3||Math.abs(o.lane-p.x)>.24)continue;
  const relative=Math.abs(p.speed-o.velocity);
  const loss=clamp(2+relative*.12,3,21);
  p.speed=Math.max(0,p.speed-loss);
  o.velocity=Math.max(0,o.velocity-loss*.19);
  p.health=Math.max(20,p.health-(.9+relative*.022));
  p.collide=.70;hit={impact:relative,other:o};
  break;
 }
 const sorted=state.rivals.filter(o=>!o.finished).sort((a,b)=>b.z-a.z);
 for(let i=0;i<sorted.length;i++){
  const lead=sorted[i];
  for(let j=i+1;j<sorted.length;j++){
   const behind=sorted[j],gap=lead.z-behind.z;
   if(gap>8)break;
   if(Math.abs(lead.lane-behind.lane)>.22)continue;
   if(gap<6){behind.z=lead.z-6;behind.velocity=Math.min(behind.velocity,lead.velocity)}
  }
 }
 return hit;
}
window.TurboRacePhysics={vehicle,planAI,resolveInteractions,cornerLimit};
})();