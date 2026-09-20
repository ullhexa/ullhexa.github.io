import { openPlayerWindow } from './display-window.js?v=36';

// This outer document never navigates when a prepared map changes. Menus live
// inside its child document, so they do not replace the native fullscreen layer.
export function startDMShell(){
  const frame=document.createElement('iframe');frame.id='dm-workspace';frame.title='DM control center';frame.allow='fullscreen';
  const url=new URL(location.href);url.searchParams.set('dm-frame','1');frame.src=url;
  document.body.className='dm-shell';document.body.replaceChildren(frame);
  let playerWindow=null;
  const updateFullscreen=()=>frame.contentWindow?.postMessage({type:'dm-fullscreen',active:!!document.fullscreenElement},location.origin);
  window.ullhexaDM={
    get playerWindow(){return playerWindow?.closed?null:playerWindow;},
    get fullscreen(){return !!document.fullscreenElement;},
    async toggleFullscreen(){
      if(document.fullscreenElement)await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      updateFullscreen();
    },
    openPlayer(url){playerWindow=openPlayerWindow(url);return playerWindow;}
  };
  document.addEventListener('fullscreenchange',updateFullscreen);
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
    if(event.data?.type==='dm-ready'){
      const url=new URL(event.data.url,location.href);
      if(url.origin!==location.origin||url.pathname!==location.pathname)return;
      url.searchParams.delete('dm-frame');history.replaceState(null,'',url);
      document.title=event.data.title;updateFullscreen();
    }
  });
}
