import {el,button} from './editor-dom.js?v=44';
import {setFace} from './token-portraits.js?v=44';
import {groupSelection} from './group-selection.js?v=44';
import {statIcon} from './control-icons.js?v=44';
// Selection is independent of the member whose fields are being edited.
export function createMemberStrip({items=false,monster=false,onSelect,onRemove,onRemoveMany,onStat}){
 const root=el('div',undefined,`library-member-strip${items?' item-member-strip':''}`),nodes=new Map(),selection=groupSelection();let selected=null,group=null,order=[];
 const removeSelected=button('Remove',()=>remove(selection.ids),'member-remove-selected');removeSelected.setAttribute('aria-label','Remove selected members');removeSelected.title='Remove selected';
 function remove(ids){if(!ids.length)return;if(onRemoveMany)onRemoveMany(ids);else for(const id of ids)onRemove(id);}
 function update(){removeSelected.disabled=!selection.ids.length;removeSelected.setAttribute('aria-label',`Remove ${selection.ids.length||'selected'} selected ${items?'items':monster?'encounters':'players'}`);for(const [id,wrap]of nodes){wrap.firstElementChild.setAttribute('aria-pressed',selection.has(id));}}
 document.addEventListener('pointerdown',e=>{
  if(!root.isConnected||removeSelected.contains(e.target))return;
  const tile=e.target.closest('.member-tile'),avatar=e.target.closest('.token-gallery .portrait-option:not(.create-token),.token-gallery .item-catalog-choice');
  if(tile&&root.contains(tile)||avatar&&root.closest('.library-members')?.contains(avatar))return;
  selection.clear();if(root.contains(document.activeElement))document.activeElement.blur();update();
 },true);
 root.addEventListener('keydown',e=>{if(['Delete','Backspace'].includes(e.key)&&!e.metaKey&&!e.ctrlKey&&e.target.closest('.library-member')){e.preventDefault();e.stopPropagation();remove(selection.ids);}});
 function render(members,id,context){if(context!==group){group=context;selection.reset(id);}else if(id!==selected)selection.reset(id);selected=id;order=members.map(m=>m.id);selection.prune(order,id);
  for(const[key,n]of nodes)if(!order.includes(key)){n.remove();nodes.delete(key);}for(const m of members){let wrap=nodes.get(m.id);if(!wrap){wrap=el('div',undefined,'member-tile');const tile=button('',e=>{selected=selection.click(m.id,e,order);update();onSelect(m.id);tile.focus({preventScroll:true});},'library-member'),img=el('img'),name=el('span',undefined,'member-name'),removeOne=button('×',e=>{e.stopPropagation();remove([m.id]);},'member-remove');img.alt='';img.width=img.height=40;tile.append(img,name);tile.dataset[items?'itemId':'memberId']=m.id;wrap.append(tile,removeOne);if(monster){const stat=button('',e=>{e.stopPropagation();onStat(m.id);},'member-stat');stat.append(statIcon());wrap.append(stat);}nodes.set(m.id,wrap);}
   const tile=wrap.firstElementChild;setFace(tile.firstElementChild,m);tile.lastElementChild.textContent=m.name;wrap.querySelector('.member-remove').setAttribute('aria-label',`Remove ${m.name}`);wrap.querySelector('.member-stat')?.setAttribute('aria-label',`Edit ${m.name} stat card`);wrap.classList.toggle('has-stat',!!(m.statCard||m.statText));if(wrap.parentElement!==root)root.append(wrap);
  }update();return root;
 }
 function highlight(id){selected=id;selection.reset(id);update();}
 return {root,render,removeSelected,highlight,select(id){highlight(id);onSelect(id);}};
}
