/* Turbo Legends 0.9 — live circuit radar, corner preview, real-time 20-car positions. */
(()=>{'use strict';
const G=window.TurboLegends;if(!G)return;
const canvas=document.getElementById('raceMap');if(!canvas)return;
const ctx=canvas.getContext('2d'),box=document.getElementById('mapContainer'),label=document.getElementById('mapTrackLabel'),toggle=document.getElementById('mapToggle');
const W=230,H=177;canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);
let circuit=null,samples=[],last=-1;
const turns=(z,t)=>{const p=((z%t.length)+t.length)%t.length;return (Math.sin(p/760)+.58*Math.sin(p/370+1.1)+.26*Math.sin(p/173+.6))*t.twist};
function build(t){const steps=180;const a=[];let x=0,y=0,heading=-Math.PI/2;for(let i=0;i<steps;i++){const z=t.length*i/steps;heading+=turns(z,t)*.016;x+=Math.cos(heading);y+=Math.sin(heading);a.push({x,y})}
const minX=Math.min(...a.map(q=>q.x)),maxX=Math.max(...a.map(q=>q.x)),minY=Math.min(...a.map(q=>q.y)),maxY=Math.max(...a.map(q=>q.y));
const scale=Math.min(179/Math.max(1,maxX-minX),119/Math.max(1,maxY-minY));
samples=a.map(q=>({x:W/2+(q.x-(minX+maxX)/2)*scale,y:H/2+(q.y-(minY+maxY)/2)*scale}));circuit=t;label.textContent=t.name;}
function pos(z){const total=circuit.length,normalized=((z%total)+total)%total/total*samples.length,i=Math.floor(normalized)%samples.length,j=(i+1)%samples.length,f=normalized-i;const a=samples[i],b=samples[j];return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}}
function draw(){const s=G.state;if(s.phase==='menu'||s.phase==='finish'){box.hidden=true;return}
box.hidden=false;if(circuit!==s.track)build(s.track);if(s.time-last<.07&&s.phase==='race')return;last=s.time;
ctx.clearRect(0,0,W,H);ctx.fillStyle='#07192b';ctx.fillRect(0,0,W,H);
ctx.beginPath();samples.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.lineWidth=15;ctx.strokeStyle='#b2d1db23';ctx.stroke();ctx.lineWidth=8;ctx.strokeStyle='#35546c';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#83a7b5';ctx.stroke();
for(const o of s.rivals){const q=pos(o.z);ctx.fillStyle='#c0cad8';ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill()}
const p=pos(s.player.z);ctx.shadowColor='#ffdb83';ctx.shadowBlur=13;ctx.fillStyle='#ffda72';ctx.beginPath();ctx.arc(p.x,p.y,5.4,0,7);ctx.fill();ctx.shadowBlur=0;
ctx.fillStyle='#e0edf0';ctx.font='900 10px system-ui';ctx.textAlign='left';ctx.fillText('КРУГ '+s.player.lap+'/3',10,16);
ctx.fillStyle='#f4d19a';ctx.fillText('● ТЫ',10,H-9);
ctx.fillStyle='#c3d3dd';ctx.fillText('● СОПЕРНИКИ',W-90,H-9);
}
function setVisible(yes){box.classList.toggle('map-collapsed',!yes);toggle.textContent=yes?'▴':'▾';toggle.setAttribute('aria-expanded',String(yes))}
let expanded=true;toggle.onclick=()=>{expanded=!expanded;setVisible(expanded)};
window.TurboRaceMap={draw,build,pos};draw();
})();