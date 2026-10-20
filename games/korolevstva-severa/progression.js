/* 0.7 - Research, armored units, campaign pacing. No external assets. */
(()=>{'use strict';const R=window.RTS;
R.techs={
steel:{name:'Стальные клинки',icon:'⚔',cost:[240,160],description:'+25% урона воинов и стражей',apply(){R.upgrades.steel=true}},
armor:{name:'Кованая броня',icon:'🛡',cost:[220,180],description:'−20% входящего урона по войскам',apply(){R.upgrades.armor=true}},
fletching:{name:'Дальнобойные луки',icon:'🏹',cost:[250,140],description:'+35 к дальности и +20% урона лучников',apply(){R.upgrades.fletching=true}},
logistics:{name:'Снабжение',icon:'🎒',cost:[175,135],description:'+4 к лимиту населения и +20% скорости рабочих',apply(){R.upgrades.logistics=true}}
};
R.upgrades={};R.armyMode='normal';R.difficulty='normal';R.score={resources:0,trained:0,buildings:0};R.researchQueue=null;
R.resetProgression=()=>{R.upgrades={};R.researchQueue=null;R.armyMode='normal';R.score={resources:0,trained:0,buildings:0}};
R.tech=(id)=>{const t=R.techs[id];if(!t||R.upgrades[id]||R.researchQueue)return;if(!R.buildings.some(b=>b.team===0&&b.type==='barracks'))return R.toast('Для исследований нужны казармы');if(!R.pay(t.cost))return;R.researchQueue={id,progress:0,time:11};R.toast('Изучаем: '+t.name);R.hud?.()};
R.advanceResearch=dt=>{const q=R.researchQueue;if(!q)return;q.progress+=dt;if(q.progress>=q.time){R.techs[q.id].apply();R.toast('Исследование завершено: '+R.techs[q.id].name);R.researchQueue=null;R.hud?.()}};
R.unitDamage=(u,d)=>{let value=d;if(u.team===0&&R.upgrades.steel&&['soldier','guardian'].includes(u.type))value*=1.25;if(u.team===0&&R.upgrades.fletching&&['archer','crossbow'].includes(u.type))value*=1.2;return Math.round(value)};
R.armorFactor=(u)=>u.team===0&&R.upgrades.armor&&u.kind==='unit'&&u.type!=='worker'?.8:1;
R.unitRange=(u,r)=>u.team===0&&R.upgrades.fletching&&['archer','crossbow'].includes(u.type)?r+35:r;
R.unitSpeed=(u,s)=>u.team===0&&R.upgrades.logistics&&u.type==='worker'?s*1.2:s;
R.upgradeStatus=()=>Object.keys(R.upgrades).length;
R.waveScale=()=>({easy:.78,normal:1,hard:1.27}[R.difficulty]||1);
R.setDifficulty=x=>{if(!['easy','normal','hard'].includes(x))return;R.difficulty=x;R.toast('Сложность: '+({easy:'Новичок',normal:'Стандарт',hard:'Ветеран'}[x]));R.hud?.()};
})();
