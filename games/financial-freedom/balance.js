(()=>{'use strict';
function expenses(p){return p.tax+p.housing+p.utilities+p.food+p.transport+p.other+p.debtPay}
function cash(p){return Math.round(Math.max(p.cash,expenses(p)*1.65))}
function charge(amount,salary,turn){return Math.round(Math.min(amount,salary*(turn<=12?.24:.38))/100)*100}
function hardship(turn){return {cycles:1,replacement:turn<=12?.65:.4}}
function familyCost(g){return Math.min(g.prof.childCost,Math.round(g.prof.salary*.07))}
function migrate(g){if(g.familyBalanceVersion===2)return;g.children=Math.min(Number(g.children)||0,1);g.lastFamilyTurn=g.children?g.turn:-100;g.familyBalanceVersion=2}
// Unexpected expenses are occasional setbacks, not a penalty on every expense tile.
const EXPENSE_SPACING=6, REPEAT_SPACING=22, MAJOR_SPACING=11;
function expenseAllowed(g){const history=g.expenseHistory||[];const recent=history.filter(x=>g.turn-x.turn<12);return g.turn-(g.lastExpenseTurn??-100)>=EXPENSE_SPACING&&recent.length<2}
function expenseGroup(item){const name=item.name.toLowerCase();if(name.includes('автомобил'))return 'auto';if(name.includes('ремонт')||name.includes('техники')||name.includes('мебел'))return 'home';return 'other'}
function pickExpense(g,items,rng=Math.random){
 g.expenseHistory ||= [];
 const h=g.expenseHistory;
 const possible=items.filter(item=>h.every(entry=>entry.name!==item.name||g.turn-entry.turn>=REPEAT_SPACING));
 const candidates=possible.filter(item=>expenseGroup(item)==='other'||h.every(entry=>expenseGroup(entry) !==expenseGroup(item)||g.turn-entry.turn>=MAJOR_SPACING));
 const list=candidates.length?candidates:possible.length?possible:items;
 if(!list.length)return null;
 return list[Math.min(list.length-1,Math.floor(rng()*list.length))];
}
function recordExpense(g,item){g.expenseHistory ||= [];g.expenseHistory.push({name:item.name,turn:g.turn});g.expenseHistory=g.expenseHistory.filter(x=>g.turn-x.turn<=35).slice(-15);g.lastExpenseTurn=g.turn}
function event(g,type){if(type==='expense'&&!expenseAllowed(g))return 'quiet';if(type==='child'){if(g.turn<16||g.children>=1||g.turn-(g.lastFamilyTurn??-100)<24)return 'familyBonus'}if(type==='jobloss'){if(g.turn<=5||g.turn-(g.lastJobLossTurn??-100)<18)return 'small';g.lastJobLossTurn=g.turn}return type}
window.FF_BALANCE={expenses,cash,charge,hardship,event,familyCost,migrate,expenseAllowed,pickExpense,recordExpense};
})();