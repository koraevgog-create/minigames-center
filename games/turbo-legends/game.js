/* TURBO LEGENDS 0.1 — original pseudo-3D arcade racing game. No external dependencies. */
(()=>{'use strict';
const canvas=document.getElementById('race'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const tracks={
 coast:{name:'Лазурное побережье',sky:['#317bb0','#b6d8f1'],mount:'#6da1b1',ground:['#3d9769','#419b6e'],road:['#394154','#424a5e'],length:6500,twist:1.1,theme:'coast'},
 alpine:{name:'Альпийский перевал',sky:['#3a76af','#d5ebfa'],mount:'#617f9b',ground:['#53835c','#5a8e63'],road:['#3b4351','#464f60'],length:7200,twist:1.65,theme:'alpine'},
 desert:{name:'Красный каньон',sky:['#d36d5e','#ffd7a3'],mount:'#a45c55',ground:['#ca9462','#d39d68'],road:['#48434a','#514a50'],length:6800,twist:1.3,theme:'desert'},
 night:{name:'Ночной мегаполис',sky:['#11132c','#33436d'],mount:'#202c48',ground:['#293248','#303950'],road:['#292e40','#31374b'],length:6900,twist:1.2,theme:'night'}
};
const colors=['#23b5cf','#ecb74e','#9f89e8','#ee7749','#a9d14d','#d5e4ef','#d85695','#55a9fa','#8dc2ac','#f2aa63','#ea5e69','#a4bfd6','#d5ad64','#5dd4a7','#7d94e9','#d69add','#e6e6b8','#5bcded','#ff8f5f'];
const names=['RAVEN','BLAZE','NOVA','STRIKE','FALCON','VECTOR','PHANTOM','SPEEDSTER','LANCER','ECLIPSE','BOLT','CIPHER','ATLAS','VIPER','DRIFT','NEON','RAPTOR','FURY','TEMPEST'];
const state={phase:'menu',track:tracks.coast,difficulty:'normal',time:0,count:3,last:0,player:{z:0,x:0,speed:0,nitro:100,health:100,lap:1,finished:false,color:'#ef424e',collide:0,drift:0,offRoad:false,boosting:false,slipstream:0,topSpeed:0,gear:1},rivals:[],keys:{},touch:{},position:20,results:[],engine:null,audio:false,soundTime:0,laps:[],lastLapTime:0,flashUntil:0,flashText:''};
const RECORD_KEY='turbo-legends-records-01';let bestRecords={};try{bestRecords=JSON.parse(localStorage.getItem(RECORD_KEY)||'{}')||{}}catch{};let lastBoardAt=-10;const lapCount=3,roadWidth=1900,drawDistance=2700,cameraHeight=900;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,wrap=(v,l)=>((v%l)+l)%l;
function curvature(z){return window.TurboTrackModel?.curvature(z,state.track)||0;}
function elevation(z){const w=wrap(z,state.track.length);return Math.sin(w/470)*140+Math.sin(w/173)*39;}
function project(distance,position,height,w,h){const depth=Math.max(1,distance);const perspective=370/(depth+370);const road=w*.47*perspective;const y=h*.34+(h*.73)*perspective+height*perspective*.065;const x=w/2+position*perspective*w/1800;return {x,y,width:road,scale:perspective};}
function layout(){const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(320,innerWidth),h=Math.max(300,innerHeight);if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);return {w,h};}
function poly(pts,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fill();}
function quad(a,b,color){poly([[a.x-a.width,a.y],[a.x+a.width,a.y],[b.x+b.width,b.y],[b.x-b.width,b.y]],color)}

function skyline(w,h,t){
 const g=ctx.createLinearGradient(0,0,0,h*.60);g.addColorStop(0,t.sky[0]);g.addColorStop(1,t.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 const sunX=w*.78+Math.sin(state.player.z/1100)*24,sunY=h*.22;
 ctx.save();ctx.shadowColor=t.theme==='night'?'#9ccaff':'#ffdf9e';ctx.shadowBlur=34;ctx.fillStyle=t.theme==='night'?'#f5f7ff':'#ffdb90';ctx.beginPath();ctx.arc(sunX,sunY,24,0,7);ctx.fill();ctx.restore();
 const parallax=state.player.z*.021+state.player.x*75;
 for(let layer=0;layer<3;layer++){const y0=h*(.40+layer*.03),scale=[.14,.11,.065][layer];ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w+18;x+=13){const v=(x+parallax*(layer+1))/w;const peaks=Math.pow(Math.abs(Math.sin(v*8+layer)),1.7)*.75+Math.abs(Math.sin(v*19+layer*1.5))*.25;ctx.lineTo(x,y0-peaks*h*scale)}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=layer===0?t.theme==='desert'?'#b47c70':'#789ab0':layer===1?t.mount:t.ground[0];ctx.fill();}
 ctx.fillStyle=t.ground[0];ctx.fillRect(0,h*.48,w,h*.52);
 if(t.theme==='night'){for(let i=0;i<52;i++){const x=((i*97-parallax*.3)%(w+120)+w+120)%(w+120)-60;const ht=40+(i*37)%130;ctx.fillStyle=i%2?'#17243d':'#23324b';ctx.fillRect(x,h*.47-ht,32+(i*7)%28,ht);ctx.fillStyle='#e9d69c';for(let j=0;j<4;j++)if((i+j)%3===0)ctx.fillRect(x+7+j*8,h*.47-ht+14,3,5)}}
}
function roadCenter(d){
 let heading=0,lateral=0;for(let a=0;a<d;a+=35){const step=Math.min(35,d-a);heading+=curvature(state.player.z+a)*step*.00052;lateral+=Math.sin(heading)*step}return lateral;
}
function roadPoint(d,w,h){
 const p=project(Math.max(1,d),0,elevation(state.player.z+d)-elevation(state.player.z),w,h);
 p.x=w*.5 + roadCenter(d)*p.scale*w/630 - state.player.x*p.width*.75;
 return p;
}
function roadView(w,h){
 const t=state.track,seg=22,road=[];
 for(let d=0;d<=drawDistance;d+=seg)road.push({d,z:state.player.z+d,...roadPoint(d,w,h)});
 for(let i=road.length-2;i>=0;i--){
  const far=road[i+1],near=road[i];if(near.y<=far.y)continue;
  const band=Math.floor(far.z/125)%2,edgeStripe=Math.floor(far.z/46)%2;
  ctx.fillStyle=t.ground[band];ctx.fillRect(0,far.y,w,near.y-far.y+2);
  quad({...far,width:far.width*1.22},{...near,width:near.width*1.22},band?'#4b5155':'#343c40');
  quad({...far,width:far.width*1.12},{...near,width:near.width*1.12},edgeStripe?'#e9edf1':'#c84047');
  quad(far,near,t.road[band]);
  // Continuous outside white lines and light-absorbing asphalt shoulders.
  for(const side of [-1,1]){
   const f=far.width*side,n=near.width*side;
   poly([[far.x+f*.97,far.y],[far.x+f*.99,far.y],[near.x+n*.99,near.y],[near.x+n*.97,near.y]],'#dce6e7');
   const guardFar={x:far.x+side*far.width*1.30,y:far.y},guardNear={x:near.x+side*near.width*1.30,y:near.y};
   if(Math.floor(far.z/92)%3===0){
    const height=Math.max(2,near.scale*29);
    ctx.strokeStyle='#aabcc9';ctx.lineWidth=Math.max(1,near.scale*6);
    ctx.beginPath();ctx.moveTo(guardFar.x,guardFar.y-height*.65);ctx.lineTo(guardNear.x,guardNear.y-height);ctx.stroke();
   }
  }
  if(Math.floor(far.z/64)%3===0)for(const lane of [-1/3,1/3]){
   const fw=Math.max(.7,far.width*.009),nw=Math.max(1,near.width*.009);
   poly([[far.x+far.width*lane-fw,far.y],[far.x+far.width*lane+fw,far.y],[near.x+near.width*lane+nw,near.y],[near.x+near.width*lane-nw,near.y]],'#e8e9e2');
  }
  // Grid markings are painted on the asphalt, not floating in the scene.
  if(far.z<175&&Math.floor(far.z/12)%4===0){
   for(const lane of [-.53,.53]){
    poly([[far.x+far.width*(lane-.17),far.y],[far.x+far.width*(lane+.17),far.y],
    [near.x+near.width*(lane+.17),near.y],[near.x+near.width*(lane-.17),near.y]],'#e9e6d48a');
   }
  }
 }
 return road;
}
function roadside(w,h,road){
 const theme=state.track.theme;
 for(let i=road.length-3;i>2;i-=3){const p=road[i],idx=Math.floor(p.z/105);if(idx%3!==0)continue;const k=clamp(p.scale*2.1,.02,1.0);
 for(const side of [-1,1]){const x=p.x+side*p.width*1.28,y=p.y;
 ctx.save();ctx.translate(x,y);ctx.scale(k,k);
 if(theme==='desert'){ctx.fillStyle='#ad5b48';poly([[-20,0],[-28,-94],[-2,-132],[29,-89],[37,0]],'#a96150');poly([[-24,-45],[-5,-117],[14,-55]],'#db9270')}
 else if(theme==='night'){ctx.fillStyle='#1a2944';ctx.fillRect(-21,-146,42,146);ctx.fillStyle='#ffebaa';for(let j=0;j<5;j++)ctx.fillRect(-11,-130+j*22,6,8)}
 else{ctx.fillStyle='#49382c';ctx.fillRect(-6,-88,12,88);poly([[-48,-44],[0,-193],[48,-44]],'#235744');poly([[-40,-100],[0,-223],[40,-100]],idx%2?'#266849':'#2d7751');poly([[-31,-142],[0,-240],[31,-142]],'#368563')}
 ctx.restore();}
 }
}
function carShape(x,y,size,color,lean=0,player=false,brake=false){
 const w=size,h=size*.72;if(w<3)return;
 ctx.save();ctx.translate(x,y);ctx.rotate(lean);
 ctx.shadowColor='#050b18';ctx.shadowBlur=w*.16;ctx.fillStyle='#0710199c';
 ctx.beginPath();ctx.ellipse(0,h*.23,w*.59,h*.17,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 // Wheels have depth, rubber highlights and visible wheel arches.
 for(const side of [-1,1]){
  ctx.fillStyle='#0c1019';ctx.fillRect(side*w*.34-(side<0?w*.13:0),-h*.33,w*.13,h*.49);
  ctx.fillStyle='#566174';ctx.fillRect(side*w*.41-w*.015,-h*.27,w*.03,h*.3);
 }
 const paint=ctx.createLinearGradient(-w*.48,-h*.78,w*.48,h*.21);
 paint.addColorStop(0,'#fff7eb');paint.addColorStop(.1,color);paint.addColorStop(.56,color);paint.addColorStop(1,'#222b39');
 poly([[-w*.45,h*.13],[-w*.47,-h*.11],[-w*.36,-h*.58],[-w*.22,-h*.82],[w*.22,-h*.82],[w*.36,-h*.58],[w*.47,-h*.11],[w*.45,h*.13]],paint);
 // Rear glass, roof and rear windshield reflections.
 poly([[-w*.28,-h*.49],[-w*.19,-h*.75],[w*.19,-h*.75],[w*.28,-h*.49]],'#0a2538');
 poly([[-w*.22,-h*.69],[-w*.16,-h*.74],[w*.02,-h*.74],[-w*.07,-h*.56]],'#9bd5ee62');
 poly([[-w*.31,-h*.46],[w*.31,-h*.46],[w*.39,-h*.13],[-w*.39,-h*.13]],'#253748');
 poly([[-w*.23,-h*.42],[w*.09,-h*.42],[w*.25,-h*.20],[-w*.27,-h*.20]],'#8ac6dc54');
 // Bumper, diffuser, spoiler and tail-lights.
 ctx.fillStyle='#121923';ctx.fillRect(-w*.46,h*.105,w*.92,h*.085);
 ctx.fillStyle='#9ba8b8';ctx.fillRect(-w*.12,h*.14,w*.24,h*.033);
 ctx.fillStyle=brake?'#ffefb8':'#e82e46';
 for(const side of [-1,1]){
  ctx.fillRect(side*w*.33-w*.095,h*.025,w*.19,h*.08);
  ctx.fillStyle='#ffbcb5';ctx.fillRect(side*w*.34-w*.065,h*.04,w*.13,h*.02);
  ctx.fillStyle=brake?'#ffefb8':'#e82e46';
 }
 ctx.fillStyle='#101924';ctx.fillRect(-w*.50,-h*.48,w,h*.045);
 ctx.fillStyle='#aab4c5';ctx.fillRect(-w*.47,-h*.49,w*.94,h*.014);
 if(player){ctx.fillStyle='#f4f3ed';ctx.fillRect(-w*.16,h*.08,w*.32,h*.055);ctx.fillStyle='#29394b';ctx.font='900 '+Math.max(6,Math.round(w*.085))+'px system-ui';ctx.textAlign='center';ctx.fillText('TL',0,h*.12)}
 ctx.restore();
}
function opponents(w,h){
 const visible=state.rivals.map(o=>({o,d:o.z-state.player.z})).filter(v=>v.d>15&&v.d<drawDistance-70).sort((a,b)=>b.d-a.d);
 for(const {o,d} of visible){const p=roadPoint(d,w,h);const width=clamp(w*.24*p.scale,8,Math.min(w*.18,178));const x=p.x+o.lane*p.width*.96;carShape(x,p.y,width,o.color,0,false,o.braking);}
}
function playerCar(w,h){
 if(state.phase==='menu')return;
 const p=state.player;const steering=(state.keys.right||state.touch.right?1:0)-(state.keys.left||state.touch.left?1:0);
 const boost=p.boosting;
 const width=Math.min(w*.225,h*.31),x=w*.5+p.x*w*.045+(p.collide>0?Math.sin(state.time*80)*Math.min(12,p.collide*6):0),y=h*.91+(p.collide>0?Math.cos(state.time*70)*3:0);
 if(boost){ctx.save();ctx.globalAlpha=.85;for(const side of [-.28,.28]){poly([[x+side*width-8,y],[x+side*width+8,y],[x+side*width,y+width*(.28+Math.random()*.20)]],'#64e3fa');}ctx.restore()}
 carShape(x,y,width,p.color,-p.drift*.14,true,!!(state.keys.brake||state.touch.brake));
}
function draw(){
 if(window.TurboRetroRenderer?.render(state,canvas,ctx)){window.TurboRaceMap?.draw();return}
 const {w,h}=layout();skyline(w,h,state.track);
 const road=roadView(w,h);roadside(w,h,road);drawLandmarks(w,h,road);opponents(w,h);playerCar(w,h);drawTelemetry(w,h);window.TurboRaceMap?.draw();
 if(state.player.speed>210&&state.phase==='race'){ctx.strokeStyle='#ffffff13';ctx.lineWidth=1;for(let i=0;i<14;i++){const x=(i*167+state.time*250)%w,y=(i*109+state.time*190)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-w/2)*.045,y+25);ctx.stroke()}}
}

function drawLandmarks(w,h,road){
 const t=state.track;
 for(let i=road.length-7;i>=3;i-=4){const point=road[i],idx=Math.floor(point.z/175),size=point.scale;if(idx%6!==0)continue;
 const x=point.x+(idx%2?1:-1)*point.width*1.35,y=point.y,k=Math.max(.08,size*1.65);
 ctx.save();ctx.translate(x,y);ctx.scale(k,k);
 if(t.theme==='coast'){ctx.fillStyle='#e4d8a6';ctx.fillRect(-8,-110,16,110);for(let a=0;a<5;a++){ctx.save();ctx.rotate((a-2)*.54);poly([[0,-110],[-58,-154],[-22,-145]],'#25896e');ctx.restore()}}
 else if(t.theme==='alpine'){poly([[-53,0],[-18,-136],[6,-125],[36,0]],'#6d8190');poly([[-37,-48],[-18,-136],[6,-125],[21,-63]],'#dcebf6')}
 else if(t.theme==='desert'){ctx.fillStyle='#2b7258';ctx.fillRect(-6,-106,12,106);ctx.fillRect(-28,-79,13,12);ctx.fillRect(16,-66,13,12);ctx.fillRect(-27,-79,10,36);ctx.fillRect(20,-66,10,27)}
 else{ctx.fillStyle='#10283e';ctx.fillRect(-16,-130,32,130);ctx.fillStyle='#41c9d5';ctx.fillRect(-16,-130,32,4);ctx.fillStyle='#ee64b2';ctx.fillRect(-16,-18,32,4)}ctx.restore();
 }
 for(let lap=1;lap<=3;lap++){const d=lap*t.length-state.player.z;if(d<0||d>drawDistance)continue;const p=roadPoint(d,w,h),k=Math.max(.08,p.scale);ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='#f7e3b2';ctx.lineWidth=Math.max(2,9*k);const height=280*k,span=p.width*.96;ctx.beginPath();ctx.moveTo(-span,0);ctx.lineTo(-span,-height);ctx.lineTo(span,-height);ctx.lineTo(span,0);ctx.stroke();ctx.fillStyle='#172237';ctx.fillRect(-span,-height-16*k,span*2,28*k);ctx.fillStyle='#fbe8bf';ctx.textAlign='center';ctx.font='900 '+Math.max(9,18*k)+'px system-ui';ctx.fillText('TURBO LEGENDS  ●  FINISH',0,-height+4*k);ctx.restore()}
}
function drawTelemetry(w,h){
 const p=state.player;if(state.phase!=='race')return;
 if(p.offRoad&&p.speed>45){ctx.save();ctx.globalAlpha=.24;const x=w/2+p.x*w*.023,y=h*.9;for(let i=0;i<5;i++){const k=(state.time*53+i*17)%40;ctx.fillStyle=i%2?'#ddc4a1':'#d6d4b5';ctx.beginPath();ctx.arc(x+(i%2?-1:1)*(40+k),y+k*1.3,6+k*.33,0,7);ctx.fill()}ctx.restore()}
 if(p.speed>185){ctx.save();ctx.globalAlpha=Math.min(.28,(p.speed-165)/600);ctx.strokeStyle='#e6f8ff';ctx.lineWidth=2;for(let i=0;i<17;i++){const y=((i*141+state.time*(60+p.speed))%h),edge=i%2?-1:1,x=w/2+edge*(w*.3+(i*17)%Math.round(w*.19));ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+edge*21,y+24+p.speed*.12);ctx.stroke()}ctx.restore()}
 if(p.health<50){ctx.save();ctx.fillStyle='rgba(242,62,66,'+((50-p.health)/550)+')';ctx.fillRect(0,0,w,h);ctx.restore()}
}
function createOpponents(){
 const multiplier=state.difficulty==='easy'?.87:state.difficulty==='hard'?1.1:1;
 state.rivals=Array.from({length:19},(_,i)=>{
 const row=9-Math.floor(i/2),column=i%2,gridZ=65+row*42;
 const lane=column?.46:-.46;
 return {id:i,name:names[i],color:colors[i],lane,z:gridZ,speed:(242+(i%6)*8+(i%5)*2)*multiplier,
 velocity:0,drive:(i*7.13)%6,baseLane:lane,passTarget:null,passCooldown:.3+(i%5)*.35,
 braking:false,finished:false,finishTime:0,launchDelay:.08+(i%5)*.045,skill:.94+(i%8)*.027};
 });
}
function showRecord(){const id=$('track').value,d=bestRecords[id];$('bestRecord').textContent=d?'🏆 Лучший заезд: '+formatTime(d.time)+' · место '+d.rank+'/20'+(d.bestLap?' · лучший круг '+formatTime(d.bestLap):''):'🏆 Лучший результат: ещё не установлен'}
function resetRace(){const p=state.player;state.time=0;state.count=3;state.position=20;state.results=[];state.laps=[];state.lastLapTime=0;state.flashUntil=0;state.flashText='';Object.assign(p,{z:0,x:0,speed:0,nitro:100,health:100,lap:1,finished:false,collide:0,drift:0,offRoad:false,boosting:false,slipstream:0,topSpeed:0,gear:1,steerVelocity:0,lateralVelocity:0,color:$('carColor').value,nitro:window.TurboGarage?.stats().nitroCapacity||100});state.track=tracks[$('track').value]||tracks.coast;state.difficulty=$('difficulty').value;createOpponents();window.TurboRaceEvents?.reset(state);state.keys={};state.touch={};lastBoardAt=-10;}
function totalLength(){return state.track.length*lapCount}
function update(dt){if(state.phase==='menu'||state.phase==='finish'||state.phase==='pause')return;if(state.phase==='countdown'){state.count-=dt;$('countdown').textContent=state.count>0?Math.ceil(state.count):'GO!';if(state.count<-.55){state.phase='race';$('countdown').hidden=true;$('hint').hidden=false}return}
const p=state.player;
const inputs={
 gas:state.keys.gas||state.touch.gas,
 brake:state.keys.brake||state.touch.brake,
 nitro:state.keys.nitro||state.touch.nitro,
 left:state.keys.left||state.touch.left,
 right:state.keys.right||state.touch.right
};
state.time+=dt;
p.collide=Math.max(0,p.collide-dt);
const garage=window.TurboGarage?.stats();
const aheadForDraft=state.rivals.some(o=>!o.finished&&o.z>p.z+6&&o.z<p.z+90&&Math.abs(o.lane-p.x)<.22);
p.slipstream=clamp(p.slipstream+(aheadForDraft?dt*.65:-dt*.95),0,1);
const physics=window.TurboRacePhysics;
if(physics){
 physics.vehicle(p,inputs,state.track,garage,dt);
 const playerSnapshot={id:'player',z:p.z,lane:p.x,velocity:p.speed,finished:false,isPlayer:true};
 // Re-evaluate every car against the same race snapshot rather than a changing order.
 const plans=state.rivals.map(rival=>({...rival}));
 for(let i=0;i<state.rivals.length;i++){
  const opponent=state.rivals[i];
  if(opponent.finished)continue;
  physics.planAI(opponent,plans.concat(playerSnapshot),state.track,dt,state.time);
  if(opponent.z>=totalLength()){
   opponent.z=totalLength();opponent.finished=true;opponent.finishTime=state.time;
  }
 }
 const pickup=window.TurboRaceEvents?.update(state,garage);
 if(pickup)announce(pickup,2.2);
 const collision=physics.resolveInteractions(state);
 if(collision){beep(120,.12);announce('💥 СТОЛКНОВЕНИЕ · -'+Math.round(Math.max(0,100-p.health))+'% состояния',1.5)}
}else{
 // If the physics module cannot be loaded, the game remains steerable.
 const steer=Number(!!inputs.right)-Number(!!inputs.left);
 p.speed=clamp(p.speed+(inputs.gas?70:-35)*dt-(inputs.brake?250*dt:0),0,270);
 p.x=clamp(p.x+steer*dt*1.1,-2,2);
 p.z+=p.speed/3.6*dt;
 for(const opponent of state.rivals)opponent.z+=opponent.velocity/3.6*dt;
}
const oldRank=state.position,oldLap=p.lap;state.position=1+state.rivals.filter(o=>o.z>p.z+.01||(Math.abs(o.z-p.z)<=.01&&o.finished)).length;p.lap=Math.min(lapCount,Math.floor(p.z/state.track.length)+1);
if(p.lap>oldLap){const split=state.time-state.lastLapTime;state.laps.push(split);state.lastLapTime=state.time;announce('🏁 КРУГ '+oldLap+' · '+formatTime(split),3.4);renderSplits();}
else if(state.position<oldRank&&state.time>4)announce('⚡ ОБГОН! '+state.position+' / 20',1.75);
else if(state.position>oldRank&&state.time>4)announce('↘ ПОТЕРЯ ПОЗИЦИИ · '+state.position+' / 20',1.6);

if(p.z>=totalLength()){p.z=totalLength();p.finished=true;state.laps.push(Math.max(0,state.time-state.lastLapTime));renderSplits();finishRace()}
updateHud();}
function announce(message,seconds=2){state.flashText=message;state.flashUntil=state.time+seconds;const n=$('raceFlash');n.textContent=message;n.hidden=false;}
function renderSplits(){const area=$('lapSplitsList');area.replaceChildren();state.laps.forEach((t,i)=>{const el=document.createElement('div');el.textContent='Круг '+(i+1)+'  ·  '+formatTime(t);area.appendChild(el)});$('lapSplits').hidden=state.laps.length===0;}
function finishRace(){state.phase='finish';const rank=1+state.rivals.filter(o=>o.finished&&o.finishTime<state.time||o.z>state.player.z).length;state.position=clamp(rank,1,20);window.TurboGarage?.finish(rank);
 if(state.pickupMoney>0)window.TurboGarage?.credit(state.pickupMoney);
 window.TurboChampionship?.finish(rank,state.rivals);const time=formatTime(state.time);const trackId=Object.keys(tracks).find(id=>tracks[id]===state.track);if(trackId){const old=bestRecords[trackId];if(!old||rank<old.rank||rank===old.rank&&state.time<old.time){bestRecords[trackId]={rank,time:state.time,bestLap:old?.bestLap};try{localStorage.setItem(RECORD_KEY,JSON.stringify(bestRecords))}catch{}}}const lapBest=Math.min(...state.laps.filter(v=>Number.isFinite(v)&&v>0));if(trackId&&Number.isFinite(lapBest)){const previous=bestRecords[trackId].bestLap;if(previous==null||lapBest<previous){bestRecords[trackId].bestLap=lapBest;try{localStorage.setItem(RECORD_KEY,JSON.stringify(bestRecords))}catch{}}}showRecord();$('finishHeadline').textContent=rank===1?'ПОБЕДА!':rank<=3?'НА ПОДИУМЕ!':'ГОНКА ЗАВЕРШЕНА';$('finishPosition').innerHTML=rank+'<small> / 20</small>';$('finishSummary').textContent=state.track.name+' · '+time+' · '+(100-state.player.health).toFixed(0)+'% повреждений';const result=$('results');result.replaceChildren();const raceStats=document.createElement('div');raceStats.className='race-summary-v1';raceStats.textContent='⚡ Макс. скорость: '+Math.round(state.player.topSpeed)+' км/ч · 🏁 Лучший круг: '+(Number.isFinite(lapBest)?formatTime(lapBest):'—')+' · 🛡 Состояние: '+Math.round(state.player.health)+'%'+(state.pickupMoney?' · 💰 Бонусы: '+state.pickupMoney+' ₽':'');result.appendChild(raceStats);const results=[{name:'ВЫ',z:state.player.z,t:state.time,you:true},...state.rivals.map(o=>({name:o.name,z:o.z,t:o.finished?o.finishTime:Infinity}))].sort((a,b)=>b.z-a.z||a.t-b.t);for(let i=0;i<results.length;i++){const item=results[i],row=document.createElement('div');row.className='result-row'+(item.you?' you':'');row.textContent=String(i+1).padStart(2,'0')+' · '+item.name;const timeEl=document.createElement('span');timeEl.textContent=Number.isFinite(item.t)?formatTime(item.t):'Едет';row.appendChild(timeEl);result.appendChild(row)}$('finish').hidden=false;$('pauseBtn').hidden=true;$('touchControls').hidden=true;$('raceProgress').hidden=true;$('raceFlash').hidden=true;$('raceLeaderboard').hidden=true;$('hint').hidden=true;}
