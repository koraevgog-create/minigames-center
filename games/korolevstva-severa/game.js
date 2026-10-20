(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('field'),ctx=canvas.getContext('2d'),map=$('minimap'),mc=map.getContext('2d'),WORLD={w:2600,h:1900};
let commandArmed=false;let W=innerWidth,H=innerHeight,zoom=1,cam={x:130,y:490},units=[],buildings=[],nodes=[],sparks=[],selection=[],placing=null,drag=null,mouse={x:0,y:0},keys={},gold=450,wood=260,serial=0,last=performance.now(),elapsed=0,wave=0,paused=false,result=null,toastExpires=0;
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),cfg={worker:{hp:75,speed:70,damage:7,rate:.7,range:28,size:12,icon:'⛏️'},soldier:{hp:145,speed:83,damage:19,rate:1.15,range:43,size:16,icon:'⚔️'},archer:{hp:85,speed:76,damage:14,rate:.95,range:158,size:14,icon:'🏹'},enemy:{hp:110,speed:66,damage:15,rate:1,range:47,size:15,icon:'🪓'}},bcfg={hall:{hp:700,size:91,bonus:0,icon:'🏰'},barracks:{hp:420,size:72,bonus:0,icon:'🛡️'},farm:{hp:270,size:57,bonus:6,icon:'🌾'},tower:{hp:320,size:43,bonus:0,icon:'🗼'},enemyhall:{hp:920,size:92,bonus:0,icon:'🏯'}},names={worker:'Рабочий',soldier:'Мечник',archer:'Лучник',enemy:'Налётчик',hall:'Ратуша',barracks:'Казармы',farm:'Ферма',tower:'Башня',enemyhall:'Вражеская крепость'};
function unit(type,x,y,team=0){const c=cfg[type],o={id:++serial,type,x,y,team,hp:c.hp,max:c.hp,size:c.size,speed:c.speed,damage:c.damage,rate:c.rate,range:c.range,attackCd:0,order:null,carry:0,queue:[],flash:0};units.push(o);return o}
function building(type,x,y,team=0){const c=bcfg[type],o={id:++serial,type,x,y,team,hp:c.hp,max:c.hp,size:c.size,bonus:c.bonus,queue:[],progress:0,attackCd:0};buildings.push(o);return o}
function node(type,x,y,count){const n={id:++serial,type,x,y,amount:count,size:type==='tree'?30:28};nodes.push(n);return n}
function used(){return units.filter(u=>u.team===0).length}function cap(){return 12+buildings.filter(b=>b.team===0).reduce((s,b)=>s+b.bonus,0)}
function announce(s){$('toast').textContent=s;$('toast').classList.add('show');toastExpires=elapsed+3}
function reset(){commandArmed=false;gold=450;wood=260;serial=0;elapsed=0;wave=0;paused=false;result=null;selection=[];placing=null;drag=null;units=[];buildings=[];nodes=[];sparks=[];$('end').hidden=true;cam={x:330,y:650};zoom=1;
 building('hall',620,950);building('enemyhall',2140,950,1);building('tower',2020,820,1);unit('worker',520,1030);unit('worker',570,1050);unit('worker',650,1070);unit('soldier',730,970);unit('archer',705,1030);
 for(let i=0;i<70;i++){let x=rand(60,2540),y=rand(100,1800);if(Math.abs(x-620)<145&&Math.abs(y-950)<145||Math.abs(x-2140)<140&&Math.abs(y-950)<140)continue;node('tree',x,y,rand(90,190))}
 for(const p of [[420,740],[890,1240],[1200,410],[1650,1430],[2180,1400],[1800,500]])node('gold',p[0],p[1],1200);
 for(let i=0;i<4;i++)unit('enemy',rand(2050,2240),rand(850,1130),1);
 cameraHome();refresh();announce('Строй казармы, добывай ресурсы и уничтожь вражескую крепость!')}
