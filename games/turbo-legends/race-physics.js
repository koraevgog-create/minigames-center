/* Turbo Legends 1.4 — predictable arcade physics and orderly race traffic.
   Car coordinates: z metres, x/lane road-relative units, speed km/h. */
(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
const curvature=(z,track)=>window.TurboTrackModel?.curvature(z,track)||0;
const upcoming=(z,track,d=180)=>window.TurboTrackModel?.upcoming(z,track,d)||0;
function vehicle(p,input,track,garage,dt){
 const gas=!!input.gas,brake=!!input.brake,nitro=!!input.nitro;
 const steer=Number(!!input.right)-Number(!!input.left);
 const handling=clamp(garage?.handling||1,.7,1.5),capacity=garage?.nitroCapacity||100;
 const max=(garage?.maxSpeed||315)*(.84+.16*p.health/100);
 const boost=nitro&&gas&&!brake&&p.speed>55&&p.nitro>0;
 const power=gas?118*(garage?.acceleration||1)*(1-.48*Math.pow(p.speed/Math.max(200,max),1.2)):0;
 const resistance=8+.055*p.speed+.00022*p.speed*p.speed;
 p.speed=clamp(p.speed+(power+(boost?120*(garage?.nitroBoost||1):0)-resistance-(brake?270:0))*dt,0,boost?max+65:max);
 p.nitro=clamp(p.nitro+(boost?-35/(garage?.nitroEfficiency||1):7)*dt,0,capacity);
 p.boosting=boost;p.gear=clamp(Math.floor(p.speed/53)+1,1,6);
 p.topSpeed=Math.max(p.topSpeed,p.speed);
 // Steering is road-relative. The car does not spontaneously leave the asphalt.
 p.steerVelocity=lerp(p.steerVelocity||0,steer,dt*6.5*handling);
 const speedFactor=clamp(p.speed/170,0,1.5);
 const bend=curvature(p.z,track);
 const roadDrift=bend*.11*Math.pow(speedFactor,1.5)/handling;
 const desired=p.steerVelocity*(.33+.50*speedFactor)*handling-roadDrift;
 p.lateralVelocity=lerp(p.lateralVelocity||0,desired,dt*5);
 p.x=clamp(p.x+p.lateralVelocity*dt*1.3,-1.58,1.58);
 if(!steer&&Math.abs(bend)<.14&&Math.abs(p.lateralVelocity)<.025){
  p.lateralVelocity*=Math.max(0,1-dt*4);
 }
 p.drift=p.lateralVelocity;
 p.offRoad=Math.abs(p.x)>1.04;
 if(p.offRoad){
  const excess=clamp((Math.abs(p.x)-1.04)/.54,0,1);
  p.speed=Math.max(0,p.speed-(48+80*excess)*dt);
  if(p.speed>85)p.health=Math.max(20,p.health-(.13+.4*excess)*dt);
 }
 p.z+=p.speed/3.6*dt;
 return {bend,offRoad:p.offRoad};
}
function planAI(o,participants,track,dt){
 if(o.finished)return;
 // A stable speed target changes for the corner, never instant teleportation.
 const curve=Math.abs(upcoming(o.z+35,track,180));
 const skill=clamp(o.skill||.95,.78,1.17);
 const safe=clamp(270-curve*48,145,290)*skill;
 let desired=Math.min(o.speed,safe);
 const ahead=participants.filter(v=>v.id!==o.id&&!v.finished&&v.z>o.z&&v.z-o.z<65&&Math.abs(v.lane-o.lane)<.30).sort((a,b)=>a.z-b.z)[0];
 const nearby=participants.filter(v=>v.id!==o.id&&!v.finished&&Math.abs(v.z-o.z)<19);
 if(o.passCooldown>0)o.passCooldown=Math.max(0,o.passCooldown-dt);
 let laneTarget=o.baseLane;
 if(o.passTarget!==undefined&&o.passTarget!==null){
  const safeGap=nearby.every(v=>v.id===o.id||Math.abs(v.lane-o.passTarget)>.30);
  if(!safeGap){o.passTarget=null;o.passCooldown=1.4}
 }
 if(ahead){
  const gap=ahead.z-o.z;
  const relativeSpeed=o.velocity-(ahead.velocity||0);
  if(o.passTarget==null&&o.passCooldown<=0&&gap<45&&relativeSpeed>-8){
   const sides=[o.baseLane<0?-.69:.69,o.baseLane<0?.69:-.69];
   const free=sides.find(l=>nearby.every(v=>Math.abs(v.lane-l)>.34));
   if(free!==undefined){o.passTarget=free;o.passCooldown=3}
  }
  if(gap<28&&Math.abs(ahead.lane-o.lane)<.28)desired=Math.min(desired,Math.max(55,(ahead.velocity||0)-2+gap*.13));
 }
 if(o.passTarget!=null){
  laneTarget=o.passTarget;
  if(!ahead&&o.passCooldown<=0)o.passTarget=null;
 }
 // Discrete, deliberately slow lane changes; no lane oscillation from small gaps.
 o.lane=lerp(o.lane,clamp(laneTarget,-.72,.72),dt*.55);
 const delta=desired-o.velocity;
 const accel=delta>0?Math.min(delta*1.6,75*skill):Math.max(delta*2.5,-145);
 o.braking=accel<-12;
 o.velocity=clamp(o.velocity+accel*dt,0,o.speed);
 if(o.launchDelay>0){o.launchDelay=Math.max(0,o.launchDelay-dt);o.velocity=Math.min(o.velocity,(.18-o.launchDelay)*170+9)}
 o.z+=o.velocity/3.6*dt;
}
function resolveInteractions(state){
 const p=state.player;
 for(const other of state.rivals){
  if(other.finished||Math.abs(other.z-p.z)>5||Math.abs(other.lane-p.x)>.20||p.collide>0)continue;
  const relative=Math.abs(p.speed-other.velocity);
  const reduction=clamp(4+relative*.10,4,17);
  p.speed=Math.max(0,p.speed-reduction);
  other.velocity=Math.max(0,other.velocity-reduction*.25);
  p.health=Math.max(20,p.health-clamp(1+relative*.023,1,4));
  p.collide=.7;
  // Crucially: collisions do not force the steering axis sideways.
  return {impact:relative,other};
 }
 // Prevent AI overlap without pushing entire traffic columns sideways.
 for(let i=0;i<state.rivals.length;i++)for(let j=i+1;j<state.rivals.length;j++){
  const a=state.rivals[i],b=state.rivals[j];
  if(a.finished||b.finished||Math.abs(a.lane-b.lane)>.22||Math.abs(a.z-b.z)>7)continue;
  const leader=a.z>=b.z?a:b,follower=leader===a?b:a;
  follower.z=Math.min(follower.z,leader.z-6.5);
  follower.velocity=Math.min(follower.velocity,leader.velocity);
 }
 return null;
}
window.TurboRacePhysics={vehicle,planAI,resolveInteractions};
})();