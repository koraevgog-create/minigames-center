/* Turbo Legends 2.2 — skill-based arcade race dynamics.
 * Road-relative coordinates (x = +/-1 track edge), speed km/h, z metres.
 * Shared corner geometry drives steering and CPU speed planning. */
(()=>{'use strict';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
// One simulated metre advances several arcade road units, shared by every racer.
// This changes actual world motion, not just texture density or camera effects.
const ARCADE_PACE=2.7;
const approach=(from,to,step)=>from<to?Math.min(to,from+step):Math.max(to,from-step);
const model=()=>window.TurboTrackModel;
const corner=(z,track)=>model()?.curvature(z,track)||0;
const lookAhead=(z,track,range)=>{
 let peak=0;
 for(let d=0;d<=range;d+=25*ARCADE_PACE){const k=corner(z+d,track);if(Math.abs(k)>Math.abs(peak))peak=k}
 return peak;
};
function cornerLimit(z,track,grip=1){
 const severity=Math.abs(lookAhead(z+35*ARCADE_PACE,track,115*ARCADE_PACE));
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
 p.z+=p.speed/3.6*dt*ARCADE_PACE;
 return {safeSpeed,curve:localCurve,overSpeed:over};
}
const LANES=[-.72,-.36,0,.36,.72];
function canShift(car,others,lane){
 return others.every(o=>{
  if(o.id===car.id||o.finished)return true;
  const dz=(o.z-car.z)/ARCADE_PACE;
  // Check the entire lane-change corridor, not only the destination point.
  const corridor=Math.min(car.lane,lane)-.24<=o.lane&&o.lane<=Math.max(car.lane,lane)+.24;
  return !corridor||dz < -17 || dz > 41;
 });
}
function planAI(o,participants,track,dt){
 if(o.finished)return;
 dt=clamp(dt,0,1/30);
 const skill=clamp(o.skill||1,.82,1.19);
 const aggression=clamp(o.aggression??(.85+(o.id%7)*.055),.70,1.35);
 const curveAhead=Math.abs(lookAhead(o.z+50*ARCADE_PACE,track,clamp(o.velocity*.65,105,190)*ARCADE_PACE));
 const cornerSpeed=clamp((308-34*curveAhead)*(.95+.055*skill),204,310);
 const cruiseSpeed=Math.min(o.speed,cornerSpeed);
 let desired=cruiseSpeed;
 if(!Number.isFinite(o.cruiseLane))o.cruiseLane=o.baseLane;
 o.passCooldown=Math.max(0,(o.passCooldown||0)-dt);
 const inFront=participants.filter(v=>v.id!==o.id&&!v.finished&&
     v.z>o.z&&v.z-o.z<130*ARCADE_PACE&&Math.abs(v.lane-o.lane)<.33)
     .sort((x,y)=>x.z-y.z)[0];
 const nearest=inFront;
 if(nearest){
  const gap=(nearest.z-o.z)/ARCADE_PACE;
  const closing=o.velocity-(nearest.velocity||0);
  if(gap<70&&closing>-6&&o.passCooldown<=0&&o.passTarget==null){
    const candidates=LANES.filter(l=>Math.abs(l-o.lane)>.27&&canShift(o,participants,l));
    // Prefer the smaller lateral move, but vary preferences per driver.
    candidates.sort((a,b)=>(Math.abs(a-o.lane)-Math.abs(b-o.lane))+
      (o.id%2?1:-1)*(a-b)*.025);
    if(candidates.length){
      o.passTarget=candidates[0];
      o.passCooldown=4.3+.8/aggression;
    }
  }
  const sameCorridor=Math.abs(o.lane-nearest.lane)<.35;
  if(sameCorridor){
    // Continuous car following: no instant brake to 35 km/h at close distance.
    // Leaving room for the driver in front is more important than top speed.
    const desiredGap=16+o.velocity*.11;
    if(gap<desiredGap+13){
      const leaderSpeed=nearest.velocity??0;
      desired=Math.min(desired,Math.max(50,leaderSpeed+clamp((gap-desiredGap)*.95,-35,15)));
    }
  }
 }
 // Commit to a pass and settle in the new lane rather than weaving back.
 if(o.passTarget!=null){
  const target=o.passTarget;
  const blocked=participants.some(v=>v.id!==o.id&&!v.finished&&
   Math.abs(v.z-o.z)<13*ARCADE_PACE&&Math.abs(v.lane-target)<.23);
  if(blocked&&Math.abs(o.lane-target)>.17){
    o.passTarget=null;o.passCooldown=2.2;
  }else if(Math.abs(o.lane-target)<.04){
    o.cruiseLane=target;o.passTarget=null;
    o.passCooldown=Math.max(o.passCooldown,2);
  }
 }
 const bend=corner(o.z+32*ARCADE_PACE,track);
 const apexShift=clamp(-bend*.055,-.10,.10);
 const laneTarget=clamp((o.passTarget??o.cruiseLane)+apexShift,-.78,.78);
 // Each racer has a different, bounded lateral response.
 o.lane=approach(o.lane,laneTarget,dt*(.17+.09*skill)*aggression);
 const diff=desired-o.velocity;
 const acceleration=diff>0?Math.min((26+o.id%4)*skill,diff*.58):Math.max(-119,diff*2.1);
 o.braking=acceleration<-10;
 o.velocity=clamp(o.velocity+acceleration*dt,0,o.speed);
 o.z+=o.velocity/3.6*dt*ARCADE_PACE;
}
function resolveInteractions(state){
 const p=state.player;let hit=null;
 for(const o of state.rivals){
  if(o.finished||p.collide>0||Math.abs(o.z-p.z)>5.3*ARCADE_PACE||Math.abs(o.lane-p.x)>.24)continue;
  const relative=Math.abs(p.speed-o.velocity),loss=clamp(2+relative*.12,3,21);
  p.speed=Math.max(0,p.speed-loss);
  o.velocity=Math.max(0,o.velocity-loss*.19);
  p.health=Math.max(20,p.health-(.9+relative*.022));
  p.collide=.7;hit={impact:relative,other:o};break;
 }
 // Never teleport cars backward: instead match velocity when traffic compresses.
 // Position jumps were perceived as pile-ups and sudden collisions.
 const all=state.rivals.filter(o=>!o.finished);
 for(const following of all){
  const leader=all.filter(o=>o!==following&&o.z>=following.z&&o.z-following.z<13*ARCADE_PACE&&
    Math.abs(o.lane-following.lane)<.26).sort((a,b)=>a.z-b.z)[0];
  if(leader){
   following.velocity=Math.min(following.velocity,Math.max(0,leader.velocity+((leader.z-following.z)/ARCADE_PACE-7)*2));
  }
 }
 return hit;
}
window.TurboRacePhysics={vehicle,planAI,resolveInteractions,cornerLimit,worldScale:ARCADE_PACE};
})();