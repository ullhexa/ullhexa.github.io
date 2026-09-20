import {el,button} from './editor-dom.js?v=34';
import {setFace} from './token-portraits.js?v=34';
import {groupSelection} from './group-selection.js?v=34';
import {statIcon} from './control-icons.js?v=34';
// One selection model for click, modifiers, keyboard deletion and the external X.
export function createMemberStrip({items=false,monster=false,onSelect,onRemove,onRemoveMany,onStat}){
 const root=el('div',undefined,`library-member-strip${items?' item-member-strip':''}`),nodes=new Map(),selection=groupSelection();let selected=null,expanded=null,group=null,order=[];
 const removeSelected=button('×',()=>remove(selection.ids),'member-remove-selected');removeSelected.setAttribute('aria-label','Remove selected members');removeSelected.title='Remove selected';
 function remove(ids){if(!ids.length)return;expanded=null;if(onRemoveMany)onRemoveMany(ids);else for(const id of ids)onRemove(id);}
 function update(){removeSelected.disabled=!selection.ids.length;removeSelected.setAttribute('aria-label',`Remove ${selection.ids.length||'selected'} selected ${items?'items':monster?'encounters':'players'}`);for(const [id,wrap]of nodes){wrap.classList.toggle('member-expanded',expanded===id);wrap.firstElementChild.setAttribute('aria-pressed',selection.has(id));}}
 document.addEventListener('pointerdown',e=>{if(expanded&&!nodes.get(expanded)?.contains(e.target)){expanded=null;update();}},true);
 root.addEventListener('keydown',e=>{if(['Delete','Backspace'].includes(e.key)&&!e.metaKey&&!e.ctrlKey&&e.target.closest('.library-member')){e.preventDefault();e.stopPropagation();remove(selection.ids);}});
 function render(members,id,context){if(context!==group){group=context;selection.reset(id);expanded=null;}else if(id!==selected)selection.reset(id);selected=id;order=members.map(m=>m.id);selection.prune(order,id);
  for(const[key,n]of nodes)if(!order.includes(key)){n.remove();nodes.delete(key);}for(const m of members){let wrap=nodes.get(m.id);if(!wrap){wrap=el('div',undefined,'member-tile');const tile=button('',e=>{selected=selection.click(m.id,e,order);update();onSelect(m.id);tile.focus({preventScroll:true});},'library-member'),img=el('img'),name=el('span',undefined,'member-name'),removeOne=button('×',e=>{e.stopPropagation();remove([m.id]);},'member-remove');img.alt='';img.width=img.height=40;tile.append(img,name);tile.dataset[items?'itemId':'memberId']=m.id;tile.addEventListener('dblclick',e=>{e.preventDefault();expanded=expanded===m.id?null:m.id;update();});wrap.append(tile,removeOne);if(monster){const stat=button('',e=>{e.stopPropagation();onStat(m.id);},'member-stat');stat.append(statIcon());wrap.append(stat);}nodes.set(m.id,wrap);}
   const tile=wrap.firstElementChild;setFace(tile.firstElementChild,m);tile.lastElementChild.textContent=m.name;wrap.querySelector('.member-remove').setAttribute('aria-label',`Remove ${m.name}`);wrap.querySelector('.member-stat')?.setAttribute('aria-label',`Edit ${m.name} stat card`);wrap.classList.toggle('has-stat',!!(m.statCard||m.statText));if(wrap.parentElement!==root)root.append(wrap);
  }update();return root;
 }
 return {root,render,removeSelected};
}
