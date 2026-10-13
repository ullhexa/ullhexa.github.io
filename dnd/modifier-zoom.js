import {consumeMapDismissal} from './map-dismissal.js?v=62';

export function createModifierZoom({stage,busy,prepare,pointAt,zoomStep}){
 const onBoard=target=>!!target.closest('#map,#party-overlay,#character-tokens,#shape-handle-overlay,#aura-handles');
 const cursor=event=>stage.classList.toggle('modifier-zoom',!!(event.ctrlKey||event.metaKey)&&!busy());
 const clear=()=>stage.classList.remove('modifier-zoom');
 document.addEventListener('keydown',cursor);
 document.addEventListener('keyup',cursor);
 stage.addEventListener('pointermove',cursor);
 window.addEventListener('blur',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 // Capture before token, fog, ruler and right-pan handlers. Document-level
 // popover dismissal still runs first and consumes its own map gesture.
 stage.addEventListener('pointerdown',event=>{
  if(!(event.ctrlKey||event.metaKey)||![0,2].includes(event.button)||!onBoard(event.target)||busy())return;
  const point=pointAt(event);if(!point||point.some(n=>!Number.isFinite(n)||n<0||n>1))return;
  consumeMapDismissal(event,stage);prepare();cursor(event);
  zoomStep(event.button===0?1:-1,point);
 },true);
}
