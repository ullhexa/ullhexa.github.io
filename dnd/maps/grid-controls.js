import {boardIcon} from './control-icons.js?v=81';
import {button,el} from './combat-ui.js?v=81';
import {consumeMapDismissal} from './map-dismissal.js?v=62';

import {GRID_COLORS,MAX_GRID_THICKNESS,gridColor} from './grid-state.js?v=62';

export function createGridControls({map,getState,commit}){
  const grid=document.getElementById('show-grid'),lock=document.getElementById('snap-grid'),swatch=document.getElementById('grid-options-toggle'),stage=document.getElementById('map-stage');
  lock.classList.add('board-icon-control');
  let popup=null,colors=[],minus,plus,value;
  const apply=patch=>commit({...getState(),...patch},'',false);
  function close(){popup?.remove();popup=null;colors=[];swatch.setAttribute('aria-expanded','false');}
  function position(){if(!popup)return;const r=swatch.getBoundingClientRect();popup.style.left=`${Math.max(4,Math.min(innerWidth-popup.offsetWidth-4,r.left+r.width/2-popup.offsetWidth/2))}px`;popup.style.top=`${Math.max(4,Math.min(innerHeight-popup.offsetHeight-4,r.bottom+8))}px`;}
  function render(){const s=getState();grid.setAttribute('aria-pressed',String(s.grid));lock.setAttribute('aria-pressed',String(s.snap));if(lock.dataset.icon!==String(s.snap)){lock.dataset.icon=String(s.snap);lock.replaceChildren(boardIcon(s.snap?'locked':'unlocked'));lock.setAttribute('aria-label','Lock');}swatch.style.setProperty('--grid-color',gridColor(map,s.gridColor));if(!popup)return;for(const b of colors)b.setAttribute('aria-pressed',String(b.dataset.gridColor===s.gridColor));value.value=s.gridThickness;minus.disabled=s.gridThickness<=1;plus.disabled=s.gridThickness>=MAX_GRID_THICKNESS;}
  function open(){
    document.dispatchEvent(new Event('map-menu-opening'));
    popup=el('div',null,'grid-options');popup.id='grid-options';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Grid options');
    const palette=el('div',null,'grid-options-colors'),names=['Map color','Black','White','Blue','Brown','Red','Orange','Green','Purple'];
    colors=GRID_COLORS.map((color,i)=>{const b=button('',()=>apply({gridColor:color}),'color-swatch');b.dataset.gridColor=color;b.style.backgroundColor=gridColor(map,color);b.setAttribute('aria-label',`${names[i]} grid`);palette.append(b);return b;});
    const stepper=el('div',null,'grid-thickness');stepper.setAttribute('role','group');stepper.setAttribute('aria-label','Grid line thickness');
    minus=button('−',()=>apply({gridThickness:Math.max(1,getState().gridThickness-1)}));minus.setAttribute('aria-label','Thinner grid');
    value=el('output');value.setAttribute('aria-label','Grid line thickness');value.setAttribute('aria-live','polite');
    plus=button('+',()=>apply({gridThickness:Math.min(MAX_GRID_THICKNESS,getState().gridThickness+1)}));plus.setAttribute('aria-label','Thicker grid');
    stepper.append(minus,value,plus);popup.append(palette,stepper);document.body.append(popup);swatch.setAttribute('aria-expanded','true');render();position();
  }
  grid.addEventListener('click',()=>apply({grid:!getState().grid}));lock.addEventListener('click',()=>commit({...getState(),snap:!getState().snap},'Grid lock updated.'));
  swatch.addEventListener('click',()=>popup?close():open());
  document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&!swatch.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
  document.addEventListener('keydown',e=>{if(popup&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();swatch.focus({preventScroll:true});}},true);
  document.addEventListener('library-opening',close);window.addEventListener('resize',position);document.addEventListener('scroll',position,true);
  return {render,close};
}
