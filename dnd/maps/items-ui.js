import {featureHeading} from './feature-controls.js?v=61';
import {featureEnabled} from './board-state.js?v=61';
import {chevronIcon,icon} from './control-icons.js?v=61';
import {numberStepper} from './number-stepper.js?v=61';
import {itemFloorAt} from './floors.js?v=61';
import {tokenGallery} from './token-gallery.js?v=61';
import {createMemberStrip} from './member-strip.js?v=61';
import {registerMenu,openMenu,closeMenu} from './main-menu.js?v=61';
import {el,button} from './combat-ui.js?v=61';
import {ITEMS,searchItems} from './items-catalog.js?v=61';
import {setFace} from './token-portraits.js?v=61';
import {normalizeItem,syncCampaign,applyItemList,deleteGroup,patchToken,placeItem,snapPoint} from './combat-state.js?v=61';
import {groupSelection} from './group-selection.js?v=61';
const $=id=>document.getElementById(id);
function face(item){const img=el('img');img.alt='';img.width=img.height=40;img.draggable=false;setFace(img,item);return img;}
function field(label,value,change,type='text'){const wrap=el('label',label,'field-label'),input=el('input');input.type=type;input.value=value;input.setAttribute('aria-label',label);input.addEventListener('input',()=>change(input.value));wrap.append(input);return {wrap,input};}
export function createItemsUI({map,getState,commit,announce,pointAt,setTool,selectItem,editItem,showNotes}){
  let selected=null,itemId=null,signature='',traySignature='',query='',expanded=false,drag=null,librarySource='factory',selectedUser=null;const selection=groupSelection();
  const sidebar=el('section',undefined,'items-roster');sidebar.id='items-roster';$('combat-roster').after(sidebar);
  const rows=new Map(),sidebarGrid=el('div',undefined,'item-roster-grid');sidebarGrid.setAttribute('aria-label','Placed items');sidebar.append(el('h3','Items'),sidebarGrid);
  const tray=el('section',undefined,'item-tray');tray.id='item-tray';tray.setAttribute('aria-label','Reusable item tray');const traySurface=el('div',undefined,'item-tray-surface'),trayGrid=el('div',undefined,'item-tray-grid'),expand=button('⌃',()=>{expanded=!expanded;layoutTray();},'item-tray-expand');expand.setAttribute('aria-label','Expand item tray');traySurface.append(trayGrid,expand);tray.append(traySurface);
  const footer=document.querySelector('.map-footer');footer.before(tray);footer.classList.add('status-only');$('live-message').setAttribute('role','status');
  function layoutTray(){const overflow=trayGrid.scrollHeight>60;expand.hidden=!overflow&&!expanded;tray.classList.toggle('expanded',expanded);expand.textContent=expanded?'⌄':'⌃';expand.setAttribute('aria-expanded',expanded);expand.setAttribute('aria-label',expanded?'Collapse item tray':'Expand item tray');tray.style.setProperty('--tray-max-height',`${Math.max(64,Math.min(360,$('map-stage').clientHeight*.7))}px`);}
  new ResizeObserver(layoutTray).observe(tray);
  const open=button('Items',()=>openMenu('items'),'map-picker');open.append(chevronIcon());open.id='open-items-library';open.setAttribute('aria-haspopup','dialog');document.querySelector('.site-identity').append(open);
  const panel=el('section',undefined,'library-dialog');panel.id='items-dialog';
  const layout=el('div',undefined,'library-layout'),groups=el('section',undefined,'library-groups'),main=el('section',undefined,'library-members');layout.append(groups,main);
  const hint=el('p','','library-save-hint'),error=el('p','','save-error');error.setAttribute('role','alert');
  const actions=el('div',undefined,'dialog-actions'),remove=button('Delete item list',()=>{let s=getState();for(const id of selection.ids)s=deleteGroup(s,'items',id);commit(s,'Item lists deleted. Undo restores them.');selected=null;itemId=null;selection.reset();renderMenu();},'delete-group'),apply=button('Done',()=>{if(selected&&selected!==getState().campaign.activeItems)commit(applyItemList(getState(),selected),'Item tray activated.');closeMenu();},'primary');actions.append(remove,apply);panel.append(error,hint,layout,actions);document.body.append(panel);
  const group=()=>getState().campaign.itemLists.find(g=>g.id===selected);
  const memberStrip=createMemberStrip({items:true,onSelect:id=>{itemId=id;selectedUser=null;renderMenu();},onRemove:id=>edit(g=>({...g,members:g.members.filter(m=>m.id!==id)})),onRemoveMany:ids=>edit(g=>({...g,members:g.members.filter(m=>!ids.includes(m.id))}))});
  function edit(fn,redraw=true,groupId=selected){const s=syncCampaign(getState()),lists=s.campaign.itemLists.map(g=>g.id===groupId?fn(g):g);commit({...s,campaign:{...s.campaign,itemLists:lists}},'Item list updated.');if(redraw)renderMenu();else refreshLabels();}
  function refreshLabels(){const s=getState();for(const b of groups.querySelectorAll('[data-item-group]')){const g=s.campaign.itemLists.find(g=>g.id===b.dataset.itemGroup);if(g)b.textContent=g.name;}for(const b of main.querySelectorAll('[data-item-id]')){const item=group()?.members.find(m=>m.id===b.dataset.itemId);if(item)b.lastElementChild.textContent=item.name;}}
  function addItem(picture=null,avatar=null,groupId=selected){const g=getState().campaign.itemLists.find(g=>g.id===groupId);if(!g)return;if(picture===null)picture=ITEMS.findIndex((_,portrait)=>!g.members.some(m=>!m.avatar&&m.portrait===portrait));if(picture<0){announce('All factory items are already included.');return;}const existing=g.members.find(m=>avatar?m.avatar===avatar:!m.avatar&&m.portrait===picture);if(existing){memberStrip.select(existing.id);return;}if(g.members.length>=500){announce('Up to 500 items per list.');return;}itemId=crypto.randomUUID();const item=normalizeItem({id:itemId,name:avatar?'Custom item':ITEMS[picture],portrait:picture,avatar,size:5,visible:false});edit(g=>({...g,members:[...g.members,item]}),true,groupId);}
  function renderMenu(){const s=getState();if(!s.campaign.itemLists.some(g=>g.id===selected))selected=s.campaign.activeItems||s.campaign.itemLists[0]?.id||null;selection.prune(s.campaign.itemLists.map(g=>g.id),selected);const g=group();groups.replaceChildren(featureHeading({kind:'items',title:'Item lists',groups,main,footer:actions,getState,commit,render:renderMenu}),button('+ New item list',()=>{const s=syncCampaign(getState());if(s.campaign.itemLists.length>=20)return;selected=crypto.randomUUID();selection.reset(selected);itemId=null;commit({...s,campaign:{...s.campaign,itemLists:[...s.campaign.itemLists,{id:selected,name:'Items',members:[]}]}},'Item list created.');renderMenu();}));
    for(const list of s.campaign.itemLists){const b=button(list.name,e=>{selected=selection.click(list.id,e,s.campaign.itemLists.map(g=>g.id));itemId=null;renderMenu();},'library-group');b.dataset.itemGroup=list.id;b.setAttribute('aria-pressed',selection.has(list.id));b.classList.toggle('editing-group',list.id===selected);b.setAttribute('aria-current',list.id===s.campaign.activeItems);groups.append(b);}
    main.replaceChildren();remove.disabled=!selection.ids.length;remove.textContent=selection.ids.length>1?`Delete ${selection.ids.length} item lists`:'Delete item list';apply.textContent=!g||s.campaign.activeItems===selected?'Done':'Activate item list';hint.textContent='';if(!g){main.append(el('p','Create an item list to choose its items.','tool-hint'));return;}
    const naming=field('Item list name',g.name,value=>edit(g=>({...g,name:value.trim().slice(0,48)||'Items'}),false));naming.input.maxLength=48;const top=el('div',undefined,'library-member-actions');top.append(naming.wrap,button('+ Add item',()=>addItem()));const memberControls=el('div',undefined,'member-add-remove');memberControls.append(top.lastElementChild,memberStrip.removeSelected);top.append(memberControls);main.append(top);
    if(!g.members.some(m=>m.id===itemId))itemId=g.members[0]?.id;
    main.append(memberStrip.render(g.members,itemId,selected));
    const item=g.members.find(m=>m.id===itemId);
    const fields=el('div',undefined,'member-fields item-edit-layout');
    if(item){
      const patch=p=>edit(g=>({...g,members:g.members.map(m=>m.id===itemId?{...m,...p}:m)}),false),wholeFeet=value=>Math.max(1,Math.min(200,Math.round(Number(value)||1)));
      const name=field('Item name',item.name,value=>patch({name:value.trim().slice(0,32)||'Item'})),size=field('Item size (ft)',item.size,value=>patch({size:wholeFeet(value)}),'number');
      name.wrap.classList.add('item-name-field');name.input.maxLength=32;size.wrap.classList.add('item-size-field');size.input.min=1;size.input.max=200;size.input.step=1;size.input.addEventListener('blur',()=>size.input.value=group()?.members.find(m=>m.id===itemId)?.size||1);
      const control=numberStepper(size.input,{name:'item size',normalize:wholeFeet});control.classList.add('item-size-control');size.wrap.append(control);
      const notes=el('label','Comment','field-label item-comment-field'),comment=el('textarea');comment.value=item.comment;comment.maxLength=2000;comment.rows=3;comment.setAttribute('aria-label','Default item comment');comment.addEventListener('input',()=>patch({comment:comment.value}));notes.append(comment);fields.append(name.wrap,size.wrap,notes);main.append(fields);
    }
    const assign=(portrait,avatar=null)=>{const existing=group()?.members.find(m=>avatar?m.avatar===avatar:!m.avatar&&m.portrait===portrait);if(existing){memberStrip.select(existing.id);return;}if(!item){addItem(portrait,avatar);return;}memberStrip.highlight(itemId);edit(g=>({...g,members:g.members.map(m=>m.id===itemId?{...m,portrait,avatar,...(!avatar&&(ITEMS.includes(m.name)||m.name==='Custom item')?{name:ITEMS[portrait]}:{})}:m)}));};
    const gallery=tokenGallery({kind:'items',mode:librarySource,setMode:value=>librarySource=value,selected:selectedUser||s.campaign.userTokens.items.find(t=>t.asset===item?.avatar)?.id,setSelected:id=>selectedUser=id,getState,commit,onApply:token=>assign(0,token.asset),onRefresh:renderMenu,error,isIncluded:token=>g.members.some(m=>m.avatar===token.asset),factory:bar=>{
      const area=el('div'),search=el('input');search.type='search';search.value=query;search.placeholder='Search items';search.setAttribute('aria-label','Search item catalog');search.className='item-search';const catalog=el('div',undefined,'item-catalog');catalog.setAttribute('role','group');catalog.setAttribute('aria-label','500 item pictures');
      function filterCatalog(){const results=searchItems(query);catalog.replaceChildren();for(const {name,portrait}of results){const b=button('',()=>assign(portrait),'item-catalog-choice');b.title=name;b.setAttribute('aria-label',`Use ${name}`);b.setAttribute('aria-pressed',g.members.some(m=>m.portrait===portrait&&!m.avatar));b.append(face({item:true,portrait}));catalog.append(b);}if(!results.length)catalog.append(el('p','No matching items.','catalog-empty'));}
      search.addEventListener('input',()=>{query=search.value;filterCatalog();});bar.append(search);area.append(catalog);filterCatalog();return area;
    }});
    if(item){const bar=gallery.querySelector('.source-tabs');bar.classList.add('item-catalog-toolbar');fields.append(bar);}main.append(gallery);
  }
  function beginDrag(e,item){if(e.button!==0)return;e.preventDefault();setTool(null);const ghost=face(item);ghost.className='item-drag-ghost';document.body.append(ghost);drag={pointer:e.pointerId,item,ghost,source:e.currentTarget,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);moveDrag(e);}
  function moveDrag(e){if(!drag||drag.pointer!==e.pointerId)return;drag.ghost.style.left=`${e.clientX}px`;drag.ghost.style.top=`${e.clientY}px`;}
  function finish(e,cancel=false){if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;d.ghost.remove();if(d.source.hasPointerCapture(e.pointerId))d.source.releasePointerCapture(e.pointerId);if(cancel||Math.hypot(e.clientX-d.x,e.clientY-d.y)<3)return;const stage=$('map-stage'),r=stage.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;let position=pointAt(e);if(!position||position.some(n=>n<0||n>1))return;if(getState().snap)position=snapPoint(map,position,d.item.size);const id=crypto.randomUUID(),next=placeItem(getState(),d.item,id,position,itemFloorAt(map,getState(),position));if(next===getState()){announce('Up to 500 placed items per map.');return;}commit(next,'Item placed.');selectItem(id);expanded=false;layoutTray();}
  tray.addEventListener('pointermove',moveDrag);tray.addEventListener('pointerup',e=>finish(e));tray.addEventListener('pointercancel',e=>finish(e,true));
  function render(){const s=getState();sidebar.hidden=tray.hidden=!featureEnabled(s,'items');const g=s.campaign.itemLists.find(g=>g.id===s.campaign.activeItems),traySig=JSON.stringify(g?.members||[]);if(traySig!==traySignature){traySignature=traySig;trayGrid.replaceChildren();for(const item of g?.members||[]){const b=button('',()=>{},'tray-item');b.title=item.name;b.setAttribute('aria-label',`Drag ${item.name} onto map`);b.append(face(item));b.addEventListener('pointerdown',e=>beginDrag(e,item));trayGrid.append(b);}if(!g?.members.length){const b=button('Items',()=>openMenu('items'),'tray-empty');trayGrid.append(b);}requestAnimationFrame(layoutTray);}
    const items=s.items||[],sig=JSON.stringify(items.map(({position,stack,...m})=>m));if(sig===signature)return;signature=sig;
    for(const[id,row]of rows)if(!items.some(m=>m.id===id)){row.remove();rows.delete(id);}
    for(const [index,m]of items.entries()){
      let row=rows.get(m.id);
      if(!row){
        row=el('div',undefined,'item-roster-row');row.dataset.placedItem=m.id;
        const b=button('',()=>{selectItem(null);const item=getState().items.find(item=>item.id===m.id);if(item)commit(patchToken(getState(),m.id,{visible:!item.visible}),'Item visibility updated.');},'roster-portrait item-visibility');
        const hidden=el('span',undefined,'item-hidden-overlay');hidden.setAttribute('aria-hidden','true');hidden.append(icon([{d:'M3 9q9 10 18 0M5 12l-2 3m7-1-1 4m5-4 1 4m4-6 2 3',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'}]));b.append(face(m),hidden);
        const name=button(m.name,()=>editItem(m.id),'roster-name');name.dataset.itemEdit=m.id;name.addEventListener('dblclick',()=>showNotes(m.id));row.append(b,name);rows.set(m.id,row);
      }
      const [b,name]=row.children;row.classList.toggle('is-hidden',!m.visible);b.setAttribute('aria-pressed',m.visible);b.setAttribute('aria-label',`${m.visible?'Hide':'Show'} ${m.name} ${m.visible?'from':'to'} players`);b.title=m.visible?'Hide from players':'Show to players';b.lastElementChild.hidden=m.visible;setFace(b.firstElementChild,m);name.textContent=m.name;
      if(sidebarGrid.children[index]!==row)sidebarGrid.insertBefore(row,sidebarGrid.children[index]||null);
    }
  }
  registerMenu('items',panel,{onShow:fresh=>{error.textContent='';if(fresh){librarySource='factory';selectedUser=null;selected=getState().campaign.activeItems;selection.reset(selected);}renderMenu();}});
  render();return {render};
}
