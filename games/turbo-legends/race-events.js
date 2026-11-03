/* Turbo Legends 2.0 — track pickups, risk/reward and session-only events.
   Original artwork; no assets from other games. */
(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function reset(state){
 const types=['cash','nitro','boost','cash','cash','nitro','boost'];
 const pattern=[.09,.19,.33,.46,.60,.76,.88];
 state.pickups=[];
 for(let lap=0;lap<3;lap++)for(let j=0;j<pattern.length;j++){
  const kind=types[(j+lap)%types.length];
  state.pickups.push({z:(lap+pattern[j])*state.track.length,lane:[-.55,.52,-.08,.43,-.42,.1,.57][j],kind,claimed:false});
 }
 state.pickupMoney=0;
}
function update(state,garage){
 const p=state.player;
 for(const item of state.pickups||[]){
  if(item.claimed||Math.abs(item.z-p.z)>6||Math.abs(item.lane-p.x)>.24)continue;
  item.claimed=true;
  if(item.kind==='cash'){
   state.pickupMoney=(state.pickupMoney||0)+250;
   return '💰 БОНУС НА ТРАССЕ: +250 ₽';
  }
  if(item.kind==='nitro'){
   p.nitro=clamp(p.nitro+20,0,garage?.nitroCapacity||100);
   return '⚡ ЗАПАС НИТРО: +20';
  }
  p.speed=clamp(p.speed+45,0,(garage?.maxSpeed||300)+60);
  return '🚀 УСКОРЕНИЕ НА ТРАССЕ!';
 }
 return null;
}
function draw(state,ctx,pts){
 const items=state.pickups||[];
 for(const item of items){
  if(item.claimed)continue;
  const d=item.z-state.player.z;
  if(d<18||d>1700)continue;
  const index=Math.floor(d/24),f=(d-index*24)/24,a=pts[index],b=pts[index+1];
  if(!a||!b)continue;
  const width=a.width+(b.width-a.width)*f,y=a.y+(b.y-a.y)*f,x=a.x+(b.x-a.x)*f+item.lane*width*.88;
  const scale=a.scale+(b.scale-a.scale)*f,size=clamp(scale*65,5,58);
  const fill=item.kind==='cash'?'#f3cb63':item.kind==='nitro'?'#68d5e9':'#db86fb';
  ctx.save();ctx.translate(x,y-size*.46);ctx.fillStyle='#0e2030';ctx.strokeStyle=fill;ctx.lineWidth=Math.max(2,scale*5);
  ctx.beginPath();ctx.arc(0,0,size*.39,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=fill;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+Math.max(8,size*.49)+'px system-ui';
  ctx.fillText(item.kind==='cash'?'$':item.kind==='nitro'?'N':'⚡',0,1);ctx.restore();
 }
}
window.TurboRaceEvents={reset,update,draw};
})();