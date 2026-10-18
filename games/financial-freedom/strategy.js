/* v1.3 - simple, decision-focused deal analysis and milestones */
(()=>{'use strict';
const money=v=>Math.round(v).toLocaleString('ru-RU')+' ₽';
const achievements=[
 ['first_asset','Первая инвестиция','Купить первый актив',g=>g.assets.length>0],
 ['portfolio_5','Портфель из пяти','Приобрести пять активов',g=>g.assets.length>=5],
 ['passive_50','Первые 50 000 ₽','Получать от 50 000 ₽ пассивного дохода', (g,p)=>p>=50000],
 ['million','Первый миллион','Достичь капитала 1 000 000 ₽',(g,p,w)=>w>=1000000],
 ['no_bank','Без банковских долгов','Погасить все банковские кредиты после первого займа',g=>g.loanSequence>0&&g.bankDebt<=0],
 ['freedom','Свободный круг','Выйти на внешний круг',g=>g.stage==='fast'],
 ['dream','Мечта осуществлена','Завершить игру исполнением мечты',g=>g.victory==='dream']
];
function evaluate(g,passive,networth){g.achievements ||= [];const added=[];for(const [id,title,description,test] of achievements)if(!g.achievements.includes(id)&&test(g,passive,networth)){g.achievements.push(id);added.push(title)}return added}
function analyze({price,down,monthly,cash,amount,term,bank,otherPayments=0}){
 const loan=Math.max(0,Math.floor(Number(amount)||0)),t=Number(term)||36;
 const payment=loan?bank.monthly(loan,24,t):0;
 const payback=monthly>0?Math.ceil(down/monthly):null;
 const yieldPct=down>0?monthly*1200/down:null;
 const leftCash=cash-down;
 const netAfterLoan=monthly-payment;
 return {price,down,monthly,loan,payment,payback,yieldPct,leftCash,netAfterLoan,coverage:payment?monthly/payment:null,annual:monthly*12,remainingDebtPayments:otherPayments,needsCash:Math.max(0,down-cash),hasOwnFunds:cash>=down};
}
function score(result){if(result.monthly<=0)return {label:'Отрицательный поток',tone:'bad'};if(result.netAfterLoan<0)return {label:'Кредит съедает доход',tone:'bad'};if(result.payback&&result.payback<=48)return {label:'Быстрая окупаемость',tone:'good'};if(result.payback&&result.payback<=96)return {label:'Умеренная окупаемость',tone:'neutral'};return {label:'Долгая окупаемость',tone:'neutral'}}
window.FF_STRATEGY={achievements,evaluate,analyze,score,money};
})();