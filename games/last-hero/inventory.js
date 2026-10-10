window.RPGInventory={
 weapon:{name:'Ржавый меч',damage:0},
 armor:{name:'Нет брони',defense:0},
 items:[],
 equipWeapon(item){this.weapon=item;this.render()},
 add(item){this.items.push(item);this.render()},
 render(){const el=document.getElementById('inventory');if(!el)return;el.innerHTML='<b>🎒 Инвентарь</b><br>⚔️ '+this.weapon.name+' (+'+this.weapon.damage+' урон)<br>🛡️ '+this.armor.name+(this.items.length?'<br>Найдено: '+this.items.length:'')}
};
