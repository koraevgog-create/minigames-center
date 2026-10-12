// Compact HUD tabs, hotkeys and context navigation.
(()=>{
'use strict';
const tabs=[...document.querySelectorAll('.tab[data-tab]')];
function switchTab(name){
 for(const button of tabs){const selected=button.dataset.tab===name;button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected))}
 for(const pane of document.querySelectorAll('.tab-pane'))pane.classList.toggle('active',pane.id===name);
}
tabs.forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.tab)));
window.LastHeroUI={switchTab};
const inventory=document.getElementById('inventory');
if(inventory){
 const watcher=new MutationObserver(()=>{if(document.querySelector('#inventory .sell-item')&&document.querySelector('.overlay:not([hidden])'))switchTab('inventory')});
 watcher.observe(inventory,{childList:true,subtree:true});
}
})();