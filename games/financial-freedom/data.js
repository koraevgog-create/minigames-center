// Original financial simulation content, inspired by the genre of investment board games.
window.FF_DATA={
 professions:[
 {id:'teacher',name:'Учитель',icon:'📚',salary:3200,tax:450,housing:850,utilities:330,food:410,transport:240,other:260,childCost:270,cash:3400,debt:2800,debtPay:100},
 {id:'engineer',name:'Инженер',icon:'⚙️',salary:5600,tax:1120,housing:1450,utilities:390,food:580,transport:420,other:340,childCost:350,cash:6500,debt:4900,debtPay:210},
 {id:'doctor',name:'Врач',icon:'🩺',salary:9500,tax:2350,housing:2350,utilities:620,food:850,transport:700,other:570,childCost:500,cash:9000,debt:14500,debtPay:510},
 {id:'designer',name:'Дизайнер',icon:'🎨',salary:4200,tax:750,housing:1150,utilities:360,food:480,transport:300,other:310,childCost:300,cash:4700,debt:3800,debtPay:145},
 {id:'manager',name:'Менеджер',icon:'💼',salary:6800,tax:1390,housing:1750,utilities:470,food:670,transport:540,other:400,childCost:400,cash:6800,debt:8600,debtPay:295},
 {id:'nurse',name:'Медсестра',icon:'💚',salary:3600,tax:580,housing:940,utilities:330,food:450,transport:270,other:280,childCost:280,cash:4100,debt:3100,debtPay:120}
 ],
 dreams:[
 {id:'island',name:'Дом у моря',cost:180000,icon:'🏝️'},
 {id:'foundation',name:'Благотворительный фонд',cost:220000,icon:'🤝'},
 {id:'world',name:'Кругосветное путешествие',cost:145000,icon:'🌍'},
 {id:'studio',name:'Собственная творческая студия',cost:170000,icon:'🏛️'}
 ],
 small:[
 {name:'Гараж в аренду',category:'property',cost:10500,down:3500,monthly:135},
 {name:'Автомат с напитками',category:'business',cost:7200,down:2700,monthly:115},
 {name:'Кладовая в жилом доме',category:'property',cost:13500,down:4500,monthly:170},
 {name:'Портфель дивидендных акций',category:'stock',cost:3000,down:3000,monthly:45},
 {name:'Небольшой интернет-магазин',category:'business',cost:14800,down:5800,monthly:235},
 {name:'Парковочное место',category:'property',cost:9700,down:3700,monthly:125},
 {name:'Доля в кофейне',category:'business',cost:16500,down:6500,monthly:265},
 {name:'Облигационный портфель',category:'stock',cost:5200,down:5200,monthly:70},
 {name:'Микростудия в аренду',category:'property',cost:22400,down:8400,monthly:340},
 {name:'Фотобудка в торговом центре',category:'business',cost:9200,down:3200,monthly:140}
 ],
 big:[
 {name:'Комплекс из шести апартаментов',category:'property',cost:112000,down:28000,monthly:1600},
 {name:'Действующая пекарня',category:'business',cost:68000,down:21000,monthly:1080},
 {name:'Мини-склад для арендаторов',category:'property',cost:92000,down:24500,monthly:1450},
 {name:'Автомойка самообслуживания',category:'business',cost:155000,down:44000,monthly:2450},
 {name:'Небольшой офисный центр',category:'property',cost:184000,down:52000,monthly:2780},
 {name:'Сеть вендинговых точек',category:'business',cost:78000,down:20000,monthly:1260},
 {name:'Арендный дом',category:'property',cost:136000,down:39000,monthly:2030}
 ],
 stocks:[
 {ticker:'NOVA',name:'Нова Энергия',price:25,dividend:0,volatility:.28},
 {ticker:'GRAD',name:'Град Девелопмент',price:45,dividend:1,volatility:.22},
 {ticker:'VITA',name:'Вита Медиа',price:18,dividend:0,volatility:.42},
 {ticker:'SEVER',name:'Северный Холдинг',price:60,dividend:2,volatility:.18},
 {ticker:'FLOW',name:'Флоу Технологии',price:35,dividend:0,volatility:.37}
 ],
 expenses:[
 {name:'Ремонт бытовой техники',amount:600,icon:'🔧'},
 {name:'Семейный праздник',amount:900,icon:'🎈'},
 {name:'Поломка автомобиля',amount:1450,icon:'🚗'},
 {name:'Покупка нового телефона',amount:1150,icon:'📱'},
 {name:'Незапланированный ремонт',amount:1800,icon:'🏠'},
 {name:'Поездка на выходные',amount:750,icon:'🧳'},
 {name:'Срочные бытовые расходы',amount:420,icon:'🧾'},
 {name:'Замена мебели',amount:1400,icon:'🛋️'}
 ],
 markets:[
 {name:'Покупатели ищут недвижимость',category:'property',multiplier:1.28,detail:'На рынке спрос на объекты недвижимости.'},
 {name:'Рынок малого бизнеса растёт',category:'business',multiplier:1.38,detail:'Инвесторы активно покупают работающие предприятия.'},
 {name:'Спрос на финансовые инструменты',category:'stock',multiplier:1.55,detail:'Цена инвестиционных портфелей поднялась.'},
 {name:'Сложный год для аренды',category:'property',multiplier:.88,detail:'Цены на недвижимость временно снизились.'},
 {name:'Рынок бизнеса замедлился',category:'business',multiplier:.86,detail:'Продать предприятие можно, но дешевле обычного.'},
 {name:'Покупатели активизировались',category:'all',multiplier:1.15,detail:'На все активы появился дополнительный спрос.'}
 ],
 fast:[
 {name:'Жилой квартал',cost:210000,income:14000,type:'deal'},
 {name:'Логистическая компания',cost:275000,income:18000,type:'deal'},
 {name:'Сеть семейных кафе',cost:165000,income:11000,type:'deal'},
 {name:'Портфель коммерческой недвижимости',cost:380000,income:25000,type:'deal'},
 {name:'Технологическая компания',cost:440000,income:31000,type:'deal'},
 {name:'Франшизная сеть',cost:300000,income:21000,type:'deal'}
 ],
 track:['start','small','expense','market','payday','big','small','child','small','charity','payday','expense','big','market','small','jobloss','payday','small','market','expense','big','child','small','payday'],
 fastTrack:['start','deal','dream','income','deal','market','dream','deal','income','dream','deal','income','deal','market','dream','income','deal','dream','market','deal','income','dream','deal','income']
};