function resize(){W=innerWidth;H=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);clampCam()}
function clampCam(){cam.x=clamp(cam.x,0,Math.max(0,WORLD.w-W/zoom));cam.y=clamp(cam.y,0,Math.max(0,WORLD.h-H/zoom))}
function cameraHome(){cam.x=620-W/zoom*.5;cam.y=950-H/zoom*.5;clampCam()}
function xy(sx,sy){return {x:cam.x+sx/zoom,y:cam.y+sy/zoom}}
function screen(x,y){return {x:(x-cam.x)*zoom,y:(y-cam.y)*zoom}}
function closest(p,all){return all.filter(o=>o.hp>0).sort((a,b)=>distance(a,p)-distance(b,p))[0]}
function hit(p,ownOnly=false){const list=[...units,...buildings,...nodes].filter(o=>!ownOnly||o.team===0).reverse();return list.find(o=>distance(o,p)<o.size+8/zoom)||null}
function order(u,p,job='move',target=null){u.order={x:p.x,y:p.y,job,target}}
function afford(g,w){if(gold<g||wood<w){announce('Недостаточно ресурсов');return false}return true}
function train(type,b){const cost=type==='worker'?[55,0]:type==='soldier'?[95,35]:[120,60];if(!afford(...cost))return;if(used()+buildings.reduce((s,v)=>s+v.queue.length,0)>=cap()){announce('Нужна ферма: лимит населения');return}gold-=cost[0];wood-=cost[1];b.queue.push({type,duration:type==='worker'?4:7});refresh();announce('Подготовка: '+names[type])}
function build(type,p){const cost=type==='barracks'?[170,110]:type==='farm'?[85,75]:[120,135];if(!afford(...cost))return;const s=bcfg[type].size;if(p.x<s||p.y<s||p.x>WORLD.w-s||p.y>WORLD.h-s||buildings.some(b=>distance(b,p)<b.size+s+20)||nodes.some(n=>distance(n,p)<n.size+s*.7)){announce('Выбери свободное место');return}gold-=cost[0];wood-=cost[1];building(type,p.x,p.y);placing=null;refresh();announce(names[type]+' построена')}
function action(label,callback,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=callback;$('actions').appendChild(b)}
function refresh(){
 $('gold').textContent=Math.floor(gold);$('wood').textContent=Math.floor(wood);$('supply').textContent=used()+' / '+cap();$('enemyCount').textContent=units.filter(x=>x.team===1).length;const a=$('actions');a.replaceChildren();
 if(placing){$('unitName').textContent='Строительство';$('unitInfo').textContent='Нажми на свободную точку карты';$('unitHP').textContent='Esc или ПКМ — отменить';$('portrait').textContent=bcfg[placing].icon;action('Отменить',()=>{placing=null;refresh()});return}
 const items=selection.filter(x=>x.hp>0);selection=items;
 $('selectionCount').textContent=items.length>1?'Выделено: '+items.length:'';
 if(!items.length){$('portrait').textContent='🏰';$('unitName').textContent='Королевства Севера';$('unitInfo').textContent='Выбери ратушу, рабочего или отряд';$('unitHP').textContent='Цель — разрушить вражескую крепость.';return}
 const first=items[0],group=items.length>1;const friendly=items.filter(o=>o.team===0);
 $('portrait').textContent=group?'⚔️':cfg[first.type]?.icon||bcfg[first.type]?.icon||'🌲';
 $('unitName').textContent=group?'Группа войск':names[first.type]||'Ресурс';
 $('unitInfo').textContent=group?'Отданные приказы получат все выделенные бойцы.':first.team===1?'Вражеский объект':first.amount!==undefined?'Осталось ресурсов: '+Math.floor(first.amount):first.type==='hall'?'Нанимай рабочих для добычи ресурсов.':first.type==='barracks'?'Готовь мечников и лучников.':first.type==='worker'?'Добывай ресурсы и строй здания.':'ПКМ по земле — движение; по врагу — атака.';
 $('unitHP').textContent=group?items.length+' объектов':first.hp!==undefined?'Здоровье: '+Math.ceil(first.hp)+' / '+first.max:'';
 if(friendly.some(o=>o.type==='hall'))action('Рабочий · 55🟡',()=>train('worker',friendly.find(o=>o.type==='hall')));
 if(friendly.some(o=>o.type==='barracks')){const b=friendly.find(o=>o.type==='barracks');action('Мечник · 95🟡 35🪵',()=>train('soldier',b));action('Лучник · 120🟡 60🪵',()=>train('archer',b))}
 if(friendly.some(o=>o.type==='worker')){action('Казармы · 170🟡 110🪵',()=>{placing='barracks';refresh()});action('Ферма · 85🟡 75🪵',()=>{placing='farm';refresh()});action('Башня · 120🟡 135🪵',()=>{placing='tower';refresh()})}
 if(friendly.some(o=>cfg[o.type])){action('Стоп',()=>{for(const u of friendly.filter(o=>cfg[o.type]))u.order=null;announce('Приказ отменён')})}
}
function particle(x,y,color,n=5){for(let i=0;i<n;i++)sparks.push({x,y,vx:rand(-75,75),vy:rand(-90,35),life:rand(.2,.7),color})}
function damage(t,points){t.hp-=points;if(t.hp>0)return;particle(t.x,t.y,'#f2b66d',15);units=units.filter(o=>o!==t);buildings=buildings.filter(o=>o!==t);selection=selection.filter(o=>o!==t);refresh()}
function winLose(why){if(result)return;result=why;paused=false;$('endTitle').textContent=why==='win'?'ПОБЕДА!':'ПОРАЖЕНИЕ';$('endText').textContent=why==='win'?'Вражеская крепость пала. Север принадлежит тебе!':'Твоя ратуша разрушена. Собери новую армию!';$('end').hidden=false}
function tick(dt){if(paused||result)return;elapsed+=dt;if(toastExpires<elapsed)$('toast').classList.remove('show');
 const wait=(queue)=>queue.length?queue[0]:null;
 for(const b of buildings){if(wait(b.queue)){b.progress+=dt/wait(b.queue).duration;if(b.progress>=1){const next=b.queue.shift();unit(next.type,b.x+rand(-60,60),b.y+b.size+22,b.team);b.progress=0;refresh()}}if(b.type==='tower'){b.attackCd-=dt;const foe=closest(b,units.filter(u=>u.team!==b.team&&distance(b,u)<255));if(foe&&b.attackCd<=0){damage(foe,11);particle(foe.x,foe.y,'#f0df9a',3);b.attackCd=1.65}}}
 for(const u of [...units]){u.attackCd-=dt;if(u.hp<=0)continue;
 if(!u.order&&u.team===1){const near=closest(u,[...units,...buildings].filter(v=>v.team===0&&distance(v,u)<670));if(near)order(u,near,'attack',near)}
 if(!u.order&&u.team===0&&u.type!=='worker'){const near=closest(u,[...units,...buildings].filter(v=>v.team===1&&distance(v,u)<180));if(near)order(u,near,'attack',near)}
 const o=u.order;if(!o)continue;if(o.target){if((o.target.hp!==undefined&&o.target.hp<=0)||(o.target.amount!==undefined&&o.target.amount<=0)){u.order=null;continue}o.x=o.target.x;o.y=o.target.y}
 const d=distance(u,o),need=o.job==='attack'?u.range+(o.target?.size||0)*.5:o.job==='harvest'?38:8;
 if(d>need){const step=Math.min(d-need,u.speed*dt);u.x=clamp(u.x+(o.x-u.x)/d*step,5,WORLD.w-5);u.y=clamp(u.y+(o.y-u.y)/d*step,5,WORLD.h-5)}
 else if(o.job==='attack'&&o.target){if(u.attackCd<=0){damage(o.target,u.damage);particle(o.target.x,o.target.y,'#ffe1a4',2);u.attackCd=1/u.rate}}
 else if(o.job==='harvest'&&o.target&&u.type==='worker'){u.carry+=dt*12;if(u.carry>=25){const n=Math.min(25,o.target.amount);o.target.amount-=n;if(o.target.type==='tree')wood+=n;else gold+=n;u.carry=0;particle(u.x,u.y,'#eaca69',2);if(o.target.amount<=0){nodes=nodes.filter(x=>x!==o.target);u.order=null}refresh()}}
 else u.order=null
 }
 sparks=sparks.filter(p=>(p.x+=p.vx*dt,p.y+=p.vy*dt,p.life-=dt,p.life>0));
 if(elapsed>28+wave*26){wave++;const count=Math.min(2+wave,10);for(let i=0;i<count;i++){const u=unit('enemy',rand(2010,2200),rand(835,1130),1);const hall=buildings.find(b=>b.type==='hall');if(hall)order(u,hall,'attack',hall)}announce('⚠ Волна '+wave+': враги приближаются!')}
 if(!buildings.some(b=>b.type==='hall'))winLose('lose');
 if(!buildings.some(b=>b.type==='enemyhall'))winLose('win');
 const speed=560*dt/zoom;if(keys.w||keys.ArrowUp)cam.y-=speed;if(keys.s||keys.ArrowDown)cam.y+=speed;if(keys.a||keys.ArrowLeft)cam.x-=speed;if(keys.d||keys.ArrowRight)cam.x+=speed;clampCam();
}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#3b604a';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-cam.x*zoom,-cam.y*zoom);ctx.scale(zoom,zoom);
 const ground=ctx.createLinearGradient(0,0,WORLD.w,WORLD.h);ground.addColorStop(0,'#526e4d');ground.addColorStop(.5,'#3e6550');ground.addColorStop(1,'#56704b');ctx.fillStyle=ground;ctx.fillRect(0,0,WORLD.w,WORLD.h);
 ctx.strokeStyle='#2f54424a';ctx.lineWidth=3;for(let x=0;x<WORLD.w;x+=75)for(let y=0;y<WORLD.h;y+=75){const seed=(Math.sin(x*17+y*13)*43758.5453)%1;ctx.fillStyle=seed>.2?'#9cbb7555':'#20492c44';ctx.beginPath();ctx.arc(x+27,y+38,5+Math.abs(seed)*8,0,Math.PI*2);ctx.fill()}
 ctx.strokeStyle='#987f5c88';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(620,950);ctx.bezierCurveTo(1050,690,1650,1220,2140,950);ctx.stroke();ctx.strokeStyle='#b7a57a66';ctx.lineWidth=3;ctx.stroke();
 for(const n of nodes){ctx.fillStyle=n.type==='tree'?'#254e39':'#c8a55a';ctx.beginPath();ctx.arc(n.x,n.y,n.size,0,Math.PI*2);ctx.fill();ctx.fillStyle=n.type==='tree'?'#5a8a53':'#f0cc7b';ctx.beginPath();ctx.arc(n.x-5,n.y-7,n.size*.65,0,Math.PI*2);ctx.fill();if(n.type==='tree'){ctx.fillStyle='#214c37';ctx.fillRect(n.x-4,n.y+12,8,18)}}
 for(const b of buildings){ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(b.x,b.y+b.size*.42,b.size*.85,b.size*.48,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=b.team?'#713d42':'#496d72';ctx.fillRect(b.x-b.size/2,b.y-b.size/2,b.size,b.size*.8);ctx.fillStyle=b.team?'#b55e61':'#abc1b3';ctx.beginPath();ctx.moveTo(b.x-b.size*.63,b.y-b.size*.1);ctx.lineTo(b.x,b.y-b.size*.74);ctx.lineTo(b.x+b.size*.63,b.y-b.size*.1);ctx.closePath();ctx.fill();ctx.fillStyle='#edd89c';ctx.font=(b.size*.45)+'px serif';ctx.textAlign='center';ctx.fillText(bcfg[b.type].icon,b.x,b.y+b.size*.24);bar(b);if(b.queue.length){ctx.strokeStyle='#f1d59d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(b.x,b.y,b.size*.67,-Math.PI/2,-Math.PI/2+Math.PI*2*b.progress);ctx.stroke()}}
 for(const u of units){ctx.fillStyle='#14251daa';ctx.beginPath();ctx.ellipse(u.x,u.y+9,u.size*.95,u.size*.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=u.team?'#ab5159':'#5b9ac4';ctx.beginPath();ctx.arc(u.x,u.y,u.size,0,Math.PI*2);ctx.fill();ctx.strokeStyle=u.team?'#e99ba0':'#c9f1ef';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f7e1b0';ctx.font=(u.size*1.1)+'px serif';ctx.textAlign='center';ctx.fillText(cfg[u.type].icon,u.x,u.y+5);if(u.hp<u.max)bar(u)}
 for(const o of selection){if(o.hp<=0)continue;ctx.strokeStyle='#ffdc80';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(o.x,o.y,o.size+9,0,Math.PI*2);ctx.stroke()}for(const p of sparks){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4)}ctx.globalAlpha=1;
 if(drag){const a=xy(drag.x,drag.y),b=xy(drag.ex,drag.ey);ctx.strokeStyle='#c7eec8';ctx.fillStyle='#90dda133';ctx.fillRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));ctx.strokeRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y))}
 if(placing){const p=xy(mouse.x,mouse.y),n=bcfg[placing].size;ctx.fillStyle='#afe9a160';ctx.strokeStyle='#e9d2a4';ctx.fillRect(p.x-n/2,p.y-n/2,n,n);ctx.strokeRect(p.x-n/2,p.y-n/2,n,n)}ctx.restore();drawMap()}
