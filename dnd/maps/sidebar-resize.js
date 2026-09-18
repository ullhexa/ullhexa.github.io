// A DM layout preference, independent of encounter state and the player view.
export function setupSidebarResize(){
  const workspace=document.querySelector('.workspace'),panel=document.getElementById('dm-panel');
  const key='ullhexa:dm-sidebar-width';
  const handle=document.createElement('div');handle.id='sidebar-resizer';handle.tabIndex=0;
  handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');
  handle.setAttribute('aria-label','Resize DM sidebar');handle.setAttribute('aria-controls','dm-panel');
  handle.title='Drag to resize · Arrow keys to adjust · Double-click to reset';workspace.append(handle);
  let preferred=null,drag=null;
  try{const stored=Number(localStorage.getItem(key));if(Number.isFinite(stored)&&stored>=220&&stored<=480)preferred=stored;}catch{}
  const defaults=()=>innerWidth<=1150?258:300;
  const maximum=()=>Math.max(220,Math.min(480,innerWidth*.42,innerWidth-540));
  const apply=()=>{
    const width=Math.round(Math.max(220,Math.min(maximum(),preferred??defaults())));
    workspace.style.setProperty('--sidebar-width',`${width}px`);
    handle.setAttribute('aria-valuemin','220');handle.setAttribute('aria-valuemax',String(Math.floor(maximum())));handle.setAttribute('aria-valuenow',String(width));
  };
  const save=()=>{try{preferred===null?localStorage.removeItem(key):localStorage.setItem(key,String(preferred));}catch{}};
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();handle.focus();drag={id:e.pointerId,start:e.clientX,width:panel.getBoundingClientRect().width,previous:preferred};handle.setPointerCapture(e.pointerId);document.body.classList.add('resizing-sidebar');});
  handle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;preferred=Math.max(220,Math.min(maximum(),drag.width+e.clientX-drag.start));apply();});
  const end=e=>{if(!drag||e.pointerId!==drag.id)return;if(e.type==='pointercancel')preferred=drag.previous;drag=null;document.body.classList.remove('resizing-sidebar');apply();save();};
  handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
  handle.addEventListener('dblclick',()=>{preferred=null;apply();save();});
  handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;e.preventDefault();e.stopPropagation();preferred=e.key==='Home'?null:Math.max(220,Math.min(maximum(),panel.getBoundingClientRect().width+(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?30:10)));apply();save();});
  window.addEventListener('resize',apply);apply();
}
