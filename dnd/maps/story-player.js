import {createStoryAnimation} from './story-scenes.js?v=55';
import {assetURL,assetRecord} from './local-assets.js?v=55';
import {loadRaster} from './resource-loading.js?v=55';

export const STORY_FADE_MS=3000;
export const MODE_FADE_MS=3000;
export function createStoryPlayer(container,{onError=()=>{}}={}){
  let current=null,retiring=null,request=0,requested=null,running=false,stopTimer=0,retireTimer=0;
  const dispose=layer=>{layer?.animation?.destroy();layer?.element.remove();};
  async function set(scene){
    if(!scene)return;const key=`${scene.id}:${scene.asset||''}`;if(requested===key)return;
    requested=key;const version=++request;
    try{
      let element,animation;
      if(scene.asset){element=await loadRaster(await assetURL(scene.asset));element.alt=scene.title;const framing=(await assetRecord(scene.asset))?.framing;if(framing)element.style.transform=`translate(${framing.x*100}%,${framing.y*100}%) scale(${framing.zoom})`;}
      else{element=document.createElement('canvas');element.setAttribute('aria-label',scene.title);animation=createStoryAnimation(element);}
      if(version!==request){animation?.destroy();return;}
      clearTimeout(retireTimer);dispose(retiring);retiring=current;
      current={element,animation};element.dataset.story=scene.id;
      container.prepend(element);animation?.set(scene.id);if(running)animation?.start();
      container.dataset.scene=scene.id;
      if(retiring){retiring.element.classList.add('story-retiring');retireTimer=setTimeout(()=>{dispose(retiring);retiring=null;},STORY_FADE_MS);}
    }catch(error){if(version===request){requested=null;onError(error);}}
  }
  return {set,start(){clearTimeout(stopTimer);running=true;current?.animation?.start();retiring?.animation?.start();},stop(delay=0){clearTimeout(stopTimer);stopTimer=setTimeout(()=>{running=false;current?.animation?.stop();retiring?.animation?.stop();},delay);},destroy(){++request;clearTimeout(stopTimer);clearTimeout(retireTimer);dispose(current);dispose(retiring);}};
}
