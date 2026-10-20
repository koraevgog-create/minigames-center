/* 0.6 — combat rules and visible ranged projectiles */
(()=>{'use strict';const R=window.RTS;
R.projectiles=[];R.combatStats={shots:0,hits:0,kills:0};
R.roles={worker:'Тыл · добыча и ремонт',soldier:'Передовая · стойкий ближний бой',archer:'Дальний бой · поддержка',enemy:'Налётчик · натиск'};
const hostile=(a,b)=>b&&b.hp>0&&b.team!==a.team&&b.team!==2;
R.chooseTarget=(unit,range)=>{const targets=[...R.units,...R.buildings].filter(t=>hostile(unit,t)&&R.dist(unit,t)<=range);if(!targets.length)return null;
 const ranked=targets.map(t=>{const dist=R.dist(unit,t);let score=dist*.65;
 if(t.kind==='unit')score-=unit.type==='archer'?70:35;
 if(t.type==='archer')score-=unit.team===1?30:12;
 if(t.hp/t.max<.4)score-=15;
 if(t.kind==='building')score+=70;
 if(unit.team===1&&t.type==='hall')score-=10;
 return {t,score}});ranked.sort((a,b)=>a.score-b.score);return ranked[0].t};
R.fire=(attacker,target,damage,kind='arrow')=>{if(!hostile(attacker,target))return;R.combatStats.shots++;
 if(kind==='melee'){R.damage(target,damage);R.combatStats.hits++;R.effect(target.x,target.y,'hit');return}
 const speed=kind==='bolt'?320:kind==='arrow'?420:300;
 R.projectiles.push({x:attacker.x,y:attacker.y-10,target,team:attacker.team,damage,kind,speed,life:3,trail:[]})};
R.updateProjectiles=dt=>{const next=[];for(const p of R.projectiles){if(p.target.hp<=0||p.life<=0)continue;
 const target=p.target,dx=target.x-p.x,dy=(target.y-10)-p.y,dist=Math.hypot(dx,dy);
 if(dist<Math.max(9,p.speed*dt)){R.damage(target,p.damage);R.combatStats.hits++;R.effect(target.x,target.y,'hit');continue}
 p.trail.push({x:p.x,y:p.y});if(p.trail.length>5)p.trail.shift();
 p.x+=dx/dist*p.speed*dt;p.y+=dy/dist*p.speed*dt;p.life-=dt;next.push(p)}
 R.projectiles=next};
R.drawProjectiles=(ctx)=>{for(const p of R.projectiles){const point=R.screen(p);ctx.save();ctx.strokeStyle=p.kind==='bolt'?'#9be6ee':'#ffdc96';ctx.lineWidth=(p.kind==='bolt'?3.5:2)*R.zoom;ctx.lineCap='round';ctx.globalAlpha=.95;const previous=p.trail[0]||p;const a=R.screen(previous);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(point.x,point.y);ctx.stroke();ctx.fillStyle=p.kind==='bolt'?'#d1f5ff':'#fbe8c0';ctx.beginPath();ctx.arc(point.x,point.y,Math.max(2,3.3*R.zoom),0,Math.PI*2);ctx.fill();ctx.restore()}};
R.resetCombat=()=>{R.projectiles=[];R.combatStats={shots:0,hits:0,kills:0}};
})();