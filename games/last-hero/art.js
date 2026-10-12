// Hand-drawn vector game icons. No emoji glyphs or third-party assets.
(()=>{
'use strict';
function poly(ctx,pts,fill,stroke='#13202b',w=2){ctx.beginPath();ctx.moveTo(...pts[0]);for(let k=1;k<pts.length;k++)ctx.lineTo(...pts[k]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}}
function circle(ctx,x,y,r,fill,stroke='#152632',w=2){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=w;ctx.strokeStyle=stroke;ctx.stroke()}}
function rounded(ctx,x,y,w,h,r,fill,stroke='#172530'){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function stroke(ctx,pts,color,width=3){ctx.beginPath();ctx.moveTo(...pts[0]);for(let k=1;k<pts.length;k++)ctx.lineTo(...pts[k]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
function icon(ctx,kind,x,y,size=40,t=0){
ctx.save();ctx.translate(x,y);ctx.scale(size/48,size/48);
ctx.shadowColor='#030b11aa';ctx.shadowBlur=7;ctx.shadowOffsetY=4;
if(['hero','goblin','skeleton','archer','shaman','elite','orc'].includes(kind)){ctx.fillStyle='#07131666';ctx.beginPath();ctx.ellipse(0,21,20,7,0,0,7);ctx.fill()}
ctx.shadowBlur=0;ctx.shadowOffsetY=0;
switch(kind){
case 'hero':{
  ctx.save();ctx.rotate(Math.sin(t*6+x*.02)*.018);
  poly(ctx,[[-15,5],[-18,22],[-5,24],[-1,13]],'#8496aa');poly(ctx,[[15,5],[18,22],[5,24],[1,13]],'#8496aa');
  rounded(ctx,-15,-4,30,25,8,'#526b88');poly(ctx,[[-10,0],[0,-7],[10,0],[8,14],[0,18],[-8,14]],'#9eb8c7');poly(ctx,[[0,-6],[6,1],[5,12],[0,17]],'#d8bc76',null);
  circle(ctx,0,-12,16,'#7f95a9');poly(ctx,[[-12,-13],[0,-28],[12,-13],[10,-7],[-10,-7]],'#bfd0d7');rounded(ctx,-11,-14,22,7,3,'#23354c');stroke(ctx,[[-9,-11],[9,-11]],'#e3ce88',2);
  poly(ctx,[[-22,0],[-9,-6],[-5,11],[-19,16]],'#b39458');poly(ctx,[[-19,4],[-12,8],[-15,14],[-22,11]],'#e8d095',null);
  stroke(ctx,[[18,9],[29,-19]],'#c9dfeb',5);poly(ctx,[[28,-26],[33,-12],[25,-14]],'#f4e3b1');stroke(ctx,[[15,2],[24,6]],'#e9c078',4);ctx.restore();break}
case 'goblin':{
  poly(ctx,[[-12,-7],[-29,-19],[-23,2],[-13,3]],'#709d57');poly(ctx,[[12,-7],[29,-19],[23,2],[13,3]],'#709d57');
  rounded(ctx,-14,3,28,18,8,'#596743');circle(ctx,0,-9,17,'#7cad5d');circle(ctx,-7,-12,4,'#e2ca76');circle(ctx,7,-12,4,'#e2ca76');circle(ctx,-7,-11,2,'#2b2a1c',null);circle(ctx,7,-11,2,'#2b2a1c',null);poly(ctx,[[-6,-1],[0,3],[6,-1]],'#4b6c3a');stroke(ctx,[[-9,6],[9,6]],'#304f39',3);break}
case 'skeleton':{
  rounded(ctx,-14,7,28,16,6,'#596272');stroke(ctx,[[-8,9],[-8,21],[0,21],[0,7],[8,7],[8,21]],'#c8c8b7',3);
  circle(ctx,0,-9,17,'#e1dfca');circle(ctx,-7,-12,5,'#394757',null);circle(ctx,7,-12,5,'#394757',null);poly(ctx,[[-3,-3],[0,-8],[3,-3]],'#6b6c61');rounded(ctx,-8,2,16,6,1,'#bcbba8');stroke(ctx,[[-3,3],[-3,7],[3,3],[3,7]],'#5b666b',1.3);break}
case 'archer':{
  poly(ctx,[[-18,8],[-14,-14],[0,-28],[14,-14],[18,8],[12,22],[-12,22]],'#487251');circle(ctx,0,-5,12,'#a7a781');rounded(ctx,-9,-12,18,9,3,'#2b493f');circle(ctx,-4,-8,2,'#ffe5a1',null);circle(ctx,4,-8,2,'#ffe5a1',null);
  ctx.beginPath();ctx.arc(20,1,16,-Math.PI/2,Math.PI/2);ctx.strokeStyle='#e2b773';ctx.lineWidth=4;ctx.stroke();stroke(ctx,[[20,-15],[20,17]],'#f7e0b0',1.5);stroke(ctx,[[14,0],[30,0]],'#d7c7a3',2);poly(ctx,[[32,0],[25,-4],[25,4]],'#f4d9a9');break}
case 'shaman':{
  poly(ctx,[[-18,19],[-14,-11],[0,-25],[14,-11],[18,19]],'#446e67');poly(ctx,[[-14,-11],[0,-32],[14,-11]],'#64b39d');circle(ctx,0,-8,11,'#88a69a');rounded(ctx,-8,-12,16,7,3,'#203e3d');circle(ctx,-4,-8,2,'#abffd8',null);circle(ctx,4,-8,2,'#abffd8',null);stroke(ctx,[[19,21],[23,-21]],'#bfb18a',4);circle(ctx,23,-23,8,'#4ccf9f','#b4ffe2');circle(ctx,23,-23,3,'#e8fff0',null);break}
case 'elite':{
  poly(ctx,[[-23,-14],[-8,-8],[-14,10],[-25,10]],'#9e744c');poly(ctx,[[23,-14],[8,-8],[14,10],[25,10]],'#9e744c');rounded(ctx,-17,-1,34,25,5,'#855c44');poly(ctx,[[-12,3],[0,-3],[12,3],[8,15],[-8,15]],'#db9d5f');circle(ctx,0,-12,17,'#9e6c4d');poly(ctx,[[-16,-20],[-23,-30],[-7,-26]],'#c6ae78');poly(ctx,[[16,-20],[23,-30],[7,-26]],'#c6ae78');rounded(ctx,-11,-13,22,7,3,'#352a2d');circle(ctx,-6,-10,2,'#ffcc79',null);circle(ctx,6,-10,2,'#ffcc79',null);break}
case 'orc':{
  poly(ctx,[[-21,2],[-35,-16],[-19,-15]],'#94664d');poly(ctx,[[21,2],[35,-16],[19,-15]],'#94664d');
  rounded(ctx,-21,-2,42,29,7,'#81533e');poly(ctx,[[-14,0],[0,-7],[14,0],[17,19],[-17,19]],'#af7657');
  circle(ctx,0,-16,22,'#8c9d62');poly(ctx,[[-23,-14],[-34,-27],[-28,-3]],'#a4a66b');poly(ctx,[[23,-14],[34,-27],[28,-3]],'#a4a66b');rounded(ctx,-15,-21,30,10,3,'#434436');circle(ctx,-9,-17,3,'#ffe38c',null);circle(ctx,9,-17,3,'#ffe38c',null);
  poly(ctx,[[-15,-4],[-8,-13],[-4,-2]],'#f8e5c2');poly(ctx,[[15,-4],[8,-13],[4,-2]],'#f8e5c2');rounded(ctx,-12,7,24,7,3,'#594034');stroke(ctx,[[-8,11],[8,11]],'#d2ad7b',2);break}
case 'gold':{
  circle(ctx,0,0,17,'#a05d29','#ffe5a2',3);circle(ctx,0,0,13,'#f0b94f','#8a5d32',1.5);stroke(ctx,[[-5,-3],[1,-7],[6,-3],[5,4],[0,8],[-6,5]],'#ffedb5',3);break}
case 'potion':{
  rounded(ctx,-8,-21,16,6,2,'#c5b3a1');rounded(ctx,-11,-16,22,32,7,'#beeee2');rounded(ctx,-8,-7,16,20,4,'#d3596e',null);circle(ctx,-3,1,3,'#ffd9ba',null);stroke(ctx,[[-6,-12],[-4,-12]],'#ffffff',2);break}
case 'item':{
  poly(ctx,[[-16,-12],[0,-22],[16,-12],[16,13],[0,22],[-16,13]],'#7755a0','#ddc5ff',3);poly(ctx,[[0,-17],[12,-9],[0,15],[-12,-9]],'#c5abef',null);stroke(ctx,[[0,-13],[0,13]],'#f9e5ff',3);break}
case 'chest':{
  rounded(ctx,-21,-7,42,28,5,'#8f5b34','#e2ae69');rounded(ctx,-21,-19,42,18,8,'#a56d3c','#edbe7b');rounded(ctx,-4,-19,8,40,2,'#efc874','#684320');rounded(ctx,-21,0,42,6,1,'#65442d',null);circle(ctx,0,4,4,'#4a3b2a','#ffe5a1');break}
case 'stone':{
  poly(ctx,[[-22,11],[-18,-9],[-7,-19],[11,-14],[23,2],[14,17],[-10,19]],'#697b7c','#243d43',2);
  poly(ctx,[[-18,-8],[-7,-19],[11,-14],[1,0],[-10,5]],'#9aa3a0',null);
  stroke(ctx,[[-4,6],[4,11],[13,10]],'#475f60',2);break}
case 'rune':{
  circle(ctx,0,0,20,'#263c41','#547f84',2);
  ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.strokeStyle='#7c9f9d';ctx.lineWidth=1.4;ctx.stroke();
  stroke(ctx,[[-8,8],[0,-12],[8,8],[-8,-3],[8,-3]],'#73c8b9',2);
  circle(ctx,0,-12,3,'#a4f3e1',null);break}
case 'flowers':{
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;circle(ctx,Math.cos(a)*8,Math.sin(a)*7,4,j%2?'#d9b973':'#9e849d',null)}
  circle(ctx,0,0,5,'#e3d18e',null);
  stroke(ctx,[[0,6],[0,20]],'#497c59',2);break}
case 'banner':{
  stroke(ctx,[[0,20],[0,-30]],'#9c9b86',3);
  poly(ctx,[[1,-28],[19,-23],[19,3],[10,0],[1,3]],'#6d4051','#e0b679',1.5);
  poly(ctx,[[6,-20],[15,-17],[15,-10],[10,-7],[6,-10]],'#c3a16d',null);
  break}
case 'tree':{
  poly(ctx,[[-4,3],[4,3],[5,19],[-5,19]],'#71523b',null);poly(ctx,[[0,-28],[-18,-6],[-10,-6],[-23,9],[23,9],[10,-6],[18,-6]],'#2b7252','#1b4e42',2);poly(ctx,[[0,-21],[-10,-6],[0,-9],[11,-4]],'#479267',null);break}
default:circle(ctx,0,0,14,'#b9c8d5');
}
ctx.restore();
}
window.LastHeroArt={draw:icon};
})();