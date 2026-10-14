// Modular UI controller. Financial engine remains independent.
(()=>{'use strict';
const finance=document.getElementById('finances');
const tabs=[...document.querySelectorAll('[data-finance-tab]')];
const sections=['overview','overview','market','assets','assets'];
let selected='overview',raf=0;
function refreshSections(){
 if(!finance)return;
 const groups=[...finance.children].filter(el=>el.classList.contains('finance-group'));
 groups.forEach((el,i)=>{el.dataset.section=sections[i]||'assets'});
 finance.dataset.view=selected;
}
function activate(name){
 selected=name;
 tabs.forEach(b=>{const on=b.dataset.financeTab===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 refreshSections();
}
tabs.forEach(tab=>tab.addEventListener('click',()=>activate(tab.dataset.financeTab)));
if(finance){
 const observer=new MutationObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;refreshSections()})});
 observer.observe(finance,{childList:true});
 refreshSections();
}
window.FF_UI={showFinanceTab:activate};
const keys=e=>{if(e.key==='Escape'){const guide=document.getElementById('guide');if(guide?.open)return}if(e.code==='Space'&&document.activeElement?.tagName!=='BUTTON'&&!document.getElementById('game').hidden&&!document.querySelector('#event:not([hidden])')&&!document.getElementById('guide')?.open){e.preventDefault();const b=document.getElementById('roll');if(!b.disabled)b.click()}};
document.addEventListener('keydown',keys);
})();