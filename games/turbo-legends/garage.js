/* Turbo Legends 0.6 — persistent garage, vehicles and tuning (no server required). */
(()=>{'use strict';
const G=window.TurboLegends;if(!G)return;
const KEY='turbo-legends-garage-v1',VERSION=1;
const CARS=[
{id:'pulse',name:'Pulse GT',class:'Городское купе',price:0,color:'#ef424e',top:300,acc:1,handling:1,nitro:1},
{id:'vortex',name:'Vortex R',class:'Спортивное купе',price:4200,color:'#23b5cf',top:320,acc:1.08,handling:1.06,nitro:1},
{id:'phantom',name:'Phantom S',class:'Трековый спорткар',price:9800,color:'#9e8df4',top:342,acc:1.14,handling:1.17,nitro:1.08},
{id:'inferno',name:'Inferno X',class:'Суперкар',price:17500,color:'#ff974a',top:365,acc:1.2,handling:1.08,nitro:1.18},
{id:'aurora',name:'Aurora Z',class:'Гиперкар',price:28000,color:'#8ee6a5',top:385,acc:1.3,handling:1.23,nitro:1.23}
];
const UPGRADES=[
{id:'engine',name:'Двигатель',icon:'⚙️',description:'Разгон и максимальная скорость',base:750,growth:1.85},
{id:'gearbox',name:'Коробка передач',icon:'🔩',description:'Разгон на высоких скоростях',base:650,growth:1.8},
{id:'tires',name:'Шины',icon:'🛞',description:'Сцепление, повороты, меньше скольжения',base:580,growth:1.75},
{id:'nitro',name:'Нитро',icon:'⚡',description:'Сильнее ускорение и больше запас',base:850,growth:1.9}
];
const $=id=>document.getElementById(id);
const defaults=()=>({version:VERSION,money:1500,car:'pulse',owned:['pulse'],tuning:{pulse:{engine:0,gearbox:0,tires:0,nitro:0}},races:0,earned:0,wins:0});
let profile=defaults();
function load(){try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(!stored||stored.version!==VERSION)return;profile={...defaults(),...stored};profile.money=Math.max(0,Math.min(1e9,Math.floor(Number(profile.money)||0)));profile.owned=Array.isArray(profile.owned)?profile.owned.filter(v=>CARS.some(c=>c.id===v)):['pulse'];if(!profile.owned.includes('pulse'))profile.owned.unshift('pulse');if(!profile.owned.includes(profile.car))profile.car='pulse';if(typeof profile.tuning!=='object'||!profile.tuning)profile.tuning={};for(const id of profile.owned){const old=profile.tuning[id]||{};profile.tuning[id]=Object.fromEntries(UPGRADES.map(u=>[u.id,Math.max(0,Math.min(5,Math.floor(Number(old[u.id])||0)))]))}}catch{profile=defaults()}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(profile));return true}catch{return false}}
function currentCar(){return CARS.find(c=>c.id===profile.car)||CARS[0]}
function upgrades(){return profile.tuning[profile.car]||{engine:0,gearbox:0,tires:0,nitro:0}}
function stats(){const car=currentCar(),t=upgrades();return{car:car.name,maxSpeed:car.top+t.engine*10+t.gearbox*4,acceleration:car.acc*(1+t.engine*.095+t.gearbox*.065),handling:car.handling*(1+t.tires*.09),nitroCapacity:100+t.nitro*12,nitroBoost:car.nitro*(1+t.nitro*.14),nitroEfficiency:1+t.nitro*.12}}
function price(u,level){return Math.round(u.base*Math.pow(u.growth,level)/50)*50}
function selectCar(id){if(G.state.phase!=='menu')return false;const car=CARS.find(x=>x.id===id);if(!car)return false;
if(profile.owned.includes(id)){profile.car=id;$('carColor').value=car.color;save();render();return true}
if(profile.money<car.price){notify('Недостаточно призовых денег');return false}
profile.money-=car.price;profile.owned.push(id);profile.tuning[id]={engine:0,gearbox:0,tires:0,nitro:0};profile.car=id;$('carColor').value=car.color;save();render();notify('Автомобиль куплен: '+car.name);return true}
function tune(type){if(G.state.phase!=='menu')return false;const u=UPGRADES.find(x=>x.id===type);if(!u)return false;const t=upgrades(),level=t[type]||0;if(level>=5){notify('Уже достигнут максимальный уровень');return false}const cost=price(u,level);if(profile.money<cost){notify('Недостаточно денег для улучшения');return false}profile.money-=cost;t[type]=level+1;save();render();notify('Улучшение установлено: '+u.name+' '+(level+1)+'/5');return true}
function notify(message){const el=$('garageNotice');if(!el)return;el.textContent=message;el.classList.add('visible');}
function displayMoney(n){return Math.round(n).toLocaleString('ru-RU')+' ₽'}
function render(){
const money=$('garageMoney');if(!money)return;money.textContent=displayMoney(profile.money);
const t=upgrades(),st=stats();$('garageActive').textContent=st.car;
$('garageStats').textContent='Макс. '+Math.round(st.maxSpeed)+' км/ч · Разгон '+Math.round(st.acceleration*100)+'% · Управление '+Math.round(st.handling*100)+'%';
const cars=$('garageCars');cars.replaceChildren();for(const car of CARS){const owned=profile.owned.includes(car.id),selected=profile.car===car.id;const btn=document.createElement('button');btn.type='button';btn.className='garage-car'+(selected?' selected':'');btn.disabled=selected;btn.innerHTML='<span class="car-swatch"></span><strong></strong><small></small><b></b>';btn.querySelector('.car-swatch').style.background=car.color;btn.querySelector('strong').textContent=car.name;btn.querySelector('small').textContent=car.class;btn.querySelector('b').textContent=selected?'✓ ВЫБРАН':owned?'ВЫБРАТЬ':displayMoney(car.price);btn.onclick=()=>selectCar(car.id);cars.appendChild(btn)}
const tunes=$('garageUpgrades');tunes.replaceChildren();for(const u of UPGRADES){const level=t[u.id]||0,full=level===5,cost=price(u,level);const btn=document.createElement('button');btn.type='button';btn.className='garage-upgrade';btn.disabled=full||profile.money<cost;btn.innerHTML='<strong></strong><small></small><span class="garage-level"></span><b></b>';btn.querySelector('strong').textContent=u.icon+' '+u.name;btn.querySelector('small').textContent=u.description;btn.querySelector('.garage-level').textContent='●'.repeat(level)+'○'.repeat(5-level);btn.querySelector('b').textContent=full?'МАКСИМУМ':displayMoney(cost);btn.onclick=()=>tune(u.id);tunes.appendChild(btn)}
$('garageCareer').textContent='Заездов: '+profile.races+' · Побед: '+profile.wins+' · Заработано: '+displayMoney(profile.earned);
}
function reward(position){const rank=Math.max(1,Math.min(20,Math.floor(position)));return Math.max(150,Math.round((2100-(rank-1)*100)/50)*50)}
function credit(amount){const n=Math.max(0,Math.floor(Number(amount)||0));profile.money+=n;profile.earned+=n;save();render();return n}
function finish(rank){const amount=reward(rank);profile.money+=amount;profile.earned+=amount;profile.races++;if(rank===1)profile.wins++;save();const el=$('garageReward');if(el){el.textContent='🏆 Призовые: +'+displayMoney(amount)+' · Баланс: '+displayMoney(profile.money);el.hidden=false}render();return amount}
function setup(){const panel=document.createElement('section');panel.id='garagePanel';panel.className='garage-panel';panel.innerHTML='<div class="garage-header"><strong>🔧 ГАРАЖ И ТЮНИНГ</strong><span>Баланс: <b id="garageMoney">0 ₽</b></span></div><div class="garage-current">Твоя машина: <b id="garageActive"></b><div id="garageStats"></div></div><div class="garage-label">АВТОМОБИЛИ</div><div id="garageCars" class="garage-cars"></div><div class="garage-label">УЛУЧШЕНИЯ ДЛЯ ВЫБРАННОГО АВТО</div><div id="garageUpgrades" class="garage-upgrades"></div><div id="garageCareer" class="garage-career"></div><p id="garageNotice" class="garage-notice" role="status"></p>';const menu=document.querySelector('.menu-card');const anchor=menu.querySelector('.race-options');menu.insertBefore(panel,anchor);
const rewardEl=document.createElement('div');rewardEl.id='garageReward';rewardEl.className='garage-reward';rewardEl.hidden=true;document.querySelector('.finish-card').insertBefore(rewardEl,$('results'));
$('carColor').value=currentCar().color;render()}
load();setup();
window.TurboGarage={profile,stats,finish,credit,tune,selectCar,reward,render,cars:CARS,upgrades:UPGRADES};
})();