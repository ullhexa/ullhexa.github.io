import {configureSession,readSessionValue} from './session-storage.js?v=34';
import {customCatalog} from './custom-maps.js?v=34';
import { setupFullscreen } from './fullscreen.js?v=34';
import {storyCatalog} from './story-assets.js?v=34';
import {createStoryPlayer,MODE_FADE_MS} from './story-player.js?v=34';
import {fetchJSON} from './resource-loading.js?v=34';
import { validPresentation, sceneCanShow } from './presentation-state.js?v=34';
const $=id=>document.getElementById(id);
const read=readSessionValue;

export async function startPlayerDisplay(){
  const query=new URLSearchParams(location.search),session=query.get('session');
  if(!session||!/^[-a-zA-Z0-9]{1,80}$/.test(session))throw new Error('Open this player display using the button in the DM window.');
  await configureSession(session,{player:true});
  const sessionKey=`lanternford:session:${session}`,playerId=crypto.randomUUID();
  document.body.classList.add('player-mode','player-shell');
  for(const id of ['dm-panel','open-maps','map-dialog','save-controls','load-game-file','save-game-dialog','save-error-dialog'])$(id)?.remove();
  $('map').remove();document.querySelector('.map-controls').remove();
  $('view-label').textContent='PLAYER DISPLAY';$('gesture-hint').textContent='View follows the DM';
  const stage=$('map-stage'),loading=$('map-loading');
  const canvas=document.createElement('div');canvas.id='story-screen';canvas.className='story-screen';canvas.setAttribute('aria-label','Story scene');stage.append(canvas);
  const animation=createStoryPlayer(canvas,{onError:error=>{send({type:'display-error',message:error.message});$('live-message').textContent=error.message;}});
  const fullscreen=setupFullscreen({player:true,announce:text=>$('live-message').textContent=text});
  const catalog=(await fetchJSON('./maps/catalog.json?v=34')).maps;
  catalog.push(...customCatalog(sessionKey));
  const stored=read(`${sessionKey}:presentation`);
  const initialMap=catalog.find(entry=>entry.id===query.get('map'))||catalog[0];
  let presentation=validPresentation(stored,catalog)?stored:{mode:'battle',vibe:'embers',mapId:initialMap.id,revision:0,sceneRevision:0};
  let current=null,pending=null,lastDM=0,closing=false,showingStory=true,hideMapTimer=0,retiringMap=null,retireMapTimer=0;
  let channel;try{channel=new BroadcastChannel(sessionKey);}catch{}
  const send=message=>{if(window.ullhexaResetting)return;if(channel){channel.postMessage(message);return;}try{localStorage.setItem(`${sessionKey}:signal`,JSON.stringify({...message,nonce:crypto.randomUUID()}));}catch{}};
  function update(){
    const target=pending||current;
    const showMap=sceneCanShow(presentation,target);
    if(showMap&&pending){clearTimeout(retireMapTimer);retiringMap?.frame.remove();retiringMap=current;current=pending;pending=null;current.frame.classList.add('is-current');if(retiringMap){retiringMap.frame.setAttribute('aria-hidden','true');retiringMap.frame.classList.add('scene-retiring');retireMapTimer=setTimeout(()=>{retiringMap?.frame.remove();retiringMap=null;},MODE_FADE_MS);}}
    if(presentation.mode==='story')showingStory=true;else if(showMap)showingStory=false;
    // The prepared map stays hidden behind the fully opaque story layer.
    // Visibility changes only after the fade to Story finishes.
    if(presentation.mode==='story'){if(!hideMapTimer)hideMapTimer=setTimeout(()=>{hideMapTimer=0;if(presentation.mode==='story')stage.classList.add('story-map-hidden');},MODE_FADE_MS);}else if(showMap){clearTimeout(hideMapTimer);hideMapTimer=0;stage.classList.remove('story-map-hidden');}
    const storytelling=showingStory;
    stage.classList.toggle('is-storytelling',storytelling);stage.dataset.displayMode=presentation.mode;stage.dataset.mapId=current?.mapId||'';
    if(storytelling){animation.set(storyCatalog({storyAssets:[presentation.storyAsset]}).find(s=>s.id===presentation.vibe));animation.start();}else animation.stop(MODE_FADE_MS);
    canvas.setAttribute('aria-hidden',!storytelling);
    for(const scene of [current,pending].filter(Boolean)){scene.frame.setAttribute('aria-hidden',storytelling||scene!==current);scene.frame.tabIndex=-1;}
    loading.hidden=presentation.mode==='story'||!!current||showMap;
    const entry=catalog.find(entry=>entry.id===presentation.mapId),vibe=storyCatalog({storyAssets:[presentation.storyAsset]}).find(scene=>scene.id===presentation.vibe);
    document.querySelector('.map-caption').hidden=storytelling;
    $('map-identity').textContent=storytelling?'STORY':entry.identity;
    document.querySelector('.map-name').textContent=storytelling?vibe.title:entry.title;
    document.title=`${storytelling?vibe.title:entry.title} — Player display`;
    $('live-message').textContent=storytelling?'The story continues.':'Explore the map. The DM controls what appears here.';
  }
  function prepare(){
    if(current?.mapId===presentation.mapId&&current.content===(presentation.mapContent||'')){pending?.frame.remove();pending=null;update();return;}
    if(pending?.mapId===presentation.mapId&&pending.content===(presentation.mapContent||'')){update();return;}
    pending?.frame.remove();
    const frame=document.createElement('iframe');frame.className='player-scene';frame.title='Battle map';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
    const url=new URL(location.href);url.search=new URLSearchParams({view:'player',scene:'1',session,map:presentation.mapId,build:'34'}).toString();frame.src=url;
    pending={frame,mapId:presentation.mapId,content:presentation.mapContent||'',revision:-1,ready:false};stage.prepend(frame);update();
  }
  async function closeDisplay(){
    if(closing)return;
    // Never close a manually opened tab, an embedded frame, or the DM window.
    if(query.get('popup')!=='1'||window.top!==window||!window.opener){send({type:'close-blocked'});return;}
    closing=true;
    try{if(document.fullscreenElement)await document.exitFullscreen();}catch{}
    send({type:'bye',playerId});window.close();
    setTimeout(()=>{closing=false;send({type:'hello',playerId});send({type:'close-blocked'});},500);
  }
  function receive(message){
    if(!message||typeof message!=='object')return;
    if(message.type==='close-player'){void closeDisplay();return;}
    if(message.type==='presentation'){for(const entry of customCatalog(sessionKey)){const i=catalog.findIndex(m=>m.id===entry.id);if(i<0)catalog.push(entry);else catalog[i]=entry;}}
    if(message.type==='presentation'&&validPresentation(message.presentation,catalog)){
      lastDM=Date.now();
      if(message.presentation.revision<=presentation.revision)return;
      presentation=message.presentation;prepare();
    }
  }
  if(channel)channel.onmessage=event=>receive(event.data);
  window.addEventListener('storage',event=>{if(event.key===`${sessionKey}:signal`&&event.newValue){try{receive(JSON.parse(event.newValue));}catch{}}});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const scene=[pending,current].find(scene=>scene&&event.source===scene.frame.contentWindow);if(!scene)return;
    const message=event.data;
    if(message?.type==='scene-ready'&&message.mapId===scene.mapId&&Number.isSafeInteger(message.revision)){
      scene.ready=true;scene.revision=message.revision;update();
    } else if(message?.type==='player-activity')fullscreen.showControls();
    else if(message?.type==='player-escape'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    else if(message?.type==='scene-error'){$('live-message').textContent='This map could not load. The previous scene is kept.';send({type:'display-error',message:'The player map could not load. Reopen the player display to retry.'});}
  });
  const timer=setInterval(()=>{if(!closing)send({type:'hello',playerId});$('connection-status').textContent=Date.now()-lastDM<7000?'Following the DM':'DM disconnected · last scene kept';},1500);
  window.addEventListener('pagehide',event=>{closing=true;send({type:'bye',playerId});if(event.persisted){animation.stop();return;}clearInterval(timer);clearTimeout(hideMapTimer);clearTimeout(retireMapTimer);animation.destroy();channel?.close();});
  window.addEventListener('pageshow',event=>{if(event.persisted){closing=false;lastDM=0;update();send({type:'hello',playerId});}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!closing)send({type:'hello',playerId});});
  prepare();send({type:'hello',playerId});
}
