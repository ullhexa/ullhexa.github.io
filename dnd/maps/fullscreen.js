const $=id=>document.getElementById(id);
const svgNode=(tag,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);return el;};

export function setupFullscreen({player,announce}) {
  const fullscreenTarget=player ? $('map-stage') : document.documentElement;
  $('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await fullscreenTarget.requestFullscreen(); }
    catch { announce('Full screen could not open. Please try again in a browser that supports full screen.'); }
  });
  let exitFullscreen=$('exit-player-fullscreen');
  // A cached pre-fullscreen page can load this newer script without the button.
  if(player&&!exitFullscreen){
    exitFullscreen=document.createElement('button');
    exitFullscreen.id='exit-player-fullscreen';
    exitFullscreen.className='fullscreen-exit';
    exitFullscreen.type='button';
    exitFullscreen.setAttribute('aria-label','Exit full screen');
    exitFullscreen.title='Exit full screen';
    const icon=svgNode('svg',{viewBox:'0 0 24 24',width:22,height:22,fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':true});
    icon.append(svgNode('path',{d:'M8 3v5H3m18 0h-5V3M3 16h5v5m8 0v-5h5'}));
    exitFullscreen.append(icon);
    fullscreenTarget.prepend(exitFullscreen);
  }
  let fullscreenControlsTimer,wasPlayerFullscreen=false;
  const hideFullscreenControls=()=>{
    clearTimeout(fullscreenControlsTimer);
    $('map-stage').classList.remove('fullscreen-controls-visible');
  };
  const showFullscreenControls=()=>{
      if(document.fullscreenElement!==fullscreenTarget)return;
      clearTimeout(fullscreenControlsTimer);
      fullscreenTarget.classList.add('fullscreen-controls-visible');
      fullscreenControlsTimer=setTimeout(hideFullscreenControls,1800);
  };
  if(player){
    fullscreenTarget.addEventListener('pointermove',showFullscreenControls);
    fullscreenTarget.addEventListener('pointerdown',showFullscreenControls);
    fullscreenTarget.addEventListener('pointerleave',hideFullscreenControls);
    exitFullscreen.addEventListener('click',async()=>{
      if(document.fullscreenElement)await document.exitFullscreen();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&document.fullscreenElement===fullscreenTarget){
        document.exitFullscreen().catch(()=>{ /* The browser may already be leaving fullscreen. */ });
      }
    });
  } else exitFullscreen?.remove();
  document.addEventListener('fullscreenchange',()=>{
    $('fullscreen').textContent=document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    hideFullscreenControls();
    const active=player&&document.fullscreenElement===fullscreenTarget;
    if(wasPlayerFullscreen&&!active)$('fullscreen').focus({preventScroll:true});
    wasPlayerFullscreen=active;
  });
  return {showControls:showFullscreenControls};
}
