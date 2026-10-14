(()=>{'use strict';
const KEY='minigames.ff.tutorial.seen';
const steps=[
{title:'01 / Финансовый отчёт',text:'Справа показаны зарплата, обязательные расходы, имущество и долги. Разница между доходами и расходами — твой денежный поток. Следи, чтобы он рос.',focus:'.finance'},
{title:'02 / Кубик и события',text:'Нажимай «Бросить кубик». Фишка двигается по клеткам; при остановке открывается событие или предложение. Перед следующим ходом нужно принять решение.',focus:'.board'},
{title:'03 / Покупай активы',text:'Оценивай первоначальный взнос, долг и ежемесячный доход каждой сделки. Главная цель первого круга — пассивный доход больше обязательных расходов.',focus:'.progress'},
{title:'04 / Биржа и кредиты',text:'В финансовом отчёте можно покупать акции и получать дивиденды. Банковские и личные долги увеличивают расходы — их можно погашать.',focus:'.finance'},
{title:'05 / Внешний круг',text:'После достижения финансовой свободы откроется второй круг. Инвестируй в крупные проекты и осуществи выбранную мечту либо достигни цели по доходу.',focus:'.dream'}
];
let index=0;
function show(i){index=i;const root=document.getElementById('guide');if(!root.open)root.showModal();root.querySelector('#guideStep').textContent=steps[i].title;root.querySelector('#guideText').textContent=steps[i].text;root.querySelector('#guideCount').textContent=(i+1)+' / '+steps.length;root.querySelector('#guidePrev').disabled=i===0;root.querySelector('#guideNext').textContent=i===steps.length-1?'Начать играть':'Далее →'}
function close(){const dlg=document.getElementById('guide');if(dlg.open)dlg.close();try{localStorage.setItem(KEY,'1')}catch(e){}}
document.addEventListener('DOMContentLoaded',()=>{
document.getElementById('guideOpen').addEventListener('click',()=>show(0));
document.getElementById('guideClose').addEventListener('click',close);
document.getElementById('guidePrev').addEventListener('click',()=>show(Math.max(0,index-1)));
document.getElementById('guideNext').addEventListener('click',()=>index===steps.length-1?close():show(index+1));
document.getElementById('guide').addEventListener('click',e=>{if(e.target.id==='guide')close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('guide').open)close()});
document.getElementById('startGame').addEventListener('click',()=>{try{if(!localStorage.getItem(KEY))show(0)}catch(e){show(0)}});
});
})();