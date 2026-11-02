(()=>{'use strict';
const KEY='last-hero-records-v1';
const defaults=()=>({runs:0,wins:0,bestKills:0,bestWave:0,bestTime:null,last:[]});
function read(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'?{...defaults(),...v}:defaults()}catch{return defaults()}}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
function format(seconds){return Math.floor(seconds/60).toString().padStart(2,'0')+':'+Math.floor(seconds%60).toString().padStart(2,'0')}
function render(){const v=read(),el=document.getElementById('records');if(!el)return;
el.replaceChildren();
const title=document.createElement('h3');title.textContent='📜 Летопись забегов';el.appendChild(title);
const stats=document.createElement('p');stats.textContent='Забегов: '+v.runs+' · Побед: '+v.wins+' · Рекорд убийств: '+v.bestKills+' · Лучшая волна: '+v.bestWave;el.appendChild(stats);
if(v.bestTime!==null){const best=document.createElement('p');best.textContent='🏆 Самая быстрая победа: '+format(v.bestTime);el.appendChild(best)}
const list=document.createElement('ol');for(const a of v.last){const li=document.createElement('li');li.textContent=(a.win?'🏆 Победа':'💀 Поражение')+' · волна '+a.wave+' · '+a.kills+' врагов · '+format(a.time);list.appendChild(li)}el.appendChild(list);
}
function record(result){if(!result||typeof result.kills!=='number'||typeof result.time!=='number')return;
const v=read();v.runs++;if(result.win)v.wins++;
v.bestKills=Math.max(v.bestKills,result.kills);v.bestWave=Math.max(v.bestWave,result.wave);
if(result.win&&(v.bestTime===null||result.time<v.bestTime))v.bestTime=result.time;
v.last.unshift({win:!!result.win,wave:result.wave,kills:result.kills,time:Math.round(result.time)});
v.last=v.last.slice(0,5);save(v);render();
}
window.LastHeroRecords={record,render};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();