// Layout preferences are independent of encounter state and the player display.
export function setupSidebarResize(){
  const workspace=document.querySelector('.workspace');
  for(const side of ['left','right']){
    const right=side==='right',panel=document.getElementById(right?'initiative-panel':'dm-panel');
    const key=right?'ullhexa:initiative-width':'ullhexa:dm-sidebar-width',property=right?'--initiative-width':'--sidebar-width',min=right?205:220;
    const handle=document.createElement('div');handle.id=right?'initiative-resizer':'sidebar-resizer';handle.tabIndex=0;
    handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label',right?'Resize initiative panel':'Resize DM sidebar');handle.setAttribute('aria-controls',panel.id);
    workspace.append(handle);
    let preferred=null,drag=null;
    try{const stored=Number(localStorage.getItem(key));if(Number.isFinite(stored)&&stored>=min&&stored<=480)preferred=stored;}catch{}
    const defaults=()=>right?(innerWidth<=1150?205:240):(innerWidth<=1150?258:300);
    const maximum=()=>Math.max(min,Math.min(480,innerWidth*.42,innerWidth-540));
    const apply=()=>{const width=Math.round(Math.max(min,Math.min(maximum(),preferred??defaults())));workspace.style.setProperty(property,`${width}px`);handle.setAttribute('aria-valuemin',String(min));handle.setAttribute('aria-valuemax',String(Math.floor(maximum())));handle.setAttribute('aria-valuenow',String(width));};
    const save=()=>{try{preferred===null?localStorage.removeItem(key):localStorage.setItem(key,String(preferred));}catch{}};
    handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();handle.focus();drag={id:e.pointerId,start:e.clientX,width:panel.getBoundingClientRect().width,previous:preferred};handle.setPointerCapture(e.pointerId);document.body.classList.add('resizing-sidebar');});
    handle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;preferred=Math.max(min,Math.min(maximum(),drag.width+(e.clientX-drag.start)*(right?-1:1)));apply();});
    const end=e=>{if(!drag||e.pointerId!==drag.id)return;if(e.type==='pointercancel')preferred=drag.previous;drag=null;document.body.classList.remove('resizing-sidebar');apply();save();};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    handle.addEventListener('dblclick',()=>{preferred=null;apply();save();});
    handle.addEventListener('keydown',e=>{if(!['-','+','=','Home'].includes(e.key))return;e.preventDefault();e.stopPropagation();preferred=e.key==='Home'?null:Math.max(min,Math.min(maximum(),panel.getBoundingClientRect().width+(e.key==='-'?-1:1)*(e.shiftKey?30:10)));apply();save();});
    window.addEventListener('resize',apply);apply();
  }
}
