/* Turbo Legends 1.2 — original sprite-style pseudo-3D racing renderer.
   Inspired by the technology of classic 16-bit arcade racers. No game artwork is reused. */
(()=>{'use strict';
const V=document.createElement('canvas');V.width=960;V.height=540;
const c=V.getContext('2d',{alpha:false});
const W=960,H=540,HZ=214,DEPTH=245,MAX=3000,STEP=24;
const ROADSIDE_SPACING=58,MARKER_SPACING=29;
const palettes={
 coast:{sky:['#5aa2d5','#c4e9ef'],far:'#6a96ba',mid:'#48899f',near:'#378b83',grass:['#428b56','#468f57'],road:['#454b5b','#474d60'],sand:'#e0bd87'},
 alpine:{sky:['#4478ba','#b6dbef'],far:'#607b9d',mid:'#546f8c',near:'#436f75',grass:['#43835e','#498963'],road:['#414b5e','#434c5d'],sand:'#9cc3ba'},
 desert:{sky:['#a95d67','#ffcf9c'],far:'#ac6e65',mid:'#aa6759',near:'#9d6950',grass:['#ac7351','#b47b58'],road:['#55505c','#57525e'],sand:'#d8ab74'},
 night:{sky:['#101936','#48578d'],far:'#252d50',mid:'#273451',near:'#2b3e53',grass:['#263a50','#2a4054'],road:['#303548','#33384d'],sand:'#647489'}
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const mod=(a,b)=>((a%b)+b)%b;
const polygon=(pts,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill()};
const trapezoid=(a,b,fa,fb,color)=>polygon([[a.x+a.width*fa,a.y],[a.x+a.width*fb,a.y],[b.x+b.width*fb,b.y],[b.x+b.width*fa,b.y]],color);
function mountains(layer,shift,col,base,amp){
 const step=14;c.fillStyle=col;c.beginPath();c.moveTo(-step,HZ+86);
 for(let x=-step;x<W+step;x+=step){
  const v=(x+shift*layer)/175;
  const peak=Math.pow(Math.abs(Math.sin(v*1.8+layer)),2)*.70+Math.pow(Math.abs(Math.sin(v*.93+1.6*layer)),3)*.34;
  const jag=Math.abs(Math.sin(v*6+layer))*amp*.12;
  c.lineTo(x,base-peak*amp-jag);
 }
 c.lineTo(W+step,HZ+105);c.lineTo(-step,HZ+105);c.fill();
}
function scenery(state,pal){
 const t=state.track.theme,z=state.player.z;
 const sky=c.createLinearGradient(0,0,0,HZ+110);sky.addColorStop(0,pal.sky[0]);sky.addColorStop(1,pal.sky[1]);c.fillStyle=sky;c.fillRect(0,0,W,H);
 if(t!=='night'){
  const sunX=t==='desert'?745:762,sunY=t==='desert'?102:106;c.fillStyle='#ffe4a4';
  c.beginPath();c.arc(sunX,sunY,t==='desert'?32:24,0,Math.PI*2);c.fill();
 }else{
  for(let i=0;i<110;i++){const x=mod(i*113+19,950),y=mod(i*59+7,190);c.fillStyle=i%4?'#c4d8ed':'#f4e6b7';c.fillRect(x,y,i%5?1:2,i%5?1:2)}
 }
 const par=z*.09+state.player.x*65;
 mountains(1,par*.13,pal.far,HZ+49,86);
 mountains(2,par*.22,pal.mid,HZ+58,58);
 mountains(3,par*.36,pal.near,HZ+73,35);
 if(t==='night'){
  for(let i=0;i<45;i++){
   const x=mod(i*71-par*.18,W+95)-45,w=28+(i*19)%29,ht=25+(i*47)%115;
   c.fillStyle=i%3?'#182b42':'#1c3047';c.fillRect(x,HZ+70-ht,w,ht);
   c.fillStyle='#f6cc86';for(let u=0;u<3;u++)for(let v=0;v<5;v++)if((i+u*5+v)%4!==0)c.fillRect(x+6+u*9,HZ+79-ht+v*17,3,5);
  }
 }else if(t==='coast'){
  c.fillStyle='#69b4c7';c.fillRect(0,HZ+70,W,25);
 }
 c.fillStyle=pal.grass[0];c.fillRect(0,HZ+79,W,H-HZ-79);
}
function model(state){
 // Actual road segments projected from the camera; traffic and roadside details
 // use the same points, so their distance scales match the road itself.
 if(window.TurboSegmentRoad)return window.TurboSegmentRoad.sample(state,W,H);
 const pts=[];for(let i=0;i<=MAX/STEP;i++){
  const d=i*STEP,scale=DEPTH/(d+DEPTH),width=W*.56*scale;
  pts.push({z:state.player.z+d,d,scale,width,x:W/2-state.player.x*width*.85,y:HZ+(H-HZ)*scale});
 }
 return pts;
}
function asphalt(state,pal,pts){
 const theme=state.track.theme;
 for(let i=pts.length-2;i>=0;i--){
  const near=pts[i],far=pts[i+1];if(near.y<=far.y)continue;
  const stripe=Math.floor(far.z/54)%2;
  c.fillStyle=pal.grass[Math.floor(far.z/165)%2];c.fillRect(0,far.y,W,near.y-far.y+2);
  const shoulder=theme==='desert'?pal.sand:theme==='alpine'?'#a1a7a6':'#576978';
  trapezoid(far,near,-1.16,1.16,shoulder);
  const curb=Math.floor(far.z/27)%2?'#f8ebdf':'#cd3242';
  for(const side of [-1,1]){
   trapezoid(far,near,side*1.00,side*1.115,curb);
  }
  trapezoid(far,near,-1,1,pal.road[stripe]);
  for(const side of [-1,1]){
   trapezoid(far,near,side*.965,side*.986,'#dbe4e8');
  }
  const marker=mod(far.z,70)<35;
  if(marker)for(const pos of [-1/3,1/3]){
    trapezoid(far,near,pos-.012,pos+.012,'#e1e0d7');
  }
  // A little asphalt texture, intentionally subdued.
  if(Math.floor(far.z/27)%7===0){
   c.strokeStyle='#d3deec12';c.lineWidth=1;c.beginPath();
   c.moveTo(far.x-far.width*.92,far.y);c.lineTo(near.x+near.width*.92,near.y);c.stroke();
  }
 }
}
function tree(x,y,size,t,seed){
 c.save();c.translate(x,y);const h=size;
 if(t==='desert'){
  polygon([[-h*.10,0],[-h*.11,-h*.85],[-h*.02,-h*.98],[h*.08,-h*.77],[h*.10,0]],'#9f584d');
  polygon([[-h*.68,-h*.08],[-h*.16,-h*.72],[h*.02,-h*.60],[-h*.35,0]],'#c88663');
  polygon([[h*.11,-h*.15],[h*.31,-h*.8],[h*.58,-h*.3]],'#ad694e');
 }else if(t==='night'){
  polygon([[-h*.25,0],[-h*.25,-h*.95],[h*.23,-h*.95],[h*.24,0]],'#17273d');
  c.fillStyle='#e6c785';for(let i=0;i<4;i++)for(let j=0;j<5;j++)if((i+j+seed)%3)c.fillRect(-h*.17+i*h*.11,-h*.83+j*h*.15,h*.055,h*.07);
  c.fillStyle='#52cdd6';c.fillRect(-h*.26,-h*.98,h*.51,h*.055);
 }else{
  c.fillStyle='#513b38';c.fillRect(-h*.07,-h*.50,h*.14,h*.50);
  const dark=t==='alpine'?'#214c4f':'#1b6552',light=t==='alpine'?'#457d78':'#378968';
  for(let i=0;i<3;i++){
   const yy=-h*(.25+i*.24),r=h*(.42-i*.085);
   polygon([[-r,yy],[0,yy-h*.38],[r,yy]],i%2?light:dark);
  }
  c.fillStyle='#74b496';c.fillRect(-h*.06,-h*.60,h*.05,h*.31);
 }
 c.restore();
}
function roadside(state,pts){
 const t=state.track.theme;
 // Distance-based placement prevents roadside assets from flickering as the camera moves.
 const start=Math.floor(state.player.z/ROADSIDE_SPACING),end=Math.ceil((state.player.z+MAX)/ROADSIDE_SPACING);
 for(let k=end;k>=start;k--){
  const d=k*ROADSIDE_SPACING-state.player.z;if(d<0||d>MAX)continue;
  const idx=clamp(Math.floor(d/STEP),0,pts.length-2),fraction=(d-idx*STEP)/STEP;
  const a=pts[idx],b=pts[idx+1];if(!a||!b)continue;
  const p={x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,width:a.width+(b.width-a.width)*fraction,scale:a.scale+(b.scale-a.scale)*fraction};
  const height=clamp(195*p.scale,3,185);
  for(const side of [-1,1]){
   const x=p.x+side*(p.width*1.32+12*p.scale);
   tree(x,p.y,height,t,k+side);
  }
  if(k%5===0){
   const x=p.x+p.width*1.10,sz=clamp(p.scale*100,5,90);
   c.fillStyle='#e7edf1';c.fillRect(x-sz*.06,p.y-sz*.7,sz*.1,sz*.72);
   c.fillStyle='#16304b';c.fillRect(x-sz*.5,p.y-sz*1.1,sz*.95,sz*.40);
   c.fillStyle='#fff0c8';c.font='bold '+Math.max(6,sz*.16)+'px system-ui';c.textAlign='center';
   c.fillText('TURBO',x,p.y-sz*.85);
  }
 }
}
function car(x,bottom,width,color,lean,braking,player,variant=0){
 const w=width,h=w*(variant===1?.69:.60);if(w<3)return;
 c.save();c.translate(x,bottom);c.rotate(lean);
 c.fillStyle='#090b1499';c.beginPath();c.ellipse(0,0,w*.59,w*.13,0,0,Math.PI*2);c.fill();
 // Broad shadow, sidewalls and tires.
 for(const side of [-1,1]){
  c.fillStyle='#111a26';c.fillRect(side*w*.37-w*.09,-h*.49,w*.18,h*.45);
  c.fillStyle='#536074';c.fillRect(side*w*.44-w*.016,-h*.37,w*.032,h*.20);
 }
 const paint=c.createLinearGradient(-w*.43,-h*.8,w*.36,h*.1);
 paint.addColorStop(0,'#f7f6f0');paint.addColorStop(.10,color);paint.addColorStop(.66,color);paint.addColorStop(1,'#232b42');
 polygon([[-w*.47,-h*.08],[-w*.45,-h*.48],[-w*.27,-h*.86],[w*.27,-h*.86],[w*.45,-h*.48],[w*.47,-h*.08],[w*.41,-h*.01],[-w*.41,-h*.01]],paint);
 polygon([[-w*.32,-h*.50],[-w*.20,-h*.79],[w*.20,-h*.79],[w*.32,-h*.50]],'#0c2639');
 polygon([[-w*.23,-h*.72],[-w*.18,-h*.78],[w*.03,-h*.78],[-w*.05,-h*.60]],'#9dd4ed8c');
 polygon([[-w*.39,-h*.43],[-w*.27,-h*.50],[w*.27,-h*.50],[w*.39,-h*.43]],'#172c40');
 polygon([[-w*.38,-h*.37],[w*.38,-h*.37],[w*.40,-h*.17],[-w*.40,-h*.17]],'#172839');
 polygon([[-w*.32,-h*.35],[w*.1,-h*.35],[w*.29,-h*.19],[-w*.26,-h*.19]],'#628fa88a');
 c.fillStyle='#111a24';c.fillRect(-w*.46,-h*.10,w*.92,h*.09);
 c.fillStyle=braking?'#ffe3bc':'#fa3753';
 for(const side of [-1,1])c.fillRect(side*w*.32-w*.095,-h*.16,w*.19,h*.075);
 c.fillStyle='#b6cbd5';c.fillRect(-w*.10,-h*.09,w*.20,h*.045);
 c.fillStyle='#172132';c.fillRect(-w*.48,-h*.51,w*.96,h*.035);
 c.fillStyle='#c9d5e0';c.fillRect(-w*.43,-h*.53,w*.86,h*.015);
 if(variant===1||player){c.fillStyle='#171c28';c.fillRect(-w*.51,-h*.59,w*1.02,h*.045);}
 if(player){
  c.fillStyle='#dee7eb';c.fillRect(-w*.12,-h*.10,w*.24,h*.045);
  c.fillStyle='#14334c';c.font='900 '+Math.max(7,w*.086)+'px system-ui';c.textAlign='center';c.fillText('TL',0,-h*.061);
 }
 c.restore();
}
function cars(state,pts){
 const p=state.player;
 const cars=state.rivals.map(r=>({r,d:r.z-p.z}))
   .filter(o=>o.d>5&&o.d<MAX-80).sort((a,b)=>b.d-a.d);
 for(const {r,d} of cars){
  const idx=clamp(Math.floor(d/STEP),0,pts.length-2),f=(d-idx*STEP)/STEP;
  const a=pts[idx],b=pts[idx+1];if(!a||!b)continue;
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f,width=a.width+(b.width-a.width)*f;
  const px=x+r.lane*width*.88;
  const size=clamp(width*.42,2.5,151);
  if(y>HZ-20&&y<H+50)car(px,y,size,r.color,Math.sin(state.time*.28+r.drive)*.025,r.braking,false,r.id%4);
 }
 const pulse=p.collide>0?Math.sin(state.time*52)*Math.min(10,p.collide*7):0;
 const lean=clamp(-(p.lateralVelocity||p.drift||0)*.085,-.11,.11);
 if(p.boosting){
  for(const side of [-1,1]){
   polygon([[W/2+side*46-13,509],[W/2+side*46+13,509],
     [W/2+side*46,530+Math.sin(state.time*49+side)*11]],'#45cfff');
  }
 }
 const px=W*.5+p.x*12+pulse,py=H-8+Math.abs(pulse)*.10;
 car(px,py,176,p.color,lean,!!(state.keys.brake||state.touch.brake),true,1);
}
function weather(state){
 const theme=state.track.theme;
 if(theme==='alpine'||theme==='night'){
  c.fillStyle=theme==='alpine'?'#f2f8fbc9':'#82cbd641';
  for(let i=0;i<44;i++){
   const x=mod(i*157+23+Math.sin(i*19)*26+state.time*(i%3+1)*-30,W);
   const y=mod(i*71+state.time*(70+(i%7)*23),H);
   c.fillRect(x,y,i%4?2:3,i%4?2:3);
  }
 }
 if(state.phase==='race'&&state.player.speed>210){
  const alpha=Math.min(.20,(state.player.speed-200)/440);c.strokeStyle='rgba(235,245,255,'+alpha+')';
  for(let i=0;i<15;i++){const x=mod(i*139+state.time*270,W),y=mod(i*89+state.time*220,H);c.beginPath();c.moveTo(x,y);c.lineTo(x+(x-W/2)*.055,y+24);c.stroke()}
 }
}
function render(state,canvas,out){
 if(!state||!state.track)return false;
 const pal=palettes[state.track.theme]||palettes.coast;
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
 scenery(state,pal);
 const pts=model(state);asphalt(state,pal,pts);roadside(state,pts);window.TurboRaceEvents?.draw(state,c,pts);cars(state,pts);weather(state);
 if(state.phase==='pause'){c.fillStyle='#071322a1';c.fillRect(0,0,W,H);c.fillStyle='#f5ebd2';c.font='900 48px system-ui';c.textAlign='center';c.fillText('ПАУЗА',W/2,H/2)}
 const dpr=Math.min(devicePixelRatio||1,2),bw=Math.max(320,innerWidth),bh=Math.max(300,innerHeight);
 if(canvas.width!==Math.round(bw*dpr)||canvas.height!==Math.round(bh*dpr)){canvas.width=Math.round(bw*dpr);canvas.height=Math.round(bh*dpr)}
 out.setTransform(1,0,0,1,0,0);out.imageSmoothingEnabled=false;
 out.drawImage(V,0,0,canvas.width,canvas.height);
 return true;
}
window.TurboRetroRenderer={render};
})();