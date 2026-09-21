import {buildingParts,effectLevels} from './building-state.js?v=55';
import {createFloorControl} from './floor-controls.js?v=55';
import {selectedFloor} from './floors.js?v=55';
import {icon} from './control-icons.js?v=55';
import {consumeMapDismissal} from './map-dismissal.js?v=55';

function symbol(kind,on){
 const paths=kind==='focus'?(on?'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6':'M3 9h6V3m6 0v6h6M9 21v-6H3m12 6v-6h6'):
  kind==='cover'?(on?'M3 9 12 3l9 6M5 12v9h14v-9M12 17V9m-3 3 3-3 3 3':'M3 8 12 1l9 7M5 12v9h14v-9M12 10v7m-3-3 3 3 3-3'):
  on?'M3 21h18M4 18l3-5 4 4 3-6 6 7M6 9l5-6 3 4 4-1 3 5M12 6l-2 5 4 2':'M3 10 12 3l9 7M5 10v11h14V10M10 21v-7h4v7';
 return icon([{d:paths,fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'}]);
}
export function createBuildingControls({map,getState,getSelected,getFocused,select,focus,toggle,setFloor,beginPreview,endPreview,prepare,getGeometry}){
 const stage=document.getElementById('map-stage'),section=document.querySelector('.selected-place'),globals=document.getElementById('place-global-controls'),effects=document.getElementById('selected-actions'),title=document.getElementById('selected-title');
 const popup=document.createElement('div');popup.className='building-popup';popup.hidden=true;popup.setAttribute('role','group');stage.append(popup);
 let mode=null,current=null,signature='',floorControl=null;
 function button(kind,place,compact=false){
  const b=document.createElement('button');b.type='button';b.className=`building-action${compact?' icon-only':''}`;b.dataset.buildingAction=kind;
  b.addEventListener('click',()=>{if(kind==='focus')focus(place);else{const parts=buildingParts(map,place),item=kind==='cover'?parts.roof:parts.collapsed;if(item)toggle(item.id);}});return b;
 }
 function updateButton(b,place){
  const kind=b.dataset.buildingAction,parts=buildingParts(map,place),state=getState(),on=kind==='focus'?getFocused()===place.id:kind==='cover'?!!parts.roof&&!state.active.includes(parts.roof.id):!!parts.collapsed&&state.active.includes(parts.collapsed.id);
  const label=kind==='focus'?(on?'Overview':'Focus'):kind==='cover'?(on?'Uncover':'Cover'):(on?'Collapsed':'Intact');
  const available=kind==='focus'||!!(kind==='cover'?parts.roof:parts.collapsed);b.disabled=!available;b.setAttribute('aria-pressed',String(kind==='cover'?!on:on));b.setAttribute('aria-label',`${place.name}: ${label}`);b.title=available?(kind==='collapse'?(on?'Restore intact building':'Collapse building'):label):'Not available for this place';b.replaceChildren(symbol(kind,on));if(!b.classList.contains('icon-only')){const text=document.createElement('span');text.textContent=label;b.append(text);}
 }
 function populateEffects(parent,place){
  parent.replaceChildren();for(const item of buildingParts(map,place).effects){const b=document.createElement('button');b.type='button';b.className='building-effect';b.dataset.effect=item.id;b.setAttribute('aria-label',`${place.name}: ${item.label}`);const label=document.createElement('span');label.textContent=item.label;const levels=document.createElement('span');levels.className='effect-levels';for(const level of effectLevels(place,item)){const badge=document.createElement('span');badge.className='effect-floor';badge.textContent=level;badge.title=`Floor ${level}`;levels.append(badge);}b.append(label,levels);b.addEventListener('click',()=>toggle(item.id));parent.append(b);}
 }
 function group(label,body){const s=document.createElement('section'),h=document.createElement('h3');h.textContent=label;s.append(h,body);return s;}
 function buildPopup(place){
  popup.replaceChildren();floorControl=null;popup.classList.toggle('building-quick',mode==='quick');popup.classList.toggle('building-editor',mode==='editor');popup.setAttribute('aria-label',mode==='editor'?`Prepare ${place.name}`:`${place.name} quick actions`);
  if(mode==='editor'){
   const header=document.createElement('header'),name=document.createElement('strong'),close=document.createElement('button');name.textContent=`${map.places.indexOf(place)+1}. ${place.name}`;close.type='button';close.className='building-close';close.textContent='×';close.setAttribute('aria-label','Close building preparation');close.addEventListener('click',()=>hide());header.append(name,close);popup.append(header);
   if(place.floors?.length>1){floorControl=createFloorControl(place,{getFloor:()=>selectedFloor(place,getState()),onSelect:(floor,level)=>setFloor(place,floor,level)});popup.append(group('Floor',floorControl.root));}
  }
  const row=document.createElement('div');row.className='building-global';for(const kind of ['focus','cover','collapse'])row.append(button(kind,place,mode==='quick'));popup.append(mode==='quick'?row:group('Building',row));
  if(mode==='editor'&&buildingParts(map,place).effects.length){const extra=document.createElement('div');extra.className='building-effects';populateEffects(extra,place);popup.append(group(`Additional options [${extra.childElementCount}]`,extra));}
 }
 function render(){
  const place=map.places.find(p=>p.id===getSelected());if(!place){section.hidden=true;return;}section.hidden=false;
  if(current!==place.id){current=place.id;globals.replaceChildren();for(const kind of ['focus','cover','collapse']){const b=button(kind,place);if(kind==='focus')b.id='focus-place';globals.append(b);}title.textContent=`${map.places.indexOf(place)+1}. ${place.name} [${buildingParts(map,place).effects.length}]`;populateEffects(effects,place);if(mode)buildPopup(place);signature='';}
  const next=JSON.stringify([current,mode,getState().active,getState().floors,getFocused()]);if(next!==signature){signature=next;for(const b of [...globals.querySelectorAll('[data-building-action]'),...popup.querySelectorAll('[data-building-action]')])updateButton(b,place);for(const b of [...effects.querySelectorAll('[data-effect]'),...popup.querySelectorAll('[data-effect]')])b.setAttribute('aria-pressed',String(getState().active.includes(b.dataset.effect)));floorControl?.render();}
  position();
 }
 function position(){if(!mode||popup.hidden)return;const place=map.places.find(p=>p.id===getSelected()),g=getGeometry();if(!place||!g)return;const width=stage.clientWidth,height=stage.clientHeight;popup.style.maxHeight=`${Math.max(80,height-16)}px`;const x=g.x+place.point[0]*map.width*g.scale,y=g.y+place.point[1]*map.height*g.scale,w=popup.offsetWidth,h=popup.offsetHeight;const left=Math.max(8,Math.min(width-w-8,x-w/2));let top=y-h-27;if(top<8)top=y+49;top=Math.max(8,Math.min(height-h-8,top));popup.style.transform=`translate3d(${left}px,${top}px,0)`;}
 function show(place,editor=false){if(!editor&&mode==='quick'&&getSelected()===place.id){hide();return;}editor=editor||mode==='editor';prepare();select(place.id);if(editor&&mode!=='editor')beginPreview();mode=editor?'editor':'quick';popup.hidden=false;buildPopup(place);signature='';render();}
 function hide(){if(!mode)return;const preview=mode==='editor';mode=null;popup.hidden=true;popup.replaceChildren();floorControl=null;signature='';if(preview)endPreview();render();}
 document.addEventListener('pointerdown',e=>{if(!mode||popup.contains(e.target))return;if(mode==='quick'){if(e.target.closest('.hotspot'))return;hide();if(stage.contains(e.target))consumeMapDismissal(e,stage);return;}if(stage.contains(e.target)){hide();consumeMapDismissal(e,stage);}},true);
 document.addEventListener('keydown',e=>{if(!mode||e.key!=='Escape'||e.defaultPrevented)return;e.preventDefault();e.stopImmediatePropagation();hide();},true);
 document.addEventListener('library-opening',hide);
 return {render,position,show,hide,get preparing(){return mode==='editor';}};
}
