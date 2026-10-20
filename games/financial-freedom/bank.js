/* Financial Freedom Bank v1: independent amortizing loans, one accounting cycle per payday. */
(()=>{'use strict';
const fmt=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function monthly(principal,annual,months){const r=annual/1200;if(r===0)return Math.ceil(principal/months);return Math.ceil(principal*r/(1-Math.pow(1+r,-months)))}
function active(game){return (game.loans||[]).filter(l=>l.balance>0)}
function totals(game){const loans=active(game);return {debt:loans.reduce((a,l)=>a+l.balance,0),payment:loans.reduce((a,l)=>a+l.payment,0)}}
function reconcile(game){const t=totals(game);game.bankDebt=t.debt;game.bankPay=t.payment;return t}
function init(game){if(!Array.isArray(game.loans)){game.loans=[];if(game.bankDebt>0){const balance=Math.round(game.bankDebt);game.loans.push({id:1,name:'Кредит из прежнего сохранения',principal:balance,balance,annual:24,term:60,remaining:60,payment:Math.max(1,Math.round(game.bankPay)||monthly(balance,24,60)),interestPaid:0,paid:0})}}game.loanSequence=Math.max(game.loanSequence||0,...game.loans.map(l=>l.id||0),0);reconcile(game)}
function quote(game,principal,term=36,investment=null){
 principal=Math.round(principal);term=Math.round(term);
 if(!Number.isFinite(principal)||principal<1000||principal>20000000)throw Error('Сумма должна быть от 1 000 до 20 000 000 ₽');
 if(![12,24,36,60].includes(term))throw Error('Выберите корректный срок');
 const payment=monthly(principal,24,term);
 const salary=Number(game.prof?.salary)||0;
 const passive=Array.isArray(game.assets)?game.assets.reduce((total,a)=>total+(Number(a.monthly)||0),0):0;
 const income=game.stage==='fast'?Math.max(0,Number(game.fastIncome)||0):salary+passive;
 let projected=0;
 if(investment){
  if(!Number.isFinite(investment.monthly)||investment.monthly<=0)throw Error('Инвестиционный кредит возможен только под доходный актив.');
  if(principal>investment.down)throw Error('Инвестиционный кредит не может превышать первый взнос по сделке.');
  projected=Math.floor(investment.monthly*.75); // 25% safety margin.
 }
 const limit=Math.max(1000,Math.round((income+projected)*.65));
 const total=totals(game).payment+payment;
 return {payment,limit,total,projected,approved:total<=limit};
}
function borrow(game,principal,term=36,annual=24,name='Банковский кредит',investment=null){
 if(!Number.isFinite(annual)||annual!==24)throw Error('Поддерживается ставка 24% годовых.');
 const estimate=quote(game,principal,term,investment);
 if((name==='Банковский кредит'||investment)&&!estimate.approved)throw Error('Банк отклонил заявку: платёж '+fmt(estimate.total)+'/мес. выше лимита '+fmt(estimate.limit)+'/мес. '+(investment?'Доход приобретаемого актива уже учтён с запасом 25%.':''));
 const loan={id:++game.loanSequence,name,principal:Math.round(principal),balance:Math.round(principal),annual,term:Math.round(term),remaining:Math.round(term),payment:estimate.payment,interestPaid:0,paid:0,investment:investment?{assetId:investment.assetId,assetName:investment.name,forecastMonthly:investment.monthly}:null};
 game.loans.push(loan);game.cash+=loan.principal;reconcile(game);return loan;
}
function repay(game,id,amount){const l=active(game).find(l=>l.id===Number(id));if(!l)throw Error('Кредит не найден');amount=Math.round(amount);if(!Number.isFinite(amount)||amount<=0)throw Error('Укажите сумму погашения');if(amount>game.cash)throw Error('Недостаточно наличных');amount=Math.min(amount,l.balance);game.cash-=amount;l.balance-=amount;l.paid+=amount;if(l.balance===0){l.payment=0;l.remaining=0}else{l.payment=monthly(l.balance,l.annual,Math.max(1,l.remaining))}reconcile(game);return amount}
function cycle(game,report){for(const l of active(game)){const interest=Math.ceil(l.balance*l.annual/1200);const paid=Math.min(l.balance+interest,l.payment);const principal=Math.max(0,paid-interest);l.balance=Math.max(0,l.balance-principal);l.interestPaid+=interest;l.paid+=paid;l.remaining=Math.max(0,l.remaining-1);if(l.balance===0)l.payment=0;else if(l.remaining===0){l.remaining=1;l.payment=l.balance+Math.ceil(l.balance*l.annual/1200)}if(report)report(l,paid,interest)}reconcile(game)}
window.FF_BANK={monthly,active,totals,reconcile,init,quote,borrow,repay,cycle,fmt};
})();