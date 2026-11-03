/* Turbo Legends 1.3 — arcade vehicle dynamics and race AI.
   All distances are metres, velocities are km/h, delta time is seconds. */
(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
const corner=(z,t,range=230)=>window.TurboTrackModel?.upcoming(z,t,range)||0;
const bend=(z,t)=>window.TurboTrackModel?.curvature(z,t)||0;
function vehicle(p,inputs,track,garage,dt){
 const gas=!!inputs.gas,brake=!!inputs.brake,nitro=!!inputs.nitro;
 const capacity=garage?.nitroCapacity||100,handling=garage?.handling||1;
 const steering=Number(!!inputs.right)-Number(!!inputs.left);
 const maxSpeed=(garage?.maxSpeed||315)*(.78+.22*p.health/100);
 const boost=nitro&&gas&&!brake&&p.nitro>0&&p.speed>45;
 const power=(garage?.acceleration||1)*(gas?122*(1-.58*Math.pow(p.speed/Math.max(240,maxSpeed),1.4)):0);
 const drag=12+p.speed*.042+p.speed*p.speed*.0003;
 const braking=brake?295:0;
 const nitroPower=boost?165*(garage?.nitroBoost||1):0;
 const traction=clamp((handling*1.0)*(p.offRoad?.64:1)*(p.health<40?.84:1),.50,1.65);
 const curve=bend(p.z,track),speedRatio=p.speed/230;
 const safeSpeed=clamp(300-100*Math.abs(corner(p.z+65,track,180)),140,310)*handling;
 const overSpeed=clamp((p.speed-safeSpeed)/100,0,1.6);
 p.steerVelocity=lerp(p.steerVelocity||0,steering,dt*(3.0+traction*2.1));
 const steeringForce=p.steerVelocity*(.34+speedRatio*.57)*traction;
 const centrifugal=curve*(.24+.73*speedRatio*speedRatio)/traction;
 const gripPenalty=overSpeed*.55*Math.sign(curve);
 const targetLateral=steeringForce-centrifugal-gripPenalty;
 p.lateralVelocity=lerp(p.lateralVelocity||0,targetLateral,dt*(2.3+traction));
 p.x=clamp(p.x+p.lateralVelocity*dt*1.7,-2.25,2.25);
 p.drift=p.lateralVelocity;
 p.offRoad=Math.abs(p.x)>1.04;
 const edge=clamp((Math.abs(p.x)-1.04)/.9,0,1);
 const offRoadLoss=p.offRoad?70+edge*125:0;
 const extraCornerLoss=overSpeed>0.35?overSpeed*24:0;
 p.speed=clamp(p.speed+(power+nitroPower-drag-braking-offRoadLoss-extraCornerLoss)*dt,0,boost?maxSpeed+75:maxSpeed);
 p.nitro=clamp(p.nitro+(boost?-34/(garage?.nitroEfficiency||1):6.4)*dt,0,capacity);
 p.boosting=boost;
 p.topSpeed=Math.max(p.topSpeed,p.speed);
 p.gear=clamp(1+Math.floor(p.speed/55),1,6);
 if(p.offRoad&&p.speed>68)p.health=clamp(p.health-(.12+edge*.65)*dt,20,100);
 p.z+=p.speed/3.6*dt;
 return {curve,safeSpeed,overSpeed};
}
function planAI(o,participants,track,dt,time){
 const c=Math.abs(corner(o.z+40,track,195));
 const sharpness=clamp(c/2,0,1);
 const ideal=clamp(o.speed*(1-.44*sharpness)*(o.skill||1),110,o.speed);
 const lookahead=clamp(28+o.velocity*.26,45,105);
 const same=participants.filter(v=>v!==o&&!v.finished&&v.z>o.z&&v.z-o.z<lookahead&&Math.abs(v.lane-o.lane)<.31).sort((a,b)=>a.z-b.z)[0];
 const adjacent=participants.filter(v=>v!==o&&!v.finished&&Math.abs(v.z-o.z)<18);
 let target=clamp((o.baseLane||0)-bend(o.z,track)*.12,-.78,.78);
 if(same){
  const preferred=o.id%2?1:-1;
  const candidates=[clamp(same.lane+preferred*.56,-.78,.78),clamp(same.lane-preferred*.56,-.78,.78)];
  const open=candidates.find(candidate=>adjacent.every(v=>Math.abs(v.lane-candidate)>.24));
  if(open!==undefined)target=open;
  else o.blocked=true;
 }else o.blocked=false;
 o.lane=lerp(o.lane,target,dt*(o.blocked?.52:1.0)*(o.aggression||1));
 const close=same&&Math.abs(same.lane-o.lane)<.30&&same.z-o.z<23;
 const desired=Math.min(ideal,close?Math.max(35,(same.velocity||0)-6):ideal);
 const traction=(o.skill||1),throttle=desired>o.velocity+2?130*traction:0;
 const decel=desired<o.velocity?clamp(48+(o.velocity-desired)*3,45,230):0;
 const drag=5+o.velocity*.018;
 o.braking=decel>20;
 o.velocity=clamp(o.velocity+(throttle-decel-drag)*dt,0,o.speed);
 if(o.launchDelay>0){o.launchDelay=Math.max(0,o.launchDelay-dt);o.velocity=Math.min(o.velocity,Math.max(0,(.22-o.launchDelay)*250))}
 o.z+=o.velocity/3.6*dt;
}
function resolveInteractions(state,dt){
 const all=[{...state.player,lane:state.player.x,velocity:state.player.speed,isPlayer:true},...state.rivals];
 const p=state.player;
 for(const other of state.rivals){
  if(other.finished||Math.abs(other.z-p.z)>6.5||Math.abs(other.lane-p.x)>.24)continue;
  if(p.collide>0)continue;
  const impact=Math.abs(p.speed-other.velocity);
  const loss=clamp(impact*.35+4,6,38);
  p.speed=Math.max(0,p.speed-loss);
  other.velocity=Math.max(20,other.velocity-loss*.25);
  p.health=Math.max(15,p.health-clamp(impact*.05+2.5,2.5,11));
  p.collide=.85;
  p.lateralVelocity+=(p.x<other.lane?-.75:.75);
  other.lane=clamp(other.lane+(p.x<other.lane?.15:-.15),-.85,.85);
  return {impact,other};
 }
 for(let i=0;i<state.rivals.length;i++)for(let j=i+1;j<state.rivals.length;j++){
  const a=state.rivals[i],b=state.rivals[j];
  if(a.finished||b.finished||Math.abs(a.z-b.z)>5||Math.abs(a.lane-b.lane)>.21)continue;
  const slower=Math.min(a.velocity,b.velocity);
  a.velocity=Math.min(a.velocity,slower+9);b.velocity=Math.min(b.velocity,slower+9);
  a.lane=clamp(a.lane-.055,-.86,.86);b.lane=clamp(b.lane+.055,-.86,.86);
 }
 return null;
}
window.TurboRacePhysics={vehicle,planAI,resolveInteractions};
})();