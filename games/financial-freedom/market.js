/* Standalone market and investment calculations — game currency RUB. */
(()=>{'use strict';
const LIMIT=(v,a,b)=>Math.min(b,Math.max(a,v));
const money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function init(game){game.marketIndex ||= {property:1,business:1,stock:1};game.marketHistory ||= [];game.marketMonth ||= 0;game.saleFee ??=.03;for(const a of game.assets||[]){a.purchaseCost ||= a.cost;a.purchaseDown ??=a.down||Math.max(0,a.cost-a.loan);a.marketBase ||= a.cost}}
function index(game,category){return game.marketIndex?.[category]||1}
function acquisition(game,deal){const value=Math.max(1000,Math.round(deal.cost*index(game,deal.category)/1000)*1000);const share=deal.down/deal.cost;const down=Math.min(value,Math.max(1000,Math.round(value*share/1000)*1000));return {price:value,down,loan:value-down}}
function currentValue(game,asset){return Math.round((asset.marketBase||asset.cost)*index(game,asset.category))}
function sale(game,asset,multiplier=1){const price=Math.max(0,Math.round(currentValue(game,asset)*multiplier));const fee=Math.round(price*(game.saleFee??.03));const loan=Math.max(0,asset.loan||0);const proceeds=price-fee-loan;const cost=asset.purchaseDown??asset.down??asset.cost-loan;const realized=(asset.operations&&Number(asset.operations.earned))||0;const profit=proceeds-cost;return {price,fee,loan,proceeds,profit,totalProfit:profit+realized,realized,roi:cost>0?proceeds/cost-1:0}}
function change(game,category,factor,reason){init(game);if(!['property','business','stock'].includes(category))return;game.marketIndex[category]=Math.round(LIMIT(index(game,category)*factor,.55,2)*1000)/1000;game.marketHistory.unshift({month:game.marketMonth,category,value:game.marketIndex[category],reason});game.marketHistory=game.marketHistory.slice(0,24)}
function month(game){init(game);game.marketMonth++;for(const c of ['property','business']){const changeFactor=1+(Math.random()-.48)*.045;change(game,c,changeFactor,'Ежемесячное изменение')}} 
function finance(bank,amount,term,income){const borrowed=Math.max(0,Math.round(amount));const payment=borrowed?bank.monthly(borrowed,24,term):0;return {borrowed,payment,net:Math.round(income-payment),coverage:payment?income/payment:null,interest:payment*term-borrowed}}
window.FF_MARKET={init,index,acquisition,currentValue,sale,change,month,finance,money};
})();