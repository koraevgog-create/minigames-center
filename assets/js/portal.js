
const list=[
['Королевство с нуля','Строй деревни, добывай ресурсы, управляй армией и завоёвывай земли.','👑','Стратегия','#476e4a',1,'games/kingdom/'],
['Последний герой','Уничтожай волны монстров, развивай способности и побеждай боссов.','⚔️','Экшен / RPG','#754f50',1,'games/last-hero/'],
['Легенды семи королевств','Пошаговые битвы с разными отрядами, героями и магией.','🛡️','Пошаговая стратегия','#59618b'],
['Осада крепости','Командуй защитниками замка и отражай штурмы вражеских армий.','🏰','Оборона','#8e6c44'],
['Подземелья проклятых','Ищи сокровища, побеждай чудовищ и исследуй тайные залы.','💀','Подземелья','#624980'],
['Война империй','Собирай ресурсы, строй поселения и отправляй войска в бой.','🌍','Стратегия','#4a7774'],
['Бизнес-империя','Начни с магазина и построй сеть предприятий.','💰','Экономика','#797240'],
['Последнее убежище','Строй безопасную базу и переживай нападения зомби.','🧟','Выживание','#5e774c'],
['Колонизатор галактики','Исследуй новые планеты, строй базы и собирай флот.','🚀','Космос','#4a6192'],
['Железнодорожный магнат','Соединяй города железными дорогами и зарабатывай на перевозках.','🚂','Магнат','#8d6248'],
['Уличные гонки','Побеждай соперников и улучшай свои автомобили.','🏎️','Гонки','#925253'],
['Ферма мечты','Выращивай урожай, ухаживай за животными и развивай хозяйство.','🌾','Ферма','#708847']
];
let filter='all';
function render(){let word=document.getElementById('search').value.trim().toLowerCase(),items=list.map((v,i)=>({v,i})).filter(({v})=>(filter==='all'||(filter==='ready'?v[5]:!v[5]))&&(!word||(v[0]+' '+v[1]+' '+v[3]).toLowerCase().includes(word)));const root=document.getElementById('games');root.replaceChildren();document.getElementById('empty').hidden=!!items.length;for(let {v,i} of items){let card=document.createElement('article');card.className='game';card.innerHTML='<div class="art" style="--glow:'+v[4]+'"><em>'+v[2]+'</em><span class="status '+(v[5]?'live':'')+'">'+(v[5]?'Играть сейчас':'Скоро')+'</span></div><div class="body"><div class="num">ИГРА №'+String(i+1).padStart(2,'0')+'</div><h3>'+v[0]+'</h3><p>'+v[1]+'</p><div class="bottom"><span class="genre">'+v[3]+'</span>'+(v[5]?'<a class="play" href="'+v[6]+'">Играть →</a>':'<span class="play disabled">Скоро</span>')+'</div></div>';root.appendChild(card)}}
document.getElementById('search').addEventListener('input',render);document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render()}));render();
