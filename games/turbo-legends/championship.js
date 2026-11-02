/* Turbo Legends 0.7: four-stage championship with cumulative standings and persistence. */
(()=>{'use strict';
const G=window.TurboLegends,Garage=window.TurboGarage;if(!G||!Garage)return;
const $=id=>document.getElementById(id),KEY='turbo-legends-championship-v1',ROUTE=['coast','alpine','desert','night'];
const RIVALS=['RAVEN','BLAZE','NOVA','STRIKE','FALCON','VECTOR','PHANTOM','SPEEDSTER','LANCER','ECLIPSE','BOLT','CIPHER','ATLAS','VIPER','DRIFT','NEON','RAPTOR','FURY','TEMPEST'];
const POINTS=[25,20,16,13,11,10,9,8,7,6,5,4,3,2,1,0,0,0,0,0];
const initial=()=>({version:1,stage:0,points:{},results:[],finished:false,bonusPaid:false,active:true});
let championship=null;
const safe=()=>{try{localStorage.setItem(KEY,JSON.stringify(championship))}catch{}};
function load(){try{const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data&&data.version===1&&data.active&&Number.isInteger(data.stage)&&data.stage>=0&&data.stage<=ROUTE.length&&Array.isArray(data.results)){championship=data;return true}}catch{}return false}
function table(){const standings=[{id:'YOU',name:'ТЫ',score:championship?.points?.YOU||0},...RIVALS.map(name=>({id:name,name,score:championship?.points?.[name]||0}))];return standings.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'en'))}
function labels(){const d=championship;if(!d)return;const stage=Math.min(d.stage,ROUTE.length-1),track=G.tracks[ROUTE[stage]];
$('champProgress').textContent=d.finished?'ЧЕМПИОНАТ ЗАВЕРШЁН':'ЭТАП '+(stage+1)+' / '+ROUTE.length+' · '+track.name;
$('champStart').textContent=d.finished?'🏆 ИТОГИ ЧЕМПИОНАТА':d.stage===0?'🏁 СТАРТ ЧЕМПИОНАТА':'▶ ПРОДОЛЖИТЬ ЧЕМПИОНАТ';
$('champContinue').hidden=d.finished;
$('champAbort').hidden=false;const rows=$('champStanding');rows.replaceChildren();const board=table();for(let i=0;i<Math.min(8,board.length);i++){const row=document.createElement('div');row.className='champ-row'+(board[i].id==='YOU'?' champ-you':'');const left=document.createElement('span'),right=document.createElement('b');left.textContent=(i+1)+'. '+board[i].name;right.textContent=board[i].score+' оч.';row.append(left,right);rows.appendChild(row)}
$('champHistory').textContent=d.results.length?'Пройдено этапов: '+d.results.length+' из '+ROUTE.length+'. '+d.results.map((x,i)=>ROUTE[i].toUpperCase()+' — '+x.rank+' место').join(' · '):'Четыре гонки. 20 пилотов. Очки суммируются между этапами.';
$('champStatus').textContent=d.finished?'Готово! Чемпионат завершён. Можно начать новый сезон.':'Чемпионат сохраняется автоматически после каждой гонки. Между этапами можно улучшить машину в гараже.';
$('champCard').hidden=false}
function showMenu(){const menu=$('menu');menu.hidden=false;$('champCard').hidden=false;labels()}
function startNew(){championship=initial();safe();labels();return go()}
function go(){if(!championship||championship.finished)return false;if(G.state.phase!=='menu')return false;const track=ROUTE[championship.stage];$('track').value=track;$('track').disabled=true;G.start();return true}
function abandon(){championship=null;try{localStorage.removeItem(KEY)}catch{}$('track').disabled=false;$('champCard').hidden=true;$('champFinish').hidden=true;$('champStart').textContent='🏆 НАЧАТЬ ЧЕМПИОНАТ';$('champAbort').hidden=true}
function finish(rank,rivals){if(!championship||championship.finished||G.state.track!==G.tracks[ROUTE[championship.stage]])return false;
const racers=[{name:'YOU',z:G.state.player.z,t:G.state.time},...rivals.map(o=>({name:o.name,z:o.z,t:o.finished?o.finishTime:Infinity}))].sort((a,b)=>b.z-a.z||a.t-b.t);
for(let i=0;i<racers.length;i++)championship.points[racers[i].name]=(championship.points[racers[i].name]||0)+POINTS[i];
const earned=POINTS[Math.max(0,Math.min(19,rank-1))];championship.results.push({track:ROUTE[championship.stage],rank,points:earned,time:G.state.time});championship.stage++;
if(championship.stage>=ROUTE.length){championship.finished=true;const champion=table()[0],myRank=table().findIndex(r=>r.id==='YOU')+1;const bonus=myRank===1?12000:myRank<=3?7000:myRank<=10?3000:1200;if(!championship.bonusPaid){Garage.credit(bonus);championship.bonusPaid=true}championship.bonus=bonus;championship.finalRank=myRank;}
safe();labels();
$('champFinish').hidden=false;$('champFinish').textContent=championship.finished?'🏆 Чемпионат закончен! Итоговое место: '+championship.finalRank+'/20 · бонус '+championship.bonus.toLocaleString('ru-RU')+' ₽':'🏁 Этап '+championship.stage+'/'+ROUTE.length+' завершён! Очки за место: +'+earned+'. Следующий этап: '+G.tracks[ROUTE[championship.stage]].name;
$('again').textContent=championship.finished?'🏆 К ИТОГАМ':'🔧 В ГАРАЖ / СЛЕДУЮЩИЙ ЭТАП';
$('again').onclick=()=>{ // Return to garage between championship races.
 $('toMenu').click();$('track').disabled=true;showMenu();
};
$('toMenu').onclick=()=>{G.toMenu();$('track').disabled=!!championship&&!championship.finished;showMenu()};
return true}
function setup(){const el=document.createElement('section');el.id='champCard';el.className='champ-card';el.hidden=true;el.innerHTML='<div class="champ-head"><strong>🏆 ТУРБО ЧЕМПИОНАТ</strong><span id="champProgress"></span></div><div class="champ-history" id="champHistory"></div><div class="champ-standings" id="champStanding"></div><p id="champStatus"></p><div class="champ-actions"><button id="champContinue" type="button">▶ СЛЕДУЮЩИЙ ЭТАП</button><button id="champAbort" type="button">Завершить чемпионат</button></div>';
$('menu').querySelector('.menu-card').insertBefore(el,$('garagePanel'));
const box=document.createElement('div');box.id='champFinish';box.className='champ-finish';box.hidden=true;$('finish').querySelector('.finish-card').insertBefore(box,$('results'));
const btn=document.createElement('button');btn.id='champStart';btn.className='primary champ-main-btn';btn.type='button';btn.textContent='🏆 НАЧАТЬ ЧЕМПИОНАТ';$('start').before(btn);
btn.onclick=()=>{if(!championship||championship.finished)startNew();else go()};
$('champContinue').onclick=go;$('champAbort').onclick=()=>{if(!confirm('Завершить чемпионат без награды за общий зачёт?'))return;abandon()};
const regularStart=$('start');regularStart.onclick=()=>{if(championship&&!championship.finished){abandon()}$('track').disabled=false;G.start()};
const originalMenu=G.toMenu;G.toMenu=()=>{originalMenu();$('track').disabled=!!championship&&!championship.finished;labels()};
if(load()){labels();$('track').value=ROUTE[Math.min(championship.stage,3)];$('track').disabled=!championship.finished}
}
setup();window.TurboChampionship={get state(){return championship},start:startNew,go,finish,abandon,table,points:POINTS,route:ROUTE};
})();