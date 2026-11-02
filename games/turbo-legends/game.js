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
const state={phase:'menu',track:tracks.coast,difficulty:'normal',time:0,count:3,last:0,player:{z:0,x:0,speed:0,nitro:100,health:100,lap:1,finished:false,color:'#ef424e',collide:0,drift:0,offRoad:false,boosting:false,slipstream:0,topSpeed:0,gear:1},rivals:[],keys:{},touch:{},position:20,results:[],engine:null,audio:false,soundTime:0};
const RECORD_KEY='turbo-legends-records-01';let bestRecords={};try{bestRecords=JSON.parse(localStorage.getItem(RECORD_KEY)||'{}')||{}}catch{};let lastBoardAt=-10;const lapCount=3,roadWidth=1900,drawDistance=2700,cameraHeight=900;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,wrap=(v,l)=>((v%l)+l)%l;
function curvature(z){const w=wrap(z,state.track.length);const v=state.track.twist;return (Math.sin(w/760)+.58*Math.sin(w/370+1.1)+.26*Math.sin(w/173+.6))*v;}
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
 // Integrate bends in the distance, anchored to the driver's current road position.
 const first=curvature(state.player.z);let turn=0;
 for(let z=0;z<d;z+=45){const k=curvature(state.player.z+z);turn+=(k*.27+first*.05)*45/30}
 return turn;
}
function roadPoint(d,w,h){
 const p=project(Math.max(1,d),0,elevation(state.player.z+d)-elevation(state.player.z),w,h);
 p.x=w*.5 + roadCenter(d)*p.scale*w/580 - state.player.x*p.width*.75;
 return p;
}
function roadView(w,h){
 const t=state.track,seg=35,road=[];
 for(let d=0;d<=drawDistance;d+=seg){const p=roadPoint(d,w,h);road.push({d,z:state.player.z+d,...p})}
 const horizonY=road[road.length-1].y;
 for(let i=road.length-2;i>=0;i--){const far=road[i+1],near=road[i];if(near.y<=far.y)continue;
 const band=Math.floor(far.z/125)%2;
 ctx.fillStyle=t.ground[band];ctx.fillRect(0,far.y,w,near.y-far.y+2);
 const borderFar={...far,width:far.width*1.09},borderNear={...near,width:near.width*1.09};
 quad(borderFar,borderNear,band?'#f8eee5':'#ef6372');
 quad(far,near,t.road[band]);
 const stripe=Math.floor(far.z/70)%3===0;
 if(stripe)for(const lane of [-.33,.33]){const fw=Math.max(1,far.width*.012),nw=Math.max(1,near.width*.012);poly([[far.x+far.width*lane-fw,far.y],[far.x+far.width*lane+fw,far.y],[near.x+near.width*lane+nw,near.y],[near.x+near.width*lane-nw,near.y]],'#e9e8d8');}
 if(Math.floor(far.z/25)%2===0){ctx.strokeStyle='#ffffff09';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(far.x-far.width,far.y);ctx.lineTo(far.x+far.width,far.y);ctx.stroke();}
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
 const w=size,h=size*.64;if(w<3)return;
 ctx.save();ctx.translate(x,y);ctx.rotate(lean);
 ctx.fillStyle='#07101980';ctx.beginPath();ctx.ellipse(0,h*.18,w*.59,h*.21,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#111a25';ctx.fillRect(-w*.51,-h*.28,w*.19,h*.45);ctx.fillRect(w*.32,-h*.28,w*.19,h*.45);
 const paint=ctx.createLinearGradient(-w*.4,-h*.65,w*.5,h*.18);paint.addColorStop(0,'#ffffff');paint.addColorStop(.12,color);paint.addColorStop(.7,color);paint.addColorStop(1,'#343d4e');
 poly([[-w*.43,-h*.07],[-w*.34,-h*.56],[-w*.20,-h*.84],[w*.20,-h*.84],[w*.34,-h*.56],[w*.43,-h*.07],[w*.48,h*.15],[-w*.48,h*.15]],paint);
 poly([[-w*.30,-h*.51],[-w*.17,-h*.78],[w*.17,-h*.78],[w*.30,-h*.51]],'#132e40');
 poly([[-w*.24,-h*.56],[-w*.15,-h*.73],[w*.09,-h*.73],[-w*.04,-h*.56]],'#80bbd552');
 ctx.fillStyle='#d8eff34c';ctx.fillRect(-w*.39,-h*.10,w*.78,h*.035);
 ctx.fillStyle='#121c26';ctx.fillRect(-w*.49,-h*.46,w*.98,h*.046);
 ctx.fillStyle=brake?'#fff0d3':'#f84c56';ctx.fillRect(-w*.44,h*.025,w*.22,h*.10);ctx.fillRect(w*.22,h*.025,w*.22,h*.10);
 ctx.fillStyle='#b9d8ea';ctx.fillRect(-w*.08,h*.055,w*.16,h*.07);
 ctx.fillStyle='#202631';ctx.fillRect(-w*.46,h*.15,w*.92,h*.06);
 if(player){ctx.fillStyle='#142334';ctx.fillRect(-w*.52,-h*.49,w*1.04,h*.035);ctx.fillStyle='#e5e5eb';ctx.textAlign='center';ctx.font='800 '+Math.round(w*.10)+'px system-ui';ctx.fillText('TL',0,-h*.28)}
 ctx.restore();
}
function opponents(w,h){
 const visible=state.rivals.map(o=>({o,d:o.z-state.player.z})).filter(v=>v.d>15&&v.d<drawDistance-70).sort((a,b)=>b.d-a.d);
 for(const {o,d} of visible){const p=roadPoint(d,w,h);const width=clamp(w*.18*p.scale,8,Math.min(w*.15,165));const x=p.x+o.lane*p.width*.96;carShape(x,p.y,width,o.color,0,false,o.braking);}
}
function playerCar(w,h){
 if(state.phase==='menu')return;
 const p=state.player;const steering=(state.keys.right||state.touch.right?1:0)-(state.keys.left||state.touch.left?1:0);
 const boost=p.boosting;
 const width=Math.min(w*.19,h*.255),x=w*.5+p.x*w*.023,y=h*.91;
 if(boost){ctx.save();ctx.globalAlpha=.85;for(const side of [-.28,.28]){poly([[x+side*width-8,y],[x+side*width+8,y],[x+side*width,y+width*(.28+Math.random()*.20)]],'#64e3fa');}ctx.restore()}
 carShape(x,y,width,p.color,-p.drift*.075,true,!!(state.keys.brake||state.touch.brake));
}
function draw(){
 const {w,h}=layout();skyline(w,h,state.track);
 const road=roadView(w,h);roadside(w,h,road);opponents(w,h);playerCar(w,h);
 if(state.player.speed>210&&state.phase==='race'){ctx.strokeStyle='#ffffff13';ctx.lineWidth=1;for(let i=0;i<14;i++){const x=(i*167+state.time*250)%w,y=(i*109+state.time*190)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-w/2)*.045,y+25);ctx.stroke()}}
}
function createOpponents(){const t=state.track,d=state.difficulty;const multiplier=d==='easy'?.85:d==='hard'?1.11:1;state.rivals=Array.from({length:19},(_,i)=>({id:i,name:names[i],color:colors[i],lane:((i%4)-1.5)*.33,z:115+(18-i)*115,speed:(205+(i%7)*5.3+(19-i)*.62)*multiplier,drive:(i*7.13)%6,baseLane:((i%4)-1.5)*.33,braking:false,finished:false,finishTime:0}));}
function showRecord(){const id=$('track').value,d=bestRecords[id];$('bestRecord').textContent=d?'🏆 Лучший заезд: '+formatTime(d.time)+' · место '+d.rank+'/20':'🏆 Лучший результат: ещё не установлен'}
function resetRace(){const p=state.player;state.time=0;state.count=3;state.position=20;state.results=[];Object.assign(p,{z:0,x:0,speed:0,nitro:100,health:100,lap:1,finished:false,collide:0,drift:0,offRoad:false,boosting:false,slipstream:0,topSpeed:0,gear:1,color:$('carColor').value,nitro:window.TurboGarage?.stats().nitroCapacity||100});state.track=tracks[$('track').value]||tracks.coast;state.difficulty=$('difficulty').value;createOpponents();state.keys={};state.touch={};lastBoardAt=-10;}
function totalLength(){return state.track.length*lapCount}
function update(dt){if(state.phase==='menu'||state.phase==='finish'||state.phase==='pause')return;if(state.phase==='countdown'){state.count-=dt;$('countdown').textContent=state.count>0?Math.ceil(state.count):'GO!';if(state.count<-.55){state.phase='race';$('countdown').hidden=true;$('hint').hidden=false}return}
const p=state.player,g=state.keys.gas||state.touch.gas,b=state.keys.brake||state.touch.brake,n=state.keys.nitro||state.touch.nitro;
state.time+=dt;p.collide=Math.max(0,p.collide-dt);
// Manual throttle, noticeable coasting, progressive braking, nitro only while accelerating.
const garage=window.TurboGarage?.stats();const forward=state.rivals.filter(o=>o.z>p.z&&o.z-p.z<150&&Math.abs(o.lane-p.x)<.26);
p.slipstream=forward.length&&p.speed>100?clamp(p.slipstream+dt*.75,0,1):clamp(p.slipstream-dt*.9,0,1);
const max=((garage?.maxSpeed||315)+p.slipstream*14)*(.72+.28*p.health/100),boost=n&&g&&p.nitro>0&&p.speed>55;
p.boosting=boost;
const acceleration=g?(105+p.slipstream*12)*(garage?.acceleration||1):-48;
p.speed=clamp(p.speed+(acceleration-(b?240:0)-(boost?-145*(garage?.nitroBoost||1):0)-p.speed*.11)*dt,0,boost?max+85:max);
const nitroCap=garage?.nitroCapacity||100;p.nitro=clamp(p.nitro+(boost?-34/(garage?.nitroEfficiency||1):7)*dt,0,nitroCap);
p.topSpeed=Math.max(p.topSpeed,p.speed);p.gear=clamp(Math.floor(p.speed/53)+1,1,6);
const steer=(state.keys.right||state.touch.right?1:0)-(state.keys.left||state.touch.left?1:0);
const bend=curvature(p.z),roadPull=bend*Math.pow(p.speed/270,2)*.16/(garage?.handling||1);
const steerPower=(.72+.38*clamp(p.speed/155,0,1))*(p.offRoad?.62:1)*(garage?.handling||1);
const previousDrift=p.drift;
p.drift=lerp(previousDrift,steer*steerPower,clamp(dt*6,0,1));
p.x+=p.drift*dt*1.48-roadPull*dt;
p.x=clamp(p.x,-2.05,2.05);
p.offRoad=Math.abs(p.x)>1.07;
if(p.offRoad){p.speed=Math.max(0,p.speed-(83+p.speed*.12)*dt);p.health=Math.max(30,p.health-.65*dt)}
if(Math.abs(bend)>1.45&&p.speed>230&&!b){p.drift+=Math.sign(bend)*.014;p.speed=Math.max(0,p.speed-15*dt)}
p.z+=p.speed/3.6*dt;
for(const o of state.rivals){if(o.finished)continue;const curve=Math.abs(curvature(o.z));const desired=o.speed*(1-clamp(curve*.085,0,.18));o.braking=o.speed>desired+12;o.z+=Math.max(115,desired)/3.6*dt;const ahead=state.rivals.find(v=>v!==o&&v.z>o.z&&v.z-o.z<55&&Math.abs(v.lane-o.lane)<.22);const targetLane=clamp(o.baseLane+(ahead?(o.lane>=0?-.24:.24):0)+Math.sin(state.time*.25+o.drive)*.045,-.83,.83);o.lane=lerp(o.lane,targetLane,Math.min(1,dt*(ahead?.95:.42)));if(o.z>=totalLength()){o.z=totalLength();o.finished=true;o.finishTime=state.time}}
if(!p.collide)for(const o of state.rivals){const delta=o.z-p.z;if(Math.abs(delta)<10&&Math.abs(o.lane-p.x)<.21){p.speed*=.83;p.health=Math.max(20,p.health-5);p.collide=1.05;o.lane=clamp(o.lane+(o.lane>p.x?.13:-.13),-.86,.86);beep(115,.11);break}}
state.position=1+state.rivals.filter(o=>o.z>p.z).length;p.lap=Math.min(lapCount,Math.floor(p.z/state.track.length)+1);
if(p.z>=totalLength()){p.z=totalLength();p.finished=true;finishRace()}
updateHud();}
function finishRace(){state.phase='finish';const rank=1+state.rivals.filter(o=>o.finished&&o.finishTime<state.time||o.z>state.player.z).length;state.position=clamp(rank,1,20);window.TurboGarage?.finish(rank);const time=formatTime(state.time);const trackId=Object.keys(tracks).find(id=>tracks[id]===state.track);if(trackId){const old=bestRecords[trackId];if(!old||rank<old.rank||rank===old.rank&&state.time<old.time){bestRecords[trackId]={rank,time:state.time};try{localStorage.setItem(RECORD_KEY,JSON.stringify(bestRecords))}catch{}}}showRecord();$('finishHeadline').textContent=rank===1?'ПОБЕДА!':rank<=3?'НА ПОДИУМЕ!':'ГОНКА ЗАВЕРШЕНА';$('finishPosition').innerHTML=rank+'<small> / 20</small>';$('finishSummary').textContent=state.track.name+' · '+time+' · '+(100-state.player.health).toFixed(0)+'% повреждений';const result=$('results');result.replaceChildren();const results=[{name:'ВЫ',z:state.player.z,t:state.time,you:true},...state.rivals.map(o=>({name:o.name,z:o.z,t:o.finished?o.finishTime:Infinity}))].sort((a,b)=>b.z-a.z||a.t-b.t);for(let i=0;i<Math.min(8,results.length);i++){const item=results[i],row=document.createElement('div');row.className='result-row'+(item.you?' you':'');row.textContent=String(i+1).padStart(2,'0')+' · '+item.name;const timeEl=document.createElement('span');timeEl.textContent=Number.isFinite(item.t)?formatTime(item.t):'Едет';row.appendChild(timeEl);result.appendChild(row)}$('finish').hidden=false;$('pauseBtn').hidden=true;$('touchControls').hidden=true;$('raceProgress').hidden=true;$('raceLeaderboard').hidden=true;$('hint').hidden=true;}
function formatTime(sec){const minutes=Math.floor(sec/60),seconds=Math.floor(sec%60),tenths=Math.floor((sec%1)*10);return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'.'+tenths}
function updateHud(){const pct=clamp(state.player.z/totalLength()*100,0,100);$('raceProgressFill').style.width=pct.toFixed(1)+'%';$('raceProgressLabel').textContent=Math.floor(pct)+'%';$('position').innerHTML=state.position+'<small> / 20</small>';$('lap').innerHTML=state.player.lap+'<small> / '+lapCount+'</small>';$('time').textContent=formatTime(state.time);$('speed').textContent=Math.round(state.player.speed);$('nitroBar').style.width=(state.player.nitro/(window.TurboGarage?.stats().nitroCapacity||100)*100)+'%';$('nitroText').textContent=Math.round(state.player.nitro/(window.TurboGarage?.stats().nitroCapacity||100)*100)+'%';$('damage').textContent=Math.round(state.player.health)+'%';$('damage').style.color=state.player.health<45?'#ff8e85':'#9aefbd';$('gear').textContent=state.player.gear;$('roadWarning').textContent=state.player.offRoad?'⚠ ВНЕ ТРАССЫ':Math.abs(curvature(state.player.z+280))>1.48?'↪ КРУТОЙ ПОВОРОТ':' ';$('roadWarning').classList.toggle('danger',state.player.offRoad);$('draftBadge').hidden=state.player.slipstream<.55||state.phase!=='race';if(state.time-lastBoardAt>.5){lastBoardAt=state.time;const near=state.rivals.map(o=>({name:o.name,gap:o.z-state.player.z})).filter(o=>Math.abs(o.gap)<550).sort((a,b)=>Math.abs(a.gap)-Math.abs(b.gap)).slice(0,3);$('raceNearby').textContent=near.length?near.map(o=>(o.gap>0?'▲ ':'▼ ')+o.name+' '+Math.abs(Math.round(o.gap))+'м').join(' · '):'Свободная трасса'}}
function start(){resetRace();state.phase='countdown';window.TurboGarage?.render();$('garageReward')&&($('garageReward').hidden=true);$('menu').hidden=true;$('finish').hidden=true;$('hud').hidden=false;$('raceProgress').hidden=false;$('raceLeaderboard').hidden=false;$('countdown').hidden=false;$('countdown').textContent='3';$('pauseBtn').hidden=false;$('touchControls').hidden=false;$('hint').hidden=true;updateHud();}
function pause(){if(state.phase==='race'){state.phase='pause';$('pauseOverlay').hidden=false;state.keys={};state.touch={}}else if(state.phase==='pause'){state.phase='race';$('pauseOverlay').hidden=true;state.last=performance.now()}}
function toMenu(){state.phase='menu';window.TurboGarage?.render();$('menu').hidden=false;$('finish').hidden=true;$('pauseOverlay').hidden=true;$('hud').hidden=true;$('raceProgress').hidden=true;$('raceLeaderboard').hidden=true;$('touchControls').hidden=true;$('pauseBtn').hidden=true;$('hint').hidden=true}
function keymap(key){return ({ArrowUp:'gas',w:'gas',W:'gas',ArrowDown:'brake',s:'brake',S:'brake',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'nitro',Shift:'nitro'})[key]}
document.addEventListener('keydown',e=>{const name=keymap(e.key);if(name&&state.phase!=='menu'){e.preventDefault();state.keys[name]=true}if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(!e.repeat)pause()}if(e.key==='Enter'&&state.phase==='menu')start()});document.addEventListener('keyup',e=>{const name=keymap(e.key);if(name){e.preventDefault();state.keys[name]=false}});window.addEventListener('blur',()=>{state.keys={};state.touch={};if(state.phase==='race')pause()});
for(const b of document.querySelectorAll('[data-control]')){const name=b.dataset.control;const on=e=>{e.preventDefault();state.touch[name]=true;if(name==='left')state.player.x=clamp(state.player.x-.08,-1.9,1.9);if(name==='right')state.player.x=clamp(state.player.x+.08,-1.9,1.9);b.classList.add('down');try{b.setPointerCapture(e.pointerId)}catch{}};const off=e=>{e.preventDefault();state.touch[name]=false;b.classList.remove('down')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',()=>{state.touch[name]=false;b.classList.remove('down')})}
$('track').addEventListener('change',showRecord);showRecord();$('start').onclick=start;$('again').onclick=start;$('toMenu').onclick=toMenu;$('pauseBtn').onclick=pause;$('resume').onclick=pause;
let audioContext=null;function beep(freq=300,duration=.05){if(!state.audio)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sawtooth';osc.frequency.value=freq;gain.gain.setValueAtTime(.03,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration)}catch{}}
$('audio').onclick=()=>{state.audio=!state.audio;$('audio').textContent=state.audio?'🔊 Звук':'🔇 Звук';$('audio').setAttribute('aria-pressed',String(state.audio));beep(430,.08)};
function frame(now){const dt=clamp((now-(state.last||now))/1000,0,.045);state.last=now;update(dt);draw();requestAnimationFrame(frame)}
resetRace();requestAnimationFrame(frame);
window.TurboLegends={state,start,update,draw,pause,tracks,formatTime};
})();