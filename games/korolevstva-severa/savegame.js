/* 0.7: Versioned local single-player save, explicit entity reference restoration. */
(()=>{'use strict';const R=window.RTS,KEY='northern-kingdoms-rts-save-v1',VERSION=1;
const clone=o=>JSON.parse(JSON.stringify(o));
function serialize(){
const entities=[...R.units,...R.buildings,...R.resources];
return {version:VERSION,created:new Date().toISOString(),state:{
gold:R.gold,wood:R.wood,speed:R.speed||1,elapsed:R.elapsed,waves:R.waves,lastWave:R.lastWave,nextId:R.nextId,
cam:clone(R.cam),zoom:R.zoom,difficulty:R.difficulty,upgrades:clone(R.upgrades||{}),researchQueue:clone(R.researchQueue),score:clone(R.score||{}),
groups:clone(R.groups||{}),selected:R.selected.map(o=>o.id),units:R.units.map(u=>{const copy={...u};if(u.order)copy.order={...u.order,refId:u.order.ref?.id||null,ref:null};return copy}),buildings:clone(R.buildings),resources:clone(R.resources),combatStats:clone(R.combatStats),projectiles:[],events:clone(R.events||[])
}}}
function save(){try{const payload=JSON.stringify(serialize());if(payload.length>2e6)throw Error('Сохранение слишком большое');localStorage.setItem(KEY,payload);R.toast('💾 Партия сохранена в этом браузере');return true}catch(err){R.toast('Не удалось сохранить: '+err.message);return false}}
function restore(){try{const raw=localStorage.getItem(KEY);if(!raw){R.toast('Сохранённой партии пока нет');return false}const data=JSON.parse(raw);if(data.version!==VERSION||!data.state||!Array.isArray(data.state.units)||!Array.isArray(data.state.buildings)||!Array.isArray(data.state.resources))throw Error('Несовместимое сохранение');const v=data.state;if(v.units.length>500||v.buildings.length>150||v.resources.length>1000)throw Error('Повреждены данные карты');
R.reset();
R.gold=Number(v.gold)||0;R.wood=Number(v.wood)||0;R.speed=[1,2].includes(v.speed)?v.speed:1;R.elapsed=Number(v.elapsed)||0;R.waves=Number(v.waves)||0;R.lastWave=Number(v.lastWave)||0;R.nextId=Number(v.nextId)||0;
R.cam=v.cam||R.cam;R.zoom=R.clamp(Number(v.zoom)||1,.62,1.65);R.units=v.units;R.buildings=v.buildings;R.resources=v.resources;R.difficulty=['easy','normal','hard'].includes(v.difficulty)?v.difficulty:'normal';R.upgrades=v.upgrades||{};R.researchQueue=v.researchQueue||null;R.score=v.score||{resources:0,trained:0,buildings:0};R.groups=v.groups||{};R.events=v.events||[];R.combatStats=v.combatStats||{shots:0,hits:0,kills:0};R.projectiles=[];
const byId=new Map([...R.units,...R.buildings,...R.resources].map(e=>[e.id,e]));for(const u of R.units){if(!u.order)continue;const o=u.order;if(o.refId){o.ref=byId.get(o.refId)||null;if(!o.ref){u.order=null;continue}}delete o.refId;if(o.resume&&typeof o.resume==='object')o.resume={x:Number(o.resume.x)||u.x,y:Number(o.resume.y)||u.y};R.nav?.assign(u)}
R.selected=(v.selected||[]).map(id=>byId.get(id)).filter(Boolean);R.placing=null;R.paused=false;R.ended=false;speedBtn.textContent='▶ ×'+R.speed;R.hud?.();R.toast('📂 Партия восстановлена');return true
}catch(err){R.toast('Не удалось открыть сохранение: '+err.message);return false}}
function hasSave(){try{return !!localStorage.getItem(KEY)}catch{return false}}
R.saveGame=save;R.loadGame=restore;R.speed=1;const originalReset=R.reset;R.reset=()=>{R.speed=1;originalReset();speedBtn.textContent='▶ ×1'};
const top=document.querySelector('.topactions');const saveBtn=document.createElement('button'),loadBtn=document.createElement('button');saveBtn.type=loadBtn.type='button';saveBtn.id='saveGame';loadBtn.id='loadGame';saveBtn.textContent='💾 Сохранить';loadBtn.textContent='📂 Загрузить';saveBtn.title='Сохранить партию (Ctrl+S)';loadBtn.title='Продолжить сохранённую игру';saveBtn.onclick=save;loadBtn.onclick=restore;const speedBtn=document.createElement('button');speedBtn.id='speedGame';speedBtn.type='button';speedBtn.textContent='▶ ×1';speedBtn.title='Скорость симуляции 1×/2×';speedBtn.onclick=()=>{R.speed=R.speed===2?1:2;speedBtn.textContent='▶ ×'+R.speed;R.toast('Скорость игры: '+R.speed+'×')};top.prepend(speedBtn);top.prepend(loadBtn);top.prepend(saveBtn);
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}});
if(hasSave()){loadBtn.classList.add('has-save');loadBtn.title='Есть сохранённая партия';}
})();