function formatTime(sec){const minutes=Math.floor(sec/60),seconds=Math.floor(sec%60),tenths=Math.floor((sec%1)*10);return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'.'+tenths}
function updateHud(){$('raceFlash').hidden=state.time>state.flashUntil||!state.flashText;const pct=clamp(state.player.z/totalLength()*100,0,100);$('raceProgressFill').style.width=pct.toFixed(1)+'%';$('raceProgressLabel').textContent=Math.floor(pct)+'%';$('position').innerHTML=state.position+'<small> / 20</small>';$('lap').innerHTML=state.player.lap+'<small> / '+lapCount+'</small>';$('time').textContent=formatTime(state.time);$('speed').textContent=Math.round(state.player.speed);$('nitroBar').style.width=(state.player.nitro/(window.TurboGarage?.stats().nitroCapacity||100)*100)+'%';$('nitroText').textContent=Math.round(state.player.nitro/(window.TurboGarage?.stats().nitroCapacity||100)*100)+'%';$('damage').textContent=Math.round(state.player.health)+'%';$('damage').style.color=state.player.health<45?'#ff8e85':'#9aefbd';$('gear').textContent=state.player.gear;$('roadWarning').textContent=state.player.offRoad?'⚠ ВНЕ ТРАССЫ':Math.abs(curvature(state.player.z+280))>1.48?'↪ КРУТОЙ ПОВОРОТ':' ';$('roadWarning').classList.toggle('danger',state.player.offRoad);$('draftBadge').hidden=state.player.slipstream<.55||state.phase!=='race';if(state.time-lastBoardAt>.5){lastBoardAt=state.time;const near=state.rivals.map(o=>({name:o.name,gap:o.z-state.player.z})).filter(o=>Math.abs(o.gap)<550).sort((a,b)=>Math.abs(a.gap)-Math.abs(b.gap)).slice(0,3);$('raceNearby').textContent=near.length?near.map(o=>(o.gap>0?'▲ ':'▼ ')+o.name+' '+Math.abs(Math.round(o.gap))+'м').join(' · '):'Свободная трасса'}}
function start(){resetRace();state.phase='countdown';window.TurboGarage?.render();$('garageReward')&&($('garageReward').hidden=true);$('menu').hidden=true;$('finish').hidden=true;$('hud').hidden=false;$('raceFlash').hidden=true;$('lapSplits').hidden=true;$('raceProgress').hidden=false;$('raceLeaderboard').hidden=false;$('countdown').hidden=false;$('countdown').textContent='3';$('pauseBtn').hidden=false;$('touchControls').hidden=false;$('hint').hidden=true;updateHud();}
function pause(){if(state.phase==='race'){state.phase='pause';$('pauseOverlay').hidden=false;state.keys={};state.touch={}}else if(state.phase==='pause'){state.phase='race';$('pauseOverlay').hidden=true;state.last=performance.now()}}
function toMenu(){state.phase='menu';window.TurboGarage?.render();$('menu').hidden=false;$('finish').hidden=true;$('pauseOverlay').hidden=true;$('hud').hidden=true;$('raceFlash').hidden=true;$('lapSplits').hidden=true;$('raceProgress').hidden=true;$('raceLeaderboard').hidden=true;$('touchControls').hidden=true;$('pauseBtn').hidden=true;$('hint').hidden=true}
function keymap(key){return ({ArrowUp:'gas',w:'gas',W:'gas',ArrowDown:'brake',s:'brake',S:'brake',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'nitro',Shift:'nitro'})[key]}
document.addEventListener('keydown',e=>{const name=keymap(e.key);if(name&&state.phase!=='menu'){e.preventDefault();state.keys[name]=true}if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(!e.repeat)pause()}if(e.key==='Enter'&&state.phase==='menu')start()});document.addEventListener('keyup',e=>{const name=keymap(e.key);if(name){e.preventDefault();state.keys[name]=false}});window.addEventListener('blur',()=>{state.keys={};state.touch={};if(state.phase==='race')pause()});
for(const b of document.querySelectorAll('[data-control]')){const name=b.dataset.control;const on=e=>{e.preventDefault();state.touch[name]=true;b.classList.add('down');try{b.setPointerCapture(e.pointerId)}catch{}};const off=e=>{e.preventDefault();state.touch[name]=false;b.classList.remove('down')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',()=>{state.touch[name]=false;b.classList.remove('down')})}
$('track').addEventListener('change',showRecord);showRecord();$('start').onclick=start;$('again').onclick=start;$('toMenu').onclick=toMenu;$('pauseBtn').onclick=pause;$('resume').onclick=pause;
let audioContext=null;function beep(freq=300,duration=.05){if(!state.audio)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sawtooth';osc.frequency.value=freq;gain.gain.setValueAtTime(.03,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration)}catch{}}
$('audio').onclick=()=>{state.audio=!state.audio;$('audio').textContent=state.audio?'🔊 Звук':'🔇 Звук';$('audio').setAttribute('aria-pressed',String(state.audio));beep(430,.08)};
let accumulator=0;
function frame(now){
 const elapsed=clamp((now-(state.last||now))/1000,0,.12);
 state.last=now;
 accumulator+=elapsed;
 const fixedStep=1/60;
 let ticks=0;
 while(accumulator>=fixedStep&&ticks<7){
  update(fixedStep);accumulator-=fixedStep;ticks++;
 }
 if(ticks===7)accumulator=0;
 draw();requestAnimationFrame(frame);
}
resetRace();requestAnimationFrame(frame);
window.TurboLegends={state,start,update,draw,pause,toMenu,tracks,formatTime};
})();