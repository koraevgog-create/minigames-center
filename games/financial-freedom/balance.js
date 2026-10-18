(()=>{'use strict';
function expenses(p){return p.tax+p.housing+p.utilities+p.food+p.transport+p.other+p.debtPay}
function cash(p){return Math.round(Math.max(p.cash,expenses(p)*1.65))}
function charge(amount,salary,turn){return Math.round(Math.min(amount,salary*(turn<=12?.24:.38))/100)*100}
function hardship(turn){return {cycles:1,replacement:turn<=12?.65:.4}}
function familyCost(g){return Math.min(g.prof.childCost,Math.round(g.prof.salary*.07))}
function migrate(g){if(g.familyBalanceVersion===2)return;g.children=Math.min(Number(g.children)||0,1);g.lastFamilyTurn=g.children?g.turn:-100;g.familyBalanceVersion=2}
function event(g,type){if(type==='child'){if(g.turn<16||g.children>=1||g.turn-(g.lastFamilyTurn??-100)<24)return 'familyBonus'}if(type==='jobloss'){if(g.turn<=5||g.turn-(g.lastJobLossTurn??-100)<18)return 'small';g.lastJobLossTurn=g.turn}return type}
window.FF_BALANCE={expenses,cash,charge,hardship,event,familyCost,migrate};
})();