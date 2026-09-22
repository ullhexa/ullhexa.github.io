import {button,el} from './editor-dom.js?v=62';
import {chevronIcon} from './control-icons.js?v=62';
import {consumeMapDismissal} from './map-dismissal.js?v=62';

export function createScenePicker({id,label,onSelect,onError}){
  const stage=document.getElementById('map-stage'),toggle=button('',()=>popup?close():open(),'quick-scene-toggle'),caption=el('span');
  toggle.id=id;toggle.append(caption,chevronIcon());toggle.setAttribute('aria-label',label);toggle.setAttribute('aria-haspopup','listbox');toggle.setAttribute('aria-controls',`${id}-menu`);toggle.setAttribute('aria-expanded','false');
  let entries=[],current=null,popup=null,choices=[],cursor=0,busy=false,search='',searchTime=0;
  function close(focus=false){popup?.remove();popup=null;choices=[];search='';toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus({preventScroll:true});}
  function position(){
    if(!popup)return;const r=toggle.getBoundingClientRect(),width=popup.offsetWidth,height=popup.offsetHeight;
    const below=innerHeight-r.bottom-8,above=r.top-8,y=height>below&&above>below?r.top-height-8:r.bottom+8;
    popup.style.left=`${Math.max(4,Math.min(innerWidth-width-4,r.left))}px`;popup.style.top=`${Math.max(4,Math.min(innerHeight-height-4,y))}px`;
  }
  function mark(scroll=false){if(!popup)return;choices.forEach((b,i)=>b.classList.toggle('keyboard-choice',i===cursor));popup.setAttribute('aria-activedescendant',choices[cursor]?.id||'');if(scroll)choices[cursor]?.scrollIntoView({block:'nearest'});}
  async function choose(id){
    if(busy||!entries.some(e=>e.id===id))return;close(true);busy=true;toggle.disabled=true;
    try{await onSelect(id);}catch(error){onError?.(error);}finally{busy=false;toggle.disabled=!entries.length;}
  }
  function render(){
    if(!popup)return;popup.replaceChildren();choices=entries.map((entry,i)=>{
      const b=button('',()=>choose(entry.id),'scene-picker-option');b.id=`${id}-option-${i}`;b.dataset.sceneId=entry.id;b.tabIndex=-1;b.setAttribute('role','option');b.setAttribute('aria-selected',String(entry.id===current));
      b.append(el('span',String(i+1),'scene-picker-number'),el('span',entry.title,'scene-picker-title'));popup.append(b);return b;
    });cursor=Math.max(0,Math.min(entries.length-1,cursor));mark();position();
  }
  function open(last=false){
    if(busy||!entries.length)return;popup=el('div',null,'scene-picker-menu');popup.id=`${id}-menu`;popup.tabIndex=-1;popup.setAttribute('role','listbox');popup.setAttribute('aria-label',label);document.body.append(popup);
    cursor=Math.max(0,entries.findIndex(e=>e.id===current));if(last)cursor=entries.length-1;toggle.setAttribute('aria-expanded','true');render();popup.focus({preventScroll:true});mark(true);
  }
  // Window capture keeps list navigation ahead of the board's initiative shortcuts.
  window.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.isComposing)return;
    if(e.ctrlKey||e.metaKey||e.altKey){if(popup)e.stopImmediatePropagation();return;}
    if(!popup){if(e.target!==toggle||!['Enter',' ','ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();open(e.key==='ArrowUp');return;}
    if(e.key==='Tab'){close(true);return;}
    if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();e.stopImmediatePropagation();return;}
    if(!['Escape','Enter',' ','ArrowUp','ArrowDown','Home','End'].includes(e.key)&&e.key.length!==1)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Escape'){close(true);return;}if(e.key==='Enter'||e.key===' '){choose(entries[cursor].id);return;}
    if(e.key==='ArrowUp')cursor=(cursor-1+entries.length)%entries.length;
    else if(e.key==='ArrowDown')cursor=(cursor+1)%entries.length;
    else if(e.key==='Home')cursor=0;else if(e.key==='End')cursor=entries.length-1;
    else{const now=performance.now();search=now-searchTime>700?e.key:search+e.key;searchTime=now;const index=entries.findIndex(entry=>entry.title.toLocaleLowerCase().startsWith(search.toLocaleLowerCase()));if(index>=0)cursor=index;}
    mark(true);
  },true);
  document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&!toggle.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
  document.addEventListener('focusin',e=>{if(popup&&!popup.contains(e.target)&&!toggle.contains(e.target))close();});
  document.addEventListener('library-opening',()=>close());document.addEventListener('scroll',position,true);window.addEventListener('resize',position);
  return {element:toggle,update({text,items,selected,title}){caption.textContent=text;entries=items;current=selected;toggle.title=title;toggle.disabled=busy||!entries.length;if(!entries.length)close();else render();},close};
}
