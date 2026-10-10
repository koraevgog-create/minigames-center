(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d'),W=960,H=600;
let state='ready',hero,enemies=[],gems=[],fx=[],keys={},pointer=null,wave=1,spawned=0,spawnTime=0,time=0,kills=0,last=performance.now(),bossSpawned=false,transition=0,projectiles=[];
const rand=(a,b)=>a+Math.random()*(b-a);
const types={goblin:{hp:34,speed:100,damage:6,radius:15,xp:13,color:'#7eae66'},skeleton:{hp:76,speed:69,damage:10,radius:17,xp:24,color:'#d4d2c5'},archer:{hp:45,speed:85,damage:8,radius:16,xp:19,color:'#acd48b'},elite:{hp:145,speed:92,damage:14,radius:22,xp:40,color:'#d99155'},orc:{hp:540,speed:52,damage:22,radius:32,xp:150,color:'#af715b'}};
function fresh(){hero={x:W/2,y:H/2,hp:100,maxHp:100,damage:18,speed:240,range:112,rate:.52,cool:0,level:1,xp:0,xpGoal:38,fire:0,armor:0};enemies=[];gems=[];fx=[];projectiles=[];keys={};pointer=null;wave=1;spawned=0;spawnTime=.8;time=0;kills=0;bossSpawned=false;transition=0;state='ready';$('overlay').hidden=true;$('start').disabled=false;info('Нажми «Начать игру», затем двигайся клавишами WASD.');hud()}
function info(text){$('status').textContent=text}
function hud(){for(const [id,value] of Object.entries({hp:Math.ceil(hero.hp)+' / '+hero.maxHp,level:hero.level,wave:wave+' / 5',kills,timer:String(Math.floor(time/60)).padStart(2,'0')+':'+String(Math.floor(time%60)).padStart(2,'0')}))$(id).textContent=value;$('experienceBar').style.width=Math.min(100,hero.xp/hero.xpGoal*100)+'%';$('pause').textContent=state==='paused'?'▶ Продолжить':'⏸ Пауза';$('stats').replaceChildren();for(const str of ['⚔️ Урон: '+Math.round(hero.damage),'🗡️ Удары: '+(1/hero.rate).toFixed(1)+' в секунду','🏃 Скорость: '+Math.round(hero.speed),'❤️ Макс. здоровье: '+hero.maxHp,'🛡️ Защита: '+hero.armor]){const div=document.createElement('div');div.textContent=str;$('stats').appendChild(div)}}
function burst(x,y,color,n=9){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),v=rand(40,145);fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:.45,color})}}
function spawn(){const boss=wave===5&&spawned===12;if(boss)bossSpawned=true;const kind=boss?'orc':wave>=4&&spawned%6===0?'elite':wave>=2&&spawned%4===0?'archer':wave>=3&&spawned%3===0?'skeleton':'goblin';const t=types[kind],edge=Math.floor(rand(0,4));let x=edge===0?10:edge===1?W-10:rand(20,W-20),y=edge===2?10:edge===3?H-10:rand(20,H-20);enemies.push({...t,x,y,kind,hp:t.hp*(boss?1:1+(wave-1)*.14),maxHp:t.hp*(boss?1:1+(wave-1)*.14),attack:0,shoot:1.4,dead:false});spawned++}
function kill(e){e.dead=true;kills++;gems.push({x:e.x,y:e.y,xp:e.xp});burst(e.x,e.y,'#aeea7d',12);if(e.kind==='orc'){state='won';finish(true)}}
function advanceLevel(){hero.xp-=hero.xpGoal;hero.level++;hero.xpGoal=Math.floor(hero.xpGoal*1.35+14);state='upgrade';$('overlay').hidden=false;$('modalTitle').textContent='⭐ Уровень '+hero.level;$('modalText').textContent='Выбери одно усиление героя.';const pool=[
['⚔️ Острый клинок','Урон +25%',()=>hero.damage*=1.25],
['❤️ Живучесть','Максимальное здоровье +40 и лечение',()=>{hero.maxHp+=40;hero.hp=Math.min(hero.maxHp,hero.hp+40)}],
['⚡ Скорость удара','Атаки на 20% чаще',()=>hero.rate/=1.2],
['🏃 Лёгкие сапоги','Скорость движения +15%',()=>hero.speed*=1.15],
['🔥 Огненный клинок','Дополнительный урон +7',()=>hero.fire+=7],
['🛡️ Стальная кожа','Получаемый урон −2',()=>hero.armor+=2]
];pool.sort(()=>Math.random()-.5);$('choices').replaceChildren();for(const [title,desc,fn] of pool.slice(0,3)){const b=document.createElement('button');b.textContent=title+' — '+desc;b.onclick=()=>{fn();$('overlay').hidden=true;state='playing';info('Улучшение получено!');hud()};$('choices').appendChild(b)}hud()}
function finish(win){$('overlay').hidden=false;$('modalTitle').textContent=win?'🏆 ПОБЕДА!':'💀 ПОРАЖЕНИЕ';$('modalText').textContent=(win?'Вождь орков повержен. Ты пережил ночь!':'Твой рыцарь пал в бою.')+' Убито врагов: '+kills+'. Время: '+$('timer').textContent+'.';$('choices').replaceChildren();const b=document.createElement('button');b.textContent='↻ Начать новый забег';b.onclick=()=>{fresh();start()};$('choices').appendChild(b);hud()}
function start(){if(state==='ready'){state='playing';$('start').disabled=true;info('Волна 1: гоблины наступают!')}else if(state==='paused')state='playing';hud()}
function update(dt){time+=dt;hero.cool=Math.max(0,hero.cool-dt);
let dx=Number(!!(keys.KeyD||keys.ArrowRight))-Number(!!(keys.KeyA||keys.ArrowLeft)),dy=Number(!!(keys.KeyS||keys.ArrowDown))-Number(!!(keys.KeyW||keys.ArrowUp));
if(pointer){dx=pointer.x-hero.x;dy=pointer.y-hero.y;if(Math.hypot(dx,dy)<20){dx=0;dy=0}}
const len=Math.hypot(dx,dy);if(len){hero.x=Math.max(22,Math.min(W-22,hero.x+dx/len*hero.speed*dt));hero.y=Math.max(22,Math.min(H-22,hero.y+dy/len*hero.speed*dt))}
const quota=wave===5?13:8+wave*3;
spawnTime-=dt;
if(spawned<quota&&spawnTime<=0){spawn();spawnTime=Math.max(.35,1.05-wave*.1)}
for(const e of enemies){if(e.dead)continue;const dx=hero.x-e.x,dy=hero.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;e.attack-=dt;if(e.kind==='archer'){e.shoot-=dt;if(d<450&&e.shoot<=0){projectiles.push({x:e.x,y:e.y,vx:dx/d*235,vy:dy/d*235,life:3});e.shoot=2.1}if(d<170){e.x-=dx/d*e.speed*.65*dt;e.y-=dy/d*e.speed*.65*dt}}if(d<e.radius+17&&e.attack<=0){e.attack=.75;hero.hp=Math.max(0,hero.hp-Math.max(1,e.damage-hero.armor));burst(hero.x,hero.y,'#ff7777',5);if(hero.hp===0){state='lost';finish(false);return}}}
for(const shot of projectiles){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;if(Math.hypot(hero.x-shot.x,hero.y-shot.y)<21){hero.hp=Math.max(0,hero.hp-8);shot.life=0;burst(hero.x,hero.y,'#ff7777',5);if(hero.hp===0){state='lost';finish(false);return}}}projectiles=projectiles.filter(p=>p.life>0&&p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H);
if(hero.cool<=0){let target=null,min=Infinity;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-hero.x,e.y-hero.y);if(d<hero.range&&d<min){min=d;target=e}}if(target){hero.cool=hero.rate;target.hp-=hero.damage+hero.fire;burst(target.x,target.y,hero.fire?'#ffb35f':'#fff0a6',7);if(target.hp<=0)kill(target)}}
if(state!=='playing')return;
enemies=enemies.filter(e=>!e.dead);
for(const g of gems){let d=Math.hypot(hero.x-g.x,hero.y-g.y);if(d<175){g.x+=(hero.x-g.x)/(d||1)*280*dt;g.y+=(hero.y-g.y)/(d||1)*280*dt}if(d<25){hero.xp+=g.xp;g.picked=true}}
gems=gems.filter(g=>!g.picked);for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt}fx=fx.filter(p=>p.t>0);
if(hero.xp>=hero.xpGoal){advanceLevel();return}
if(spawned>=quota&&enemies.length===0){if(wave<5){transition+=dt;if(transition>1.2){wave++;spawned=0;spawnTime=.7;transition=0;info('🌊 Волна '+wave+' начинается!')}}}
hud()}
function draw(){ctx.clearRect(0,0,W,H);for(let y=0;y<H;y+=60)for(let x=0;x<W;x+=60){ctx.fillStyle=(x/60+y/60)%2?'#284435':'#304b39';ctx.fillRect(x,y,60,60);if(((x*7+y*13)/60)%11===0){ctx.fillStyle='#3b6544';ctx.beginPath();ctx.arc(x+18,y+17,12,0,7);ctx.fill()}}
ctx.font='27px serif';for(let i=0;i<20;i++){const x=(i*193+35)%W,y=(i*137+55)%H;if(Math.hypot(x-hero.x,y-hero.y)>100)ctx.fillText('🌲',x,y)}
for(const g of gems){ctx.fillStyle='#75dff8';ctx.beginPath();ctx.arc(g.x,g.y,6,0,7);ctx.fill()}
ctx.textAlign='center';ctx.textBaseline='middle';for(const e of enemies){ctx.font=(e.kind==='orc'?56:31)+'px serif';ctx.fillText(e.kind==='orc'?'👹':e.kind==='skeleton'?'💀':e.kind==='archer'?'🏹':e.kind==='elite'?'👹':'👺',e.x,e.y);ctx.fillStyle='#59292a';ctx.fillRect(e.x-21,e.y-e.radius-14,42,5);ctx.fillStyle='#9edc83';ctx.fillRect(e.x-21,e.y-e.radius-14,42*Math.max(0,e.hp/e.maxHp),5)}
for(const shot of projectiles){ctx.fillStyle='#ffd37c';ctx.beginPath();ctx.arc(shot.x,shot.y,6,0,Math.PI*2);ctx.fill()}ctx.strokeStyle='#ffebb027';ctx.beginPath();ctx.arc(hero.x,hero.y,hero.range,0,Math.PI*2);ctx.stroke();ctx.font='44px serif';ctx.fillText('🛡️',hero.x,hero.y);
for(const p of fx){ctx.globalAlpha=Math.max(0,p.t/.45);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)}ctx.globalAlpha=1;
const shade=ctx.createRadialGradient(hero.x,hero.y,90,hero.x,hero.y,560);shade.addColorStop(0,'#06132300');shade.addColorStop(1,'#07101cba');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
if(state==='paused'){ctx.fillStyle='#071423b9';ctx.fillRect(0,0,W,H);ctx.font='bold 48px system-ui';ctx.fillStyle='#f6eacb';ctx.fillText('ПАУЗА',W/2,H/2)}}
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state==='playing')update(dt);draw();requestAnimationFrame(frame)}
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='Space'&&!e.repeat&&['playing','paused'].includes(state)){state=state==='paused'?'playing':'paused';hud()}});window.addEventListener('keyup',e=>{keys[e.code]=false});window.addEventListener('blur',()=>{if(state==='playing'){state='paused';hud()}});
function setPointer(e){const r=canvas.getBoundingClientRect();pointer={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);setPointer(e)});canvas.addEventListener('pointermove',e=>{if(pointer)setPointer(e)});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
$('start').onclick=start;$('pause').onclick=()=>{if(['playing','paused'].includes(state)){state=state==='playing'?'paused':'playing';hud()}};$('restart').onclick=()=>{fresh()};
fresh();requestAnimationFrame(frame);
})();