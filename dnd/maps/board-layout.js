import {boardIcon} from './control-icons.js?v=60';
import {button,el} from './editor-dom.js?v=60';
export function createBoardLayout(){
  const toolbar=document.querySelector('.map-controls'),extra=el('div',undefined,'toolbar-extra'),inside=el('div',undefined,'toolbar-extra-inner'),core=el('div',undefined,'crucial-controls');extra.id='extra-map-controls';extra.append(inside);
  for(const selector of ['.zoom-controls','.grid-control','.lighting-control','.quick-selections','#map-joystick']){const node=toolbar.querySelector(selector);if(node)inside.append(node);}
  for(const selector of ['.history-controls','.token-mode','.measurement-controls','.fog-controls','#open-dice']){const node=toolbar.querySelector(selector);if(node)core.append(node);}
  let open=false;const handle=button('›',()=>{open=!open;toolbar.classList.toggle('drawer-open',open);extra.inert=!open;handle.textContent=open?'‹':'›';handle.setAttribute('aria-expanded',String(open));handle.setAttribute('aria-label',open?'Hide additional map controls':'Show additional map controls');},'toolbar-drawer-handle');handle.setAttribute('aria-controls',extra.id);handle.setAttribute('aria-expanded','false');handle.setAttribute('aria-label','Show additional map controls');handle.title='Additional map controls';extra.inert=true;toolbar.replaceChildren(extra,handle,core);
  for(const[id,kind,label]of [['undo','undo','Undo'],['redo','redo','Redo'],['show-grid','grid','Grid'],['measure','ruler','Measure'],['mode-party','party','Party'],['mode-players','players','Players']]){const b=document.getElementById(id);b.replaceChildren(boardIcon(kind));b.setAttribute('aria-label',label);b.title=label;b.classList.add('board-icon-control');}
  const identity=document.querySelector('.site-identity'),nav=el('nav',undefined,'header-libraries');nav.setAttribute('aria-label','Game libraries');for(const b of identity.querySelectorAll('.map-picker'))nav.append(b);identity.after(nav);
  const right=el('div',undefined,'map-window-controls'),display=document.getElementById('open-player'),expand=button('',()=>setExpanded(!document.body.classList.contains('map-expanded')),'expand-map');expand.id='expand-map';display.before(right);right.append(expand,display);
  function setExpanded(value){document.body.classList.toggle('map-expanded',value);expand.replaceChildren(boardIcon(value?'collapse':'expand'),el('span',value?'Restore panels':'Expand map'));expand.setAttribute('aria-pressed',String(value));expand.title=value?'Restore control panels':'Expand map';}
  setExpanded(false);
}
