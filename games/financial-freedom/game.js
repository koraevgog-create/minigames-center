(()=>{
'use strict';
const D=window.FF_DATA,$=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
const pick=a=>a[Math.floor(Math.random()*a.length)],copy=x=>JSON.parse(JSON.stringify(x));
const KEY='minigames.financial-freedom.v1';
let game=null,active=null,logs=[],cardVersion=0;
function income(){return game.prof.salary+game.assets.reduce((s,a)=>s+a.monthly,0)}
function passive(){return game.assets.reduce((s,a)=>s+a.monthly,0)}
function expenses(){const p=game.prof;return p.tax+p.housing+p.utilities+p.food+p.transport+p.other+p.debtPay+game.bankPay+game.children*p.childCost}
function flow(){return income()-expenses()}
function worth(){return game.cash+game.assets.reduce((s,a)=>s+a.cost-a.loan,0)+Object.entries(game.shares||{}).reduce((v,[ticker,qty])=>v+qty*game.prices[ticker],0)-game.prof.debt-game.bankDebt}
function line(text){logs.unshift(text);logs=logs.slice(0,12);renderLog()}
function renderLog(){const e=$('history');e.replaceChildren();for(const item of logs){const p=document.createElement('div');p.textContent=item;e.appendChild(p)}}
function persist(){if(!game)return;try{localStorage.setItem(KEY,JSON.stringify({game,logs}))}catch(e){}}
function status(msg){$('notice').textContent=msg}
function details(label,value){const row=document.createElement('div');row.className='financial-row';const a=document.createElement('span');a.textContent=label;const b=document.createElement('b');b.textContent=fmt(value);row.append(a,b);return row}
function renderFinances(){
 const stat=$('finances');stat.replaceChildren();
 const base=document.createElement('section');base.className='finance-group';base.innerHTML='<h3>Отчёт о доходах</h3>';
 base.append(details('Зарплата',game.prof.salary),details('Доход от активов',passive()),details('Все доходы',income()),details('Все расходы',expenses()),details('Чистый денежный поток',flow()));
 const spending=document.createElement('section');spending.className='finance-group';spending.innerHTML='<h3>Расходы и обязательства</h3>';
 const p=game.prof;for(const [label,key]of [['Налоги','tax'],['Жильё','housing'],['Коммунальные','utilities'],['Продукты','food'],['Транспорт','transport'],['Прочие','other'],['Платёж по личному долгу','debtPay']])spending.appendChild(details(label,p[key]));
 spending.append(details('Банковский кредит — платёж',game.bankPay),details('Дети: '+game.children,game.children*p.childCost),details('Личный долг — остаток',p.debt),details('Банковский долг — остаток',game.bankDebt));
 const stocks=document.createElement('section');stocks.className='finance-group';stocks.innerHTML='<h3>Акции на бирже</h3>';
 for(const st of D.stocks){const qty=(game.shares||{})[st.ticker]||0;const row=document.createElement('div');row.className='stock-row';const label=document.createElement('span');label.textContent=st.ticker+' · '+st.name+' · '+fmt(game.prices[st.ticker])+' / шт. · '+qty+' шт.';const buttons=document.createElement('div');const buy=document.createElement('button');buy.textContent='Купить';buy.disabled=!!active||game.ended||game.stage!=='rat'||game.cash<game.prices[st.ticker];buy.onclick=()=>trade(st.ticker,1);const sell=document.createElement('button');sell.textContent='Продать';sell.disabled=!!active||game.ended||qty===0;sell.onclick=()=>trade(st.ticker,-1);buttons.append(buy,sell);row.append(label,buttons);stocks.appendChild(row)}
 const assets=document.createElement('section');assets.className='finance-group';assets.innerHTML='<h3>Баланс активов</h3>';
 if(!game.assets.length){const x=document.createElement('p');x.textContent='Активов пока нет. Покупай их на клетках сделок.';assets.appendChild(x)}
 for(const a of game.assets){const row=document.createElement('div');row.className='asset-row';const name=document.createElement('div');name.innerHTML='<strong></strong><small></small>';name.querySelector('strong').textContent=a.name;name.querySelector('small').textContent='+'+fmt(a.monthly)+'/мес. · Долг '+fmt(a.loan);row.appendChild(name);
 const b=document.createElement('button');b.disabled=!!active||game.ended;b.textContent='Продать';b.title='Продать по базовой стоимости и погасить долг по активу';b.onclick=()=>sellAsset(a.id,a.cost);row.appendChild(b);assets.appendChild(row)}
 stat.append(base,spending,stocks,assets);
 $('cash').textContent=fmt(game.cash);$('passive').textContent=fmt(passive());$('expenses').textContent=fmt(expenses());$('cashflow').textContent=fmt(flow());$('networth').textContent=fmt(worth());
 const percent=game.stage==='rat'?Math.min(100,passive()/Math.max(1,expenses())*100):Math.min(100,game.fastIncome/Math.max(1,game.fastGoal)*100);
 $('progressFill').style.width=percent+'%';
 $('progressText').textContent=game.stage==='rat'?'Финансовая свобода: '+Math.round(percent)+'%':'Большая игра: '+fmt(game.fastIncome)+' / '+fmt(game.fastGoal);
 $('stageName').textContent=game.stage==='rat'?'Внутренний круг':'Внешний круг';
 $('professionName').textContent=game.prof.icon+' '+game.prof.name;
 $('turn').textContent=game.turn;
 $('dreamName').textContent=game.dream.icon+' '+game.dream.name+' · '+fmt(game.dream.cost);
 $('roll').disabled=!!active||game.ended;
 $('borrow').disabled=!!active||game.stage==='fast'||game.ended;
 $('payDebt').disabled=!!active||game.bankDebt<=0||game.cash<=0||game.ended;$('payPersonal').disabled=!!active||game.prof.debt<=0||game.cash<=0||game.stage!=='rat'||game.ended;
 $('roll').textContent=game.ended?'Партия завершена':active?'Сначала реши событие':'🎲 Бросить кубик';
}
function renderBoard(){
 const board=$('board');board.replaceChildren();
 const spaces=game.stage==='rat'?D.track:D.fastTrack;
 const title=document.createElement('div');title.className='board-center';title.innerHTML='<div class="board-emblem">✦</div><h2></h2><p></p>';
 title.querySelector('h2').textContent=game.stage==='rat'?'Круг привычных расходов':'Мир больших возможностей';
 title.querySelector('p').textContent=game.stage==='rat'?'Пассивный доход должен превысить расходы':'Достигни своей мечты или цели по доходу';
 board.appendChild(title);
 spaces.forEach((type,i)=>{const el=document.createElement('div');el.className='space s-'+type+(i===game.pos?' current':'');const mapping={start:['◆','Старт'],small:['◈','Малая сделка'],big:['▣','Крупная сделка'],expense:['!','Расход'],market:['↗','Рынок'],payday:['₽','Зарплата'],child:['♥','Семья'],charity:['✦','Доброе дело'],jobloss:['⌛','Безработица'],deal:['⬡','Инвестиции'],dream:['★','Мечта'],income:['₽','Доход']};const [symbol,label]=mapping[type]||mapping.start;el.innerHTML='<span></span><small></small>';el.querySelector('span').textContent=symbol;el.querySelector('small').textContent=label;if(i===game.pos){const pin=document.createElement('b');pin.className='piece';pin.textContent='●';el.appendChild(pin)}el.title=(i+1)+': '+label;board.appendChild(el)});
}
function render(){if(!game)return;renderBoard();renderFinances();renderLog();persist()}
function clearEvent(){active=null;$('event').replaceChildren();$('event').hidden=true}
function offer(title,description,buttons){active={title};const el=$('event');el.replaceChildren();el.hidden=false;
 const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=description;const actions=document.createElement('div');actions.className='event-actions';
 for(const item of buttons){const b=document.createElement('button');b.textContent=item.label;b.disabled=!!item.disabled;b.onclick=()=>{item.action()};actions.appendChild(b)}el.append(h,p,actions);renderFinances()}
function done(message){clearEvent();if(message){line(message);status(message)}if(!game.ended&&game.stage==='rat'&&passive()>expenses()){game.stage='fast';game.pos=0;game.fastIncome=Math.max(10000,passive()*100);game.fastGoal=game.fastIncome+50000;status('🎉 Финансовая свобода! Ты переходишь на внешний круг.');line('Открыт внешний круг! Начальный доход: '+fmt(game.fastIncome));offer('Финансовая свобода','Ты вышел из круга обязательных расходов. Теперь твоя цель — приобрести мечту или увеличить доход внешнего круга.',[{label:'Продолжить',action:()=>{clearEvent();render()}}])}render()}
function takeCharge(amount){if(game.cash<amount){const gap=amount-game.cash;game.bankDebt+=gap;game.bankPay+=Math.ceil(gap*.1);game.cash+=gap;line('Автоматический кредит для обязательного платежа: '+fmt(gap))}game.cash-=amount}
function trade(ticker,direction){if(!game||active||game.ended||game.stage!=='rat')return;const price=game.prices[ticker],qty=game.shares[ticker]||0;if(direction>0&&game.cash<price)return;if(direction<0&&qty<=0)return;game.cash-=direction*price;game.shares[ticker]=qty+direction;done((direction>0?'Куплена':'Продана')+' акция '+ticker+' по '+fmt(price));}
function marketUpdate(){for(const st of D.stocks){const old=game.prices[st.ticker];const move=1+(Math.random()*2-1)*st.volatility;game.prices[st.ticker]=Math.max(1,Math.round(old*move))}line('Биржа обновила котировки пяти компаний.')}
function checkBankruptcy(){if(game.stage!=='rat'||game.ended)return false;game.insolvency=game.cash===0&&flow()<0?game.insolvency+1:0;if(game.insolvency>=3){game.ended=true;clearEvent();offer('⚠️ Банкротство','Три платёжных цикла подряд без денег при отрицательном денежном потоке. Партия завершена.',[{label:'Новая партия',action:()=>{$('setup').hidden=false;$('game').hidden=true;game=null;clearEvent();localStorage.removeItem(KEY)}}]);line('Банкротство. Партия завершена.');render();return true}return false}
function handleDeal(kind){const item=copy(pick(kind==='small'?D.small:D.big));const hint='Стоимость '+fmt(item.cost)+'. Первый взнос '+fmt(item.down)+'. Кредит по активу '+fmt(item.cost-item.down)+'. Пассивный доход +'+fmt(item.monthly)+'/мес.';
 offer((kind==='small'?'◈ Небольшая сделка: ':'▣ Крупная сделка: ')+item.name,hint,[
 {label:'Купить · '+fmt(item.down),disabled:game.cash<item.down,action:()=>{game.cash-=item.down;game.assets.push({...item,id:++cardVersion,loan:item.cost-item.down});done('Куплено: '+item.name+'; денежный поток +'+fmt(item.monthly)+'/мес.')}},
 {label:'Отказаться',action:()=>done('Предложение пропущено: '+item.name)}])}
function sellAsset(id,price){if(active||game.ended)return;const index=game.assets.findIndex(a=>a.id===id);if(index<0)return;const a=game.assets[index];game.cash+=price-a.loan;game.assets.splice(index,1);done('Продано: '+a.name+' за '+fmt(price)+', погашен долг '+fmt(a.loan))}
function handleMarket(){marketUpdate();const market=pick(D.markets);const matched=game.assets.filter(a=>market.category==='all'||a.category===market.category);const buttons=matched.map(a=>({label:'Продать «'+a.name+'» за '+fmt(a.cost*market.multiplier),action:()=>{clearEvent();sellAsset(a.id,Math.round(a.cost*market.multiplier))}}));buttons.push({label:'Пропустить',action:()=>done('Рынок: '+market.name)});offer('📈 '+market.name,market.detail+(matched.length?' Доступна продажа имеющихся активов.':' Подходящих активов пока нет.'),buttons)}
function handleExpense(){const e=pick(D.expenses);offer(e.icon+' '+e.name,'Обязательный непредвиденный расход: '+fmt(e.amount)+'. При нехватке денег возникает банковский кредит.',[{label:'Оплатить · '+fmt(e.amount),action:()=>{takeCharge(e.amount);done('Расход: '+e.name+' — '+fmt(e.amount))}}])}
function handleChild(){if(game.children>=3){done('Семейное событие: дополнительные расходы не изменились.');return}
offer('♥ Пополнение в семье','Новый ребёнок увеличит ежемесячные расходы на '+fmt(game.prof.childCost)+'.', [{label:'Продолжить',action:()=>{game.children++;done('В семье пополнение. Дети: '+game.children)}}])}
function handleCharity(){const amount=Math.ceil(income()*.1);offer('✦ Доброе дело','Добровольное пожертвование '+fmt(amount)+' даст выбор между одним или двумя кубиками в следующих трёх ходах.', [{label:'Пожертвовать · '+fmt(amount),disabled:game.cash<amount,action:()=>{game.cash-=amount;game.bonusRolls=3;done('Пожертвование принято. На три хода открыт выбор двух кубиков.')}},{label:'Пропустить',action:()=>done('Благотворительная акция пропущена.')}])}
function handleJobLoss(){const cost=Math.max(0,expenses());offer('⌛ Временная потеря работы','Два месяца без зарплаты. Нужно покрыть обязательные расходы: '+fmt(cost*2)+'.', [{label:'Оплатить расходы · '+fmt(cost*2),action:()=>{takeCharge(cost*2);game.bonusRolls=0;done('Потеря работы: оплачены два месяца расходов.')}}])}
function handleFast(type){
 if(type==='income'||type==='start'){game.cash+=game.fastIncome;done('Доход внешнего круга: +'+fmt(game.fastIncome));return}
 if(type==='dream'){offer('★ '+game.dream.name,'Твоя выбранная мечта стоит '+fmt(game.dream.cost)+'. Денег: '+fmt(game.cash)+'.', [{label:'Осуществить мечту',disabled:game.cash<game.dream.cost,action:()=>{game.cash-=game.dream.cost;win('Мечта осуществлена: '+game.dream.name)}},{label:'Идти дальше',action:()=>done('Ты пока не приобрёл свою мечту.')}]);return}
 if(type==='market'){const bonus=Math.round(game.fastIncome*.45);offer('↗ Удачный сезон','Прибыль от инвестиций: +'+fmt(bonus)+'.',[{label:'Получить прибыль',action:()=>{game.cash+=bonus;done('Удачный сезон: +'+fmt(bonus))}}]);return}
 const asset=pick(D.fast);
 offer('⬡ '+asset.name,'Крупный инвестиционный проект. Цена '+fmt(asset.cost)+'. Дополнительный доход +'+fmt(asset.income)+' за платёжный цикл.', [
 {label:'Инвестировать · '+fmt(asset.cost),disabled:game.cash<asset.cost,action:()=>{game.cash-=asset.cost;game.fastIncome+=asset.income;if(game.fastIncome>=game.fastGoal){win('Доход внешнего круга достиг цели!')}else done('Новая инвестиция: '+asset.name+'; доход +'+fmt(asset.income))}},
 {label:'Отказаться',action:()=>done('Крупная инвестиция пропущена.')}])}
function win(message){game.ended=true;clearEvent();offer('🏆 Финансовая победа!',message,[{label:'Новая партия',action:()=>{$('setup').hidden=false;$('game').hidden=true;clearEvent();game=null;persist()}}]);line(message);render()}
function step(){
 if(!game||active||game.ended)return;
 let roll=1+Math.floor(Math.random()*6);
 if(game.stage==='fast')roll+=1+Math.floor(Math.random()*6);
 if(game.stage==='rat'&&game.bonusRolls>0){roll+=1+Math.floor(Math.random()*6);game.bonusRolls--}
 const spaces=game.stage==='rat'?D.track:D.fastTrack;
 const old=game.pos;game.pos=(game.pos+roll)%spaces.length;game.turn++;
 const raw=game.pos<old||roll>=spaces.length;
 if(game.stage==='rat'){for(let j=1;j<=roll;j++){const pos=(old+j)%spaces.length;if(spaces[pos]==='payday'){const amount=flow();game.cash+=amount;line('Зарплатный день: '+(amount>=0?'+':'')+fmt(amount));if(game.cash<0){game.bankDebt+=-game.cash;game.bankPay+=Math.ceil(-game.cash*.1);game.cash=0;line('Автоматический кредит для покрытия дефицита')}if(checkBankruptcy())return}}}
 $('dice').textContent='🎲 '+roll;
 line('Ход '+game.turn+': выпало '+roll+' · '+(game.stage==='rat'?'внутренний':'внешний')+' круг');
 if(game.stage==='fast'){handleFast(spaces[game.pos]);render();return}
 const type=spaces[game.pos];
 if(type==='small'||type==='big')handleDeal(type);
 else if(type==='market')handleMarket();
 else if(type==='expense')handleExpense();
 else if(type==='child')handleChild();
 else if(type==='charity')handleCharity();
 else if(type==='jobloss')handleJobLoss();
 else done(type==='payday'?'Зарплатный день!':'Переход по игровому полю.');
 render();
}
function start(){
 const p=D.professions.find(x=>x.id===$('profession').value)||D.professions[0],dream=D.dreams.find(x=>x.id===$('dream').value)||D.dreams[0];
 game={prof:copy(p),dream:copy(dream),stage:'rat',pos:0,turn:0,cash:p.cash,assets:[],shares:{},prices:Object.fromEntries(D.stocks.map(st=>[st.ticker,st.price])),insolvency:0,children:0,bankDebt:0,bankPay:0,bonusRolls:0,fastIncome:0,fastGoal:0,ended:false};
 logs=[];cardVersion=0;clearEvent();$('setup').hidden=true;$('game').hidden=false;$('dice').textContent='🎲 —';status('Начинай ход. Твоя цель — пассивный доход выше расходов.');line('Новая партия: '+p.name+'. Мечта: '+dream.name);render();
}
function setup(){
 for(const p of D.professions){const o=document.createElement('option');o.value=p.id;o.textContent=p.icon+' '+p.name;$('profession').appendChild(o)}
 for(const dream of D.dreams){const o=document.createElement('option');o.value=dream.id;o.textContent=dream.icon+' '+dream.name;$('dream').appendChild(o)}
 $('startGame').onclick=start;$('roll').onclick=step;
 $('borrow').onclick=()=>{if(!game||active||game.stage==='fast')return;const amount=5000;game.cash+=amount;game.bankDebt+=amount;game.bankPay+=500;line('Банковский кредит: +'+fmt(amount)+'; платёж +500 ₽/мес.');status('Кредит получен');render()};
 $('payDebt').onclick=()=>{if(!game||active||!game.bankDebt)return;const value=Math.min(5000,game.cash,game.bankDebt);if(value<=0)return;const before=game.bankDebt;game.bankDebt-=value;game.cash-=value;game.bankPay=Math.round(game.bankPay*game.bankDebt/before);done('Погашен банковский долг: '+fmt(value))};
 $('payPersonal').onclick=()=>{if(!game||active||game.stage!=='rat'||game.ended||game.prof.debt<=0)return;const sum=Math.min(game.prof.debt,game.cash,1000);if(sum<=0)return;const old=game.prof.debt;game.prof.debt-=sum;game.prof.debtPay=Math.round(game.prof.debtPay*game.prof.debt/old);game.cash-=sum;done('Погашено личного долга: '+fmt(sum))};
 $('resetGame').onclick=()=>{if(!confirm('Завершить текущую партию и начать заново?'))return;game=null;active=null;logs=[];localStorage.removeItem(KEY);$('game').hidden=true;$('setup').hidden=false};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.game?.prof&&saved.game.dream&&Array.isArray(saved.game.assets)){game=saved.game;game.shares=game.shares||{};game.prices=game.prices||Object.fromEntries(D.stocks.map(st=>[st.ticker,st.price]));game.insolvency=game.insolvency||0;logs=saved.logs||[];cardVersion=Math.max(0,...game.assets.map(a=>a.id||0));$('setup').hidden=true;$('game').hidden=false;status('Сохранённая партия восстановлена.');render()}}catch(e){}
}
document.addEventListener('DOMContentLoaded',setup);
})();