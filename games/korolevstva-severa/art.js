/* Vector art kit for Northern Kingdoms alpha 0.3 — resolution independent, no emoji sprites. */
(()=>{'use strict';
const R=window.RTS,TAU=Math.PI*2;
const poly=(c,points,fill,stroke=null,w=1)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.lineWidth=w;c.strokeStyle=stroke;c.stroke()}};
const ellipse=(c,x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill()};
const rect=(c,x,y,w,h,fill,stroke)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x,y,w,h)}};
const line=(c,x,y,a,b,color,w=2)=>{c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.stroke()};
const palette=t=>t?{stone:'#544b56',front:'#655862',roof:'#85454d',trim:'#d4a79b',cloth:'#b9565a',metal:'#e6b4ad',shade:'#392e38'}:{stone:'#626f6e',front:'#8b9480',roof:'#315e69',trim:'#dac392',cloth:'#428b9c',metal:'#c8dfe0',shade:'#243d49'};
function roof(c,w,h,p){poly(c,[[-w*.62,-h*.26],[0,-h*.84],[w*.62,-h*.26],[w*.57,-h*.17],[0,-h*.64],[-w*.57,-h*.17]],p.roof,p.trim,2);for(let k=-2;k<=2;k++)line(c,k*w*.13,-h*.37-Math.abs(k)*h*.03,k*w*.15,-h*.47-Math.abs(k)*h*.025,p.shade,1)}
function castle(c,e,p){const s=e.size;ellipse(c,0,s*.28,s*.78,s*.4,'#14252378');rect(c,-s*.48,-s*.38,s*.96,s*.78,p.stone,p.shade);rect(c,-s*.36,-s*.18,s*.72,s*.53,p.front,p.shade);rect(c,-s*.5,-s*.5,s*.22,s*.73,p.stone,p.trim);rect(c,s*.28,-s*.5,s*.22,s*.73,p.stone,p.trim);for(const x of [-s*.51,-s*.4,-s*.29,s*.27,s*.38,s*.49])rect(c,x,-s*.58,s*.11,s*.12,p.trim);roof(c,s*.82,s*.75,p);rect(c,-s*.125,s*.13,s*.25,s*.3,p.shade,p.trim);poly(c,[[-s*.125,s*.13],[0,s*.03],[s*.125,s*.13]],p.shade);line(c,0,-s*.8,0,-s*1.12,p.metal,2);poly(c,[[0,-s*1.11],[s*.32,-s*1.02],[0,-s*.95]],p.cloth);for(const x of [-s*.38,s*.38])rect(c,x-s*.04,-s*.27,s*.08,s*.13,p.shade,p.trim)}
function barracks(c,e,p){const s=e.size;ellipse(c,0,s*.32,s*.85,s*.4,'#0f251f70');rect(c,-s*.6,-s*.3,s*1.2,s*.72,p.front,p.shade);roof(c,s*1.12,s*.7,p);rect(c,-s*.16,s*.06,s*.32,s*.35,p.shade,p.trim);for(const x of [-s*.44,s*.43]){line(c,x,-s*.46,x,s*.32,p.metal,3);poly(c,[[x,-s*.5],[x+s*.07,-s*.35],[x,-s*.27],[x-s*.07,-s*.35]],p.trim)}}
function farm(c,e,p){const s=e.size;ellipse(c,0,s*.3,s*.82,s*.34,'#142c227a');rect(c,-s*.55,-s*.27,s*1.1,s*.63,'#a8956f',p.shade);roof(c,s, s*.6,{...p,roof:'#86614c'});rect(c,-s*.12,s*.04,s*.25,s*.33,'#503b2c','#e2c493');for(let x=-1;x<=1;x++)rect(c,x*s*.19-s*.045,-s*.07,s*.09,s*.1,'#b1d3a5',p.trim);for(let i=0;i<4;i++){ellipse(c,-s*.7+i*s*.15,s*.28,s*.055,s*.13,i%2?'#c8b96f':'#b8a567')}}
function tower(c,e,p){const s=e.size;ellipse(c,0,s*.33,s*.68,s*.4,'#112a2270');poly(c,[[-s*.35,s*.3],[-s*.31,-s*.5],[s*.31,-s*.5],[s*.35,s*.3]],p.stone,p.shade,2);rect(c,-s*.43,-s*.6,s*.86,s*.15,p.trim);for(let i=-2;i<=2;i++)rect(c,i*s*.18-s*.075,-s*.76,s*.15,s*.2,p.front,p.shade);rect(c,-s*.09,-s*.3,s*.18,s*.26,p.shade,p.trim);line(c,0,-s*.72,0,-s*1.02,p.metal,3);poly(c,[[0,-s*1.02],[s*.25,-s*.94],[0,-s*.87]],p.cloth)}
function unit(c,e,t){const p=palette(e.team),type=e.type,moving=!!e.order&&['move','attackMove','attack','harvest','repair'].includes(e.order.action);const bob=Math.sin(t*(moving?11:3)+e.id)*1.35,leg=Math.sin(t*11+e.id)*3*(moving?1:.2);c.translate(0,bob);
ellipse(c,0,8,16,6,'#0d252390');line(c,-5,3,-6+leg,12,'#2c3233',3.5);line(c,5,3,6-leg,12,'#2c3233',3.5);
rect(c,-8,-16,16,21,p.cloth,p.shade);poly(c,[[-7,-14],[0,-19],[7,-14],[5,3],[-5,3]],type==='worker'?'#8d7852':type==='archer'?'#667a55':p.cloth,p.trim,1.4);
ellipse(c,0,-23,7,7,'#d5ae82');
if(type==='soldier'||type==='guardian'||type==='enemy'){poly(c,[[-8,-24],[0,-31],[8,-24],[6,-20],[-6,-20]],p.metal,p.shade);rect(c,-5,-25,10,3,p.shade);ellipse(c,-10,-4,type==='guardian'?9:5,type==='guardian'?15:10,type==='guardian'?'#c8b7a0':p.metal);line(c,-10,-7,-10,2,p.trim,1);line(c,11,-16,13,-34,p.trim,3);poly(c,[[13,-34],[16,-38],[19,-34],[14,-23],[12,-23]],'#e5e6d8',p.shade)}
else if(type==='archer'||type==='crossbow'||type==='raider'){line(c,9,-17,18,-5,'#ac8156',2);if(type==='crossbow'){rect(c,7,-16,18,6,'#704c2e');line(c,11,-17,28,-24,'#dcc392',2);line(c,11,-17,27,-9,'#dcc392',2)}c.beginPath();c.arc(15,-12,12,-Math.PI*.65,Math.PI*.53);c.strokeStyle='#b58c56';c.lineWidth=2.3;c.stroke();line(c,5,-1,18,-21,'#e0dbb6',1);rect(c,-12,-23,7,15,'#886540',p.shade)}
else{line(c,8,-10,18,-28,'#957750',3);poly(c,[[16,-30],[25,-28],[22,-20],[15,-20]],'#b6bcaf',p.shade);rect(c,-11,-11,5,12,'#cfbb86')}
}
function tree(c,e,t){const s=1+Math.sin(e.id*47)*.17;ellipse(c,0,13,19*s,7,'#10241f70');rect(c,-4,-12,8,29,'#685039');const sway=Math.sin(t*.45+e.id)*1.3;c.translate(sway,0);for(let i=0;i<3;i++){const y=-11-i*12,wide=(20-i*3)*s;poly(c,[[-wide,y+12],[0,y-17],[wide,y+12]],i%2?'#2d6246':'#356f47','#184938',1)}line(c,-4,-42,1,-45,'#80ac6d',2)}
function ore(c,e){ellipse(c,0,14,31,11,'#2a231a66');poly(c,[[-28,14],[-24,-5],[-8,-18],[9,-26],[24,-8],[30,15]],'#816b48','#463e30',2);poly(c,[[-19,10],[-9,-9],[5,-18],[15,4]],'#e5c268','#fff0b3',1);poly(c,[[6,-18],[18,-9],[24,13],[14,8]],'#c69d4e');poly(c,[[-21,12],[-12,3],[-2,12]],'#f3d987')}
function draw(ctx,e,time){const p=R.screen(e);if(p.x< -130||p.x>innerWidth+130||p.y< -130||p.y>innerHeight+130)return;ctx.save();ctx.translate(p.x,p.y);ctx.scale(R.zoom,R.zoom);
 const colors=palette(e.team);if(e.kind==='resource'){if(e.type==='tree')tree(ctx,e,time);else ore(ctx,e)}
 else if(e.kind==='building'){if(e.type==='hall'||e.type==='enemyhall')castle(ctx,e,colors);else if(e.type==='barracks')barracks(ctx,e,colors);else if(e.type==='farm')farm(ctx,e,colors);else tower(ctx,e,colors)}
 else unit(ctx,e,time);
 if(e.hp!==undefined&&e.hp<e.max){const w=Math.max(30,e.size*1.4);rect(ctx,-w/2,-e.size-23,w,5,'#1d2729');rect(ctx,-w/2,-e.size-23,w*Math.max(0,e.hp)/e.max,5,e.team?'#f1887e':'#97e4a8')}
 if(R.selected.includes(e)){ctx.beginPath();ctx.ellipse(0,12,e.size+10,e.size*.48+5,0,0,TAU);ctx.strokeStyle='#fbe5a0';ctx.lineWidth=2.5;ctx.stroke()}
 ctx.restore()}
R.art={draw};
})();