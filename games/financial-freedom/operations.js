/* Asset operations v1.2 — recoverable cash-flow risk and transparent operating accounts. */
(()=>{'use strict';
const rub=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
function ensure(a){
 if(!a.operations){
 const baseline=Math.round(a.monthly||0),property=a.category==='property';
 const gross=Math.round(baseline/(property ? .7 : .6));
 const expenses=gross-baseline;
 a.operations={gross,expenses,baseNet:baseline,occupancy:1,condition:100,earned:0,months:0,missed:0};
 }
 const op=a.operations;op.gross=Math.max(0,Number(op.gross)||0);op.expenses=Math.max(0,Number(op.expenses)||0);
 op.occupancy=clamp(Number(op.occupancy)||0,0,1);op.condition=clamp(Number(op.condition)||0,40,100);op.earned=Number(op.earned)||0;op.months=Number(op.months)||0;
 a.monthly=Math.round(op.gross*op.occupancy*(.7+.3*op.condition/100)-op.expenses);
 return op;
}
function initialize(g){for(const a of g.assets||[])ensure(a)}
function attach(a){ensure(a);return a}
function month(g){
 initialize(g);
 const events=[];
 for(const a of g.assets||[]){
 const op=ensure(a),property=a.category==='property';
 if(property){
   if(op.occupancy===0){if(Math.random()<.55){op.occupancy=1;events.push('🏠 '+a.name+': найден новый арендатор')}}
   else if(Math.random()<.07){op.occupancy=0;op.missed++;events.push('🏠 '+a.name+': простой, арендатор съехал')}
 }else{
   // Recurring business demand may drop or recover; expenses continue.
   op.occupancy=clamp(Math.round((op.occupancy+(Math.random()-.48)*.16)*100)/100,.65,1);
 }
 op.condition=clamp(op.condition-(property?1:.8),40,100);
 a.monthly=Math.round(op.gross*op.occupancy-op.expenses);
 op.months++;
 }
 return events;
}
function bookIncome(g){for(const a of g.assets||[]){const op=ensure(a);op.earned+=a.monthly}}
function repair(g,id){const a=(g.assets||[]).find(x=>x.id===id);if(!a)return {ok:false,reason:'Актив не найден'};const op=ensure(a);const cost=Math.round(op.gross*.75);if(g.cash<cost)return {ok:false,reason:'Недостаточно денег для обслуживания'};g.cash-=cost;op.condition=100;if(a.category==='property'&&op.occupancy===0)op.occupancy=1;a.monthly=Math.round(op.gross*op.occupancy-op.expenses);return {ok:true,cost}}
function operatingProfit(a){const op=ensure(a);return op.earned}
window.FF_OPERATIONS={ensure,initialize,attach,month,bookIncome,repair,operatingProfit,rub};
})();