function bar(o){const x=o.x-o.size*.55,y=o.y-o.size*.85,w=o.size*1.1;ctx.fillStyle='#102a30';ctx.fillRect(x,y,w,5);ctx.fillStyle=o.team?'#ea7d75':'#8bdf9e';ctx.fillRect(x,y,w*Math.max(0,o.hp)/o.max,5)}
function drawMap(){mc.clearRect(0,0,200,140);mc.fillStyle='#284a37';mc.fillRect(0,0,200,140);for(const n of nodes){mc.fillStyle=n.type==='tree'?'#32654b':'#dbb95e';mc.fillRect(n.x/WORLD.w*200,n.y/WORLD.h*140,2,2)}for(const b of buildings){mc.fillStyle=b.team?'#d67c7a':'#8ed7ec';mc.fillRect(b.x/WORLD.w*200-3,b.y/WORLD.h*140-3,6,6)}for(const u of units){mc.fillStyle=u.team?'#ee8b8e':'#d1e9e9';mc.fillRect(u.x/WORLD.w*200,u.y/WORLD.h*140,2,2)}mc.strokeStyle='#f8e4a9';mc.strokeRect(cam.x/WORLD.w*200,cam.y/WORLD.h*140,W/zoom/WORLD.w*200,H/zoom/WORLD.h*140)}
function commandAt(p){const target=hit(p);for(let i=0;i<selection.length;i++){const u=selection[i];if(!units.includes(u)||u.team!==0)continue;if(target&&target.team===1)order(u,target,'attack',target);else if(target&&target.amount!==undefined&&u.type==='worker')order(u,target,'harvest',target);else order(u,{x:p.x+Math.cos(i*2.4)*23,y:p.y+Math.sin(i*2.4)*23})}}
function choose(arr){selection=arr.filter(o=>o&&o.hp>0);refresh();if(!selection.some(o=>units.includes(o)&&o.team===0))commandArmed=false;syncCommand()}
function selectType(type){choose(units.filter(u=>u.team===0&&(type==='army'?u.type!=='worker':u.type==='worker')))}
function syncCommand(){const b=$('touchOrder');if(!b)return;b.classList.toggle('active',commandArmed);b.textContent=commandArmed?'↗ Выбери цель':'↗ Приказ';b.setAttribute('aria-pressed',String(commandArmed))}
const touchOrder=document.createElement('button');touchOrder.id='touchOrder';touchOrder.type='button';touchOrder.title='Для телефонов: сначала выбери юнита, затем нажми «Приказ» и укажи цель на карте';touchOrder.textContent='↗ Приказ';document.querySelector('.topactions').prepend(touchOrder);touchOrder.onclick=()=>{if(!selection.some(o=>units.includes(o)&&o.team===0)){announce('Сначала выдели своих юнитов');return}commandArmed=!commandArmed;syncCommand();announce(commandArmed?'Теперь коснись цели: земля, враг или ресурс':'Режим приказа отменён')};
function togglePause(){if(result)return;paused=!paused;$('pause').textContent=paused?'▶ Продолжить':'Ⅱ Пауза';announce(paused?'Игра на паузе':'Игра продолжается')}
canvas.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;if(drag){drag.ex=e.clientX;drag.ey=e.clientY}});
canvas.addEventListener('pointerdown',e=>{if(e.button===0){drag={x:e.clientX,y:e.clientY,ex:e.clientX,ey:e.clientY};canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointerup',e=>{if(e.button!==0||paused||result)return;const p=xy(e.clientX,e.clientY);if(placing){build(placing,p);drag=null;return}if(commandArmed){commandAt(p);commandArmed=false;syncCommand();drag=null;announce('Приказ отдан');return}if(drag&&Math.hypot(drag.ex-drag.x,drag.ey-drag.y)>8){const x1=Math.min(drag.x,drag.ex),x2=Math.max(drag.x,drag.ex),y1=Math.min(drag.y,drag.ey),y2=Math.max(drag.y,drag.ey);choose(units.filter(u=>u.team===0).filter(u=>{const q=screen(u.x,u.y);return q.x>=x1&&q.x<=x2&&q.y>=y1&&q.y<=y2}))}else{const found=hit(p,true);choose(e.shiftKey&&found?[...selection,found]:found?[found]:[])}drag=null});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(paused||result)return;if(placing){placing=null;refresh()}else commandAt(xy(e.clientX,e.clientY))});
canvas.addEventListener('wheel',e=>{e.preventDefault();const focus=xy(e.clientX,e.clientY);zoom=clamp(zoom*(e.deltaY<0?1.12:.89),.65,1.8);cam.x=focus.x-e.clientX/zoom;cam.y=focus.y-e.clientY/zoom;clampCam()},{passive:false});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;keys[e.key]=true;if(e.repeat)return;if(e.key===' '){togglePause()}if(e.key==='1')selectType('army');if(e.key==='2')selectType('workers');if(e.key.toLowerCase()==='h')cameraHome();if(e.key==='Escape'){placing=null;commandArmed=false;choose([])}});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;keys[e.key]=false});window.addEventListener('blur',()=>keys={});window.addEventListener('resize',resize);
map.addEventListener('click',e=>{const r=map.getBoundingClientRect();cam.x=(e.clientX-r.left)/r.width*WORLD.w-W/zoom/2;cam.y=(e.clientY-r.top)/r.height*WORLD.h-H/zoom/2;clampCam()});
$('pause').onclick=togglePause;$('restart').onclick=reset;$('playAgain').onclick=reset;$('home').onclick=cameraHome;$('selectArmy').onclick=()=>selectType('army');$('selectWorkers').onclick=()=>selectType('workers');
function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;tick(dt);draw();requestAnimationFrame(frame)}resize();reset();requestAnimationFrame(frame);
})();