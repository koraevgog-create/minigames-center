window.RPGItems={
 weapons:[
 {name:'Меч стража',damage:15,rarity:'🔵 Редкий'},
 {name:'Пылающий клинок',damage:25,fire:7,rarity:'🟣 Эпический'},
 {name:'Топор вождя орков',damage:35,health:20,rarity:'🟠 Легендарный'}
],
 randomWeapon(){return this.weapons[Math.floor(Math.random()*this.weapons.length)]}
};
