import { setupFullscreen } from './fullscreen.js?v=14';
import { STORY_SCENES, createStoryAnimation } from './story-scenes.js?v=14';
import { validPresentation, sceneCanShow } from './presentation-state.js?v=14';
const $=id=>document.getElementById(id);
const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};

export async function startPlayerDisplay(){
  const query=new URLSearchParams(location.search),session=query.get('session');
  if(!session||!/^[-a-zA-Z0-9]{1,80}$/.test(session))throw new Error('Open this player display using the button in the DM window.');
  const sessionKey=`lanternford:session:${session}`,playerId=crypto.randomUUID();
  document.body.classList.add('player-mode','player-shell');
  for(const id of ['dm-panel','open-maps','map-dialog','save-controls','load-game-file','save-game-dialog','save-error-dialog'])$(id)?.remove();
  $('map').remove();document.querySelector('.map-controls').remove();
  $('view-label').textContent='PLAYER DISPLAY';$('gesture-hint').textContent='View follows the DM';
  const stage=$('map-stage'),loading=$('map-loading');
  const canvas=document.createElement('canvas');canvas.id='story-screen';canvas.className='story-screen';canvas.setAttribute('aria-label','Abstract storytelling atmosphere');stage.append(canvas);
  const animation=createStoryAnimation(canvas);
  const fullscreen=setupFullscreen({player:true,announce:text=>$('live-message').textContent=text});
  const response=await fetch('./maps/catalog.json?v=14');if(!response.ok)throw new Error('The map library could not load. Reload to try again.');
  const catalog=(await response.json()).maps;
  const stored=read(`${sessionKey}:presentation`);
  const initialMap=catalog.find(entry=>entry.id===query.get('map'))||catalog[0];
  let presentation=validPresentation(stored,catalog)?stored:{mode:'battle',vibe:'embers',mapId:initialMap.id,revision:0,sceneRevision:0};
  let current=null,pending=null,lastDM=0,closing=false,showingStory=true;
  let channel;try{channel=new BroadcastChannel(sessionKey);}catch{}
  const send=message=>{channel?.postMessage(message);try{localStorage.setItem(`${sessionKey}:signal`,JSON.stringify({...message,nonce:crypto.randomUUID()}));}catch{}};
  function update(){
    const target=pending||current;
    const showMap=sceneCanShow(presentation,target);
    if(showMap&&pending){current?.frame.remove();current=pending;pending=null;current.frame.classList.add('is-current');}
    if(presentation.mode==='story')showingStory=true;else if(showMap)showingStory=false;
    const storytelling=showingStory;
    stage.classList.toggle('is-storytelling',storytelling);stage.dataset.displayMode=presentation.mode;stage.dataset.mapId=current?.mapId||'';
    if(storytelling){animation.set(presentation.vibe);animation.start();}else animation.stop();
    canvas.setAttribute('aria-hidden',!storytelling);
    for(const scene of [current,pending].filter(Boolean)){scene.frame.setAttribute('aria-hidden',storytelling||scene!==current);scene.frame.tabIndex=-1;}
    loading.hidden=presentation.mode==='story'||!!current||showMap;
    const entry=catalog.find(entry=>entry.id===presentation.mapId),vibe=STORY_SCENES.find(scene=>scene.id===presentation.vibe);
    document.querySelector('.map-caption').hidden=storytelling;
    $('map-identity').textContent=storytelling?'STORYTELLING':entry.identity;
    document.querySelector('.map-name').textContent=storytelling?vibe.title:entry.title;
    document.title=`${storytelling?vibe.title:entry.title} — Player display`;
    $('live-message').textContent=storytelling?'The story continues.':'Explore the map. The DM controls what appears here.';
  }
  function prepare(){
    if(current?.mapId===presentation.mapId){pending?.frame.remove();pending=null;update();return;}
    if(pending?.mapId===presentation.mapId){update();return;}
    pending?.frame.remove();
    const frame=document.createElement('iframe');frame.className='player-scene';frame.title='Battle map';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
    const url=new URL(location.href);url.search=new URLSearchParams({view:'player',scene:'1',session,map:presentation.mapId,build:'14'}).toString();frame.src=url;
    pending={frame,mapId:presentation.mapId,revision:-1,ready:false};stage.prepend(frame);update();
  }
  function receive(message){
    if(!message||typeof message!=='object')return;
    if(message.type==='close-player'){
      closing=true;send({type:'bye',playerId});window.close();
      // Some manually opened tabs cannot be closed by script; keep their state honest.
      setTimeout(()=>{closing=false;send({type:'hello',playerId});send({type:'close-blocked'});},500);return;
    }
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
  window.addEventListener('pagehide',()=>{closing=true;send({type:'bye',playerId});clearInterval(timer);animation.destroy();channel?.close();},{once:true});
  prepare();send({type:'hello',playerId});
}
