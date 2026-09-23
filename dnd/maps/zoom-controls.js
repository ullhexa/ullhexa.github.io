import {button,el,label} from './editor-dom.js?v=62';
import {DEFAULT_ZOOM_SETTINGS,normalizeZoomSettings} from './zoom-settings.js?v=82';
import {consumeMapDismissal} from './map-dismissal.js?v=62';
export function createZoomControls({preferences,onChange}){
 const toggle=document.getElementById('zoom-value'),stage=document.getElementById('map-stage');let popup=null;
 function close(){popup?.remove();popup=null;toggle.setAttribute('aria-expanded','false');}
 function position(){if(!popup)return;const r=toggle.getBoundingClientRect();popup.style.left=`${Math.max(4,Math.min(innerWidth-popup.offsetWidth-4,r.left))}px`;popup.style.top=`${Math.max(4,Math.min(innerHeight-popup.offsetHeight-4,r.bottom+8))}px`;}
 function open(){document.dispatchEvent(new Event('map-menu-opening'));popup=el('div',null,'grid-options zoom-options');popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Zoom settings');
  const fields={};const settings=preferences.getZoom();popup.append(el('div','Overview · 100%','zoom-overview'));
  for(const [key,title,min,max,multiplier]of [['maximum','Maximum zoom (%)',100,2000,100],['wheel','Wheel sensitivity (%)',10,400,1],['step','Button increment (%)',1,100,1]]){const input=el('input');input.type='number';input.step=1;input.min=min;input.max=max;input.value=Math.round(settings[key]*multiplier);input.setAttribute('aria-label',title);fields[key]=input;input.addEventListener('change',()=>{const next=normalizeZoomSettings({...preferences.getZoom(),[key]:input.value===''?DEFAULT_ZOOM_SETTINGS[key]:Number(input.value)/multiplier});preferences.setZoom(next);input.value=Math.round(next[key]*multiplier);onChange(next);});popup.append(label(title,input));}
  popup.append(button('Reset',()=>{const next={...DEFAULT_ZOOM_SETTINGS};preferences.setZoom(next);fields.maximum.value=300;fields.wheel.value=100;fields.step.value=25;onChange(next);},'quiet'));document.body.append(popup);toggle.setAttribute('aria-expanded','true');position();
 }
 toggle.addEventListener('click',()=>popup?close():open());
 document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&!toggle.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
 document.addEventListener('keydown',e=>{if(popup&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();toggle.focus({preventScroll:true});}},true);
 document.addEventListener('library-opening',close);document.addEventListener('map-menu-opening',close);window.addEventListener('resize',position);document.addEventListener('scroll',position,true);
 return {close};
}
