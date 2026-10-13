const pending=new WeakMap();
// Closing a map popover consumes the whole pointer gesture, including the
// synthetic click/double-click that browsers emit after pointerup.
export function consumeMapDismissal(event,stage){
  if(!stage.contains(event.target))return false;
  event.preventDefault();event.stopImmediatePropagation();
  const doc=stage.ownerDocument;pending.get(doc)?.();
  const block=e=>{e.preventDefault();e.stopImmediatePropagation();};
  const cleanup=()=>{doc.removeEventListener('click',block,true);doc.removeEventListener('dblclick',block,true);doc.removeEventListener('pointerdown',next,true);doc.removeEventListener('pointercancel',cleanup,true);doc.removeEventListener('keydown',cleanup,true);pending.delete(doc);};
  const next=e=>{if(e!==event)cleanup();};
  pending.set(doc,cleanup);
  doc.addEventListener('click',block,true);doc.addEventListener('dblclick',block,true);doc.addEventListener('pointerdown',next,true);doc.addEventListener('pointercancel',cleanup,true);doc.addEventListener('keydown',cleanup,true);
  return true;
}
