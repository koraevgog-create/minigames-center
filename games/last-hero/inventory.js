// v0.3.2 — inventory, equipment and loot
window.RPGInventory={
 items:[],gold:0,
 weapon:{name:'Ржавый меч',slot:'weapon',damage:0,rarity:'⚪ Обычный'},
 armor:{name:'Без доспеха',slot:'armor',armor:0,rarity:'⚪ Обычный'},
 onChange:null,
 reset(){this.items=[];this.gold=0;this.weapon={name:'Ржавый меч',slot:'weapon',damage:0,rarity:'⚪ Обычный'};this.armor={name:'Без доспеха',slot:'armor',armor:0,rarity:'⚪ Обычный'};this.render()},
 bonus(){let b={damage:0,armor:0,hp:0,crit:0,fire:0};for(const item of [this.weapon,this.armor])for(const k of Object.keys(b))b[k]+=Number(item[k]||0);return b},
 addGold(n){this.gold+=n;this.render()},
 add(item){this.items.push({...item});this.render()},
 equip(index){const item=this.items[index];if(!item)return;const slot=item.slot;if(slot!=='weapon'&&slot!=='armor')return;const old=this[slot];this[slot]=item;this.items.splice(index,1);if(old&&old.name!==(slot==='weapon'?'Ржавый меч':'Без доспеха'))this.items.push(old);this.render();if(this.onChange)this.onChange()},
 render(){const el=document.getElementById('inventory');if(!el)return;el.replaceChildren();const title=document.createElement('strong');title.textContent='🎒 Снаряжение и добыча';el.appendChild(title);const line=document.createElement('div');line.className='inventory-line';line.textContent='💰 Золото: '+this.gold+'   |   ⚔️ '+this.weapon.name+'   |   🛡️ '+this.armor.name;el.appendChild(line);const b=this.bonus(),bonus=document.createElement('div');bonus.className='inventory-line';bonus.textContent='Бонусы: ⚔️ +'+b.damage+'  🛡️ +'+b.armor+'  ❤️ +'+b.hp+'  🎯 +'+b.crit+'%  🔥 +'+b.fire;el.appendChild(bonus);if(!this.items.length){const p=document.createElement('div');p.className='inventory-line';p.textContent='Пока нет находок. Собирай светящиеся трофеи на поле.';el.appendChild(p)}this.items.forEach((item,i)=>{const line=document.createElement('div');line.className='inventory-item';const desc=document.createElement('span');desc.textContent=(item.slot==='armor'?'🛡️ ':'⚔️ ')+item.name+' · '+item.rarity+' · '+Object.entries(item).filter(([k,v])=>['damage','armor','hp','crit','fire'].includes(k)&&v).map(([k,v])=>k+' +'+v).join(', ');const b=document.createElement('button');b.textContent='Надеть';b.type='button';b.onclick=()=>this.equip(i);line.append(desc,b);el.appendChild(line)})}
};