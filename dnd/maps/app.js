import {createBoardLayout} from './board-layout.js?v=62';
import {featureEnabled,placeName} from './board-state.js?v=62';
import {createGridControls} from './grid-controls.js?v=62';
import {gridColor} from './grid-state.js?v=62';
import {createBuildingControls} from './building-controls.js?v=62';
import {buildingCollapsed} from './building-state.js?v=62';
import {createCameraAnimation} from './camera-animation.js?v=62';
import {createMapNavigation} from './map-navigation.js?v=62';
import {createFloorControl} from './floor-controls.js?v=62';
import {createUserManual} from './user-manual.js?v=62';
import {createSpellLibrary} from './spell-library.js?v=62';
import {createReferenceViewers} from './reference-viewers.js?v=62';
import {configureSession,readSessionValue,writeSessionValue,autoSaveEnabled,setAutoSave} from './session-storage.js?v=62';
import {persistAssets} from './local-assets.js?v=62';
import {createScenery} from './scenery.js?v=62';
import {consumeMapDismissal} from './map-dismissal.js?v=62';
import {buildingFocusCamera} from './building-focus.js?v=62';
import {createDisplayPresence} from './display-presence.js?v=62';
import {boundedCamera,cameraViewBox,cameraGeometry} from './camera.js?v=62';
import {listenForBoardReset,confirmInitializeControlBoard,initializeControlBoard} from './board-reset.js?v=62';
import {createDiceTools} from './dice.js?v=62';
import {fetchJSON,loadRaster} from './resource-loading.js?v=62';
import {storyCatalog,nextStory} from './story-assets.js?v=62';
import {createItemsUI} from './items-ui.js?v=62';
import {floorList,selectedFloor,selectFloor,interactionOnFloor} from './floors.js?v=62';
import {createHistory} from './history.js?v=62';
import {setupSidebarResize} from './sidebar-resize.js?v=62';
import {syncCampaign,normalizeCampaign,mapTokens,combatants,snapPoint} from './combat-state.js?v=62';
import {createCombatUI,createLibraries} from './combat-ui.js?v=62';
import {createFogTools} from './fog-tools.js?v=62';
import {normalizeFog} from './fog-state.js?v=62';
import {customCatalog,saveCustomCatalog,createMapUpload,resolveMapArt,mapContentKey} from './custom-maps.js?v=62';
import {createSessionBundle} from './session-bundle.js?v=62';
import { startDMShell } from './dm-shell.js?v=62';
import { openPlayerWindow } from './display-window.js?v=62';
import { validateMap, initialState, sanitizeState, isVisible, toggleInteraction, distanceBetween } from './state.js?v=62';
import { createEncounterTools } from './encounter-tools.js?v=62';
import { playerProjection, formation, moveParty } from './encounter-state.js?v=62';
import { createMapMenu } from './map-menu.js?v=62';
import { createSaveControls } from './save-controls.js?v=62';
import { parseSave, restoreSave } from './save-file.js?v=62';
import { createLighting } from './lighting.js?v=62';
import { setupFullscreen } from './fullscreen.js?v=62';
import { startPlayerDisplay } from './player-display.js?v=62';
import { createDirector } from './director.js?v=62';
import { normalizeProject } from './presentation-state.js?v=62';

listenForBoardReset();
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const query = new URLSearchParams(location.search);
const player = query.get('view') === 'player';
const embedded = player && query.get('scene') === '1';
const dmFrame=!player&&query.get('dm-frame')==='1'&&window.parent!==window;
const dmHost=dmFrame?window.parent.ullhexaDM:null;
const headerObserver=new ResizeObserver(entries=>document.documentElement.style.setProperty('--topbar-height',`${entries[0].target.getBoundingClientRect().height}px`));
headerObserver.observe(document.querySelector('.topbar'));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const svgNode = (tag, attrs = {}, text) => {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
};
const readStored=readSessionValue;
const writeStored=writeSessionValue;

async function start() {
  document.body.classList.toggle('player-mode', player);
  document.body.classList.toggle('embedded-scene',embedded);
  if (player) {
    $('dm-panel').remove();
    $('open-maps').remove();
    $('map-dialog').remove();
    for(const id of ['save-controls','load-game-file','save-game-dialog','save-error-dialog'])$(id).remove();
    $('view-label').textContent = 'PLAYER DISPLAY';
    $('gesture-hint').textContent = 'View follows the DM';
    $('live-message').textContent = 'Waiting for the DM…';
    $('map').setAttribute('aria-label', 'Player encounter map');
  }
  const catalog = (await fetchJSON('./maps/catalog.json?v=45')).maps;
  const remembered = readStored('lanternford:last-session');
  const session = query.get('session') || (player ? null : (typeof remembered === 'string' ? remembered : crypto.randomUUID()));
  if (!session || !/^[a-zA-Z0-9-]{1,80}$/.test(session)) throw new Error('Open this player display using the button in the DM window.');
  await configureSession(session,{player});
  if(!player)$('auto-save').checked=autoSaveEnabled();
  if (!player && !query.has('session')) writeStored('lanternford:last-session', session);
  const sessionKey = `lanternford:session:${session}`;
  catalog.push(...customCatalog(sessionKey));
  const pendingLoadKey = `${sessionKey}:pending-load`;
  const selectedMap = query.get('map') || readStored(`${sessionKey}:map`);
  const entry = catalog.find(item => item.id === selectedMap) || catalog[0];
  const loadMap = async item => {
    const content=validateMap(item.map||await fetchJSON(`${item.manifest}?v=45`));
    if(content.id!==item.id)throw new Error('The map catalog and content do not match.');
    return content;
  };
  const map = await loadMap(entry);
  const artwork=await resolveMapArt(map);
  let mapMenu,combat,itemsUI,fog,tool=null;
  let project=normalizeProject(readStored(`${sessionKey}:project`),catalog,map.id);
  let director,playerWindow=dmHost?.playerWindow||null,runtimeReady=false,sceneReady=false;
  const presence=createDisplayPresence();
  const storedRevision=readStored(`${sessionKey}:presentation`)?.revision;
  let presentationRevision=Number.isSafeInteger(storedRevision)&&storedRevision>=0?storedRevision:0;
  const setProject=next=>{project=normalizeProject(next,catalog,map.id);writeStored(`${sessionKey}:project`,project);director?.render();publish();};
  async function removeCustomMap(id){
    const entry=catalog.find(e=>e.id===id);if(!entry?.map?.userMap)return;
    saveCustomCatalog(sessionKey,customCatalog(sessionKey).filter(e=>e.id!==id));catalog.splice(catalog.indexOf(entry),1);
    const fallback=catalog[0].id,next={...project,maps:project.maps.filter(v=>v!==id),mapGroups:project.mapGroups.map(g=>({...g,entries:g.entries.filter(v=>v!==id)}))};
    project=normalizeProject(next,catalog,id===map.id?fallback:map.id);writeStored(`${sessionKey}:project`,project);director?.render();
    if(id===map.id)await prepareMap(fallback);else publish();
  }
  async function applyMapEdit(next){
    if(next.id===map.id)save();
    saveCustomCatalog(sessionKey,customCatalog(sessionKey).map(e=>e.id===next.id?next:e));
    catalog.splice(catalog.findIndex(e=>e.id===next.id),1,next);director?.render();
    if(next.id===map.id)location.reload();
  }
  async function prepareMap(id,environment){
    const target=id===map.id?map:await loadMap(catalog.find(entry=>entry.id===id));
    if(!project.maps.includes(id))setProject({...project,maps:[...project.maps,id]});
    if(id===map.id){
      if(environment&&environment.darkness!==state.environment.darkness)commit({...state,environment},`Map darkness: ${environment.darkness}%.`);
      else announce(`${map.title} is ready. Your encounter progress is kept.`);
      return;
    }
    save();const next=readMapState(target);
    if(environment)writeStored(`lanternford:${target.id}:${target.version}:${session}`,{...next,environment,revision:next.revision+1});
    const url=new URL(location.href);url.searchParams.set('map',id);location.assign(url);
  }
  if(player){
    $('map-identity').textContent = entry.identity || map.title;
    document.querySelector('.edition').textContent = entry.edition || 'FIELD TEST';
  }
  if(dmFrame)document.querySelector('.brand').href='./?dm-frame=1';
  document.title = player ? `${map.title} — Player display` : 'Ull Hexa D&D';
  document.querySelector('.map-name').textContent = map.title;
  $('map').setAttribute('aria-label', `${player ? 'Player' : 'Interactive'} map of ${map.title}`);
  $('map').querySelector('title').textContent = `${map.title} encounter map`;
  if(!player) {
    mapMenu=createMapMenu({catalog,activeId:map.id,activeMap:map,loadMap,getEnvironment:target=>target.id===map.id?state.environment:readMapState(target).environment,getProject:()=>project,setProject,deleteMap:removeCustomMap,editMap:applyMapEdit,applyMap:(target,environment)=>prepareMap(target.id,environment).catch(error=>announce(error.message))});
  }
  const key = `lanternford:${map.id}:${map.version}:${session}`;
  function readMapState(content){
    const previous=readStored(`lanternford:${content.id}:${content.version}:${session}`)||[...(content.previousVersions||[])].sort((a,b)=>b.localeCompare(a,undefined,{numeric:true})).map(version=>readStored(`lanternford:${content.id}:${version}:${session}`)).find(Boolean);
    let next=sanitizeState(content,previous);
    if(!player){
      const campaign=normalizeCampaign(readStored(`${sessionKey}:campaign`)||next.campaign,next.roster);
      const savedMembers=[...(next.roster||[]),...(next.monsters||[]),...(next.items||[]),...(next.campaign?.parties||[]).flatMap(g=>g.members),...(next.campaign?.encounters||[]).flatMap(g=>g.members),...(next.campaign?.itemLists||[]).flatMap(g=>g.members)];
      const points=formation(content,next.party,60);
      for(const kind of ['parties','encounters'])campaign[kind]=campaign[kind].map(g=>({...g,members:g.members.map((m,i)=>({...m,position:savedMembers.find(p=>p.id===m.id)?.position||points[i]||content.partyStart}))}));
      next={...next,campaign,roster:campaign.parties.find(g=>g.id===campaign.activeParty)?.members||[],items:next.items||[],monsters:campaign.encounters.find(g=>g.id===campaign.activeEncounter)?.members||[]};
    }
    return syncCampaign(next);
  }
  let state = readMapState(map);
  if (player) state = playerProjection(state);
  let selected = map.places[0]?.id||null;
  let focusedPlace=null,buildingUI,privatePreview=null,pendingCameraDuration=0;
  const history=createHistory();
  const currentHistory=()=>privatePreview?.history||history;
  let lastPeer = 0;
  let ruler = [];
  let measuring = false;
  let drag = null;
  let zoomSave,partyFrame=0,cameraFrame=0,wheelFrame=0,wheelDelta=0,wheelPoint=null;
  function paintParty(){partyFrame=0;const[x,y]=xy(state.party);party.setAttribute('transform',`translate(${x} ${y})`);encounter.renderPartyPosition();livePositions();}
  let storageWorks = true;
  let channel;
  try { channel = new BroadcastChannel(sessionKey); } catch { /* Storage events also synchronize windows. */ }
  const send = (value,publicSnapshot=false) => { if(!publicSnapshot&&privatePreview&&['camera','positions','fog-preview','ruler'].includes(value.type))return;if(channel)channel.postMessage(value);else writeStored(`${sessionKey}:signal`, { ...value, nonce: crypto.randomUUID() }); };
  const announce = text => { $('live-message').textContent = text; };
  const xy = point => [point[0] * map.width, point[1] * map.height];
  const polygon = points => points.map(point => xy(point).join(',')).join(' ');
  const defs = $('map').querySelector('defs');
  const dimensions = { width: map.width, height: map.height };
  const layerNodes = new Map();
  const coverNodes = new Map();
  const placeButtons = new Map(),floorControls=new Map();
  const hotspots = new Map();
  $('map-grid').setAttribute('x',(map.grid.offset?.[0]||0)-map.grid.size/2);
  $('map-grid').setAttribute('y',(map.grid.offset?.[1]||0)-map.grid.size/2);
  $('map-grid').setAttribute('width', map.grid.size);
  $('map-grid').setAttribute('height', map.grid.size);
  $('map-grid').firstElementChild.setAttribute('d', `M0 ${map.grid.size/2}H${map.grid.size} M${map.grid.size/2} 0V${map.grid.size}`);
  const gridControls=player?null:createGridControls({map,getState:()=>state,commit});
  for (const [attr, value] of Object.entries(dimensions)) $('grid-overlay').setAttribute(attr, value);
  $('scale-label').textContent = `1 square = ${map.grid.distance} ${map.grid.unit}`;
  $('artwork').append(svgNode('image', { ...dimensions, href: artwork.base }));
  const renderLighting=createLighting(map,defs,$('lighting-layer'));

  for (const item of map.interactions) {
    let node;
    if (item.type === 'roof' || item.type === 'terrain') {
      const clip = svgNode('clipPath', { id: `clip-${item.id}` });
      clip.append(svgNode('polygon', { points: polygon(item.polygon) }));
      defs.append(clip);
      node = svgNode('image', { ...dimensions, href: item.type === 'roof' ? artwork.roofs : artwork[item.asset], 'clip-path': `url(#clip-${item.id})`, 'pointer-events': 'none' });
      $(item.type === 'roof' ? 'roof-layers' : 'terrain-layers').append(node);
    } else if (item.type === 'fog') {
      node = svgNode('polygon', { points: polygon(item.polygon), class: 'fog-shape', 'pointer-events': 'none' });
      $('fog-layers').append(node);
    } else {
      const [x, y] = xy(item.point);
      node = svgNode('g', {class:'map-door',transform:`translate(${x} ${y})`,...(player?{'pointer-events':'none'}:{role:'button',tabindex:0,'data-place':item.placeId,'data-action':item.id})});
      if(!item.cover){
        node.append(svgNode('rect',{x:-14,y:-18,width:28,height:36,rx:2,fill:'#100f0d',stroke:'#54452f','stroke-width':3}));
        for(let i=0;i<5;i++)node.append(svgNode('path',{d:`M-11 ${-12+i*6}h22`,stroke:'#665b45','stroke-width':3}));
        const lid=svgNode('g',{class:'door-lid'});lid.append(svgNode('rect',{x:-14,y:-18,width:28,height:36,rx:1,fill:'#655036',stroke:'#241b13','stroke-width':2}));
        for(const y of [-10,0,10])lid.append(svgNode('path',{d:`M-13 ${y}h26`,stroke:'#2a2017','stroke-width':1}));lid.append(svgNode('circle',{cx:8,cy:0,r:2,fill:'none',stroke:'#cfad65','stroke-width':2}));node.append(lid);
      }else node.append(svgNode('rect',{x:-24,y:-24,width:48,height:48,fill:'transparent'}));
      if(!player){node.addEventListener('click',()=>{if(!tool&&!drag){selectPlace(item.placeId);activate(item.id);}});node.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();activate(item.id);}});}
      $('discovery-markers').append(node);
    }
    if(item.cover){
      const clip=svgNode('clipPath',{id:`clip-cover-${item.id}`});
      clip.append(svgNode('polygon',{points:polygon(item.cover.polygon)}));defs.append(clip);
      const cover=svgNode('image',{...dimensions,href:artwork[item.cover.asset],'clip-path':`url(#clip-cover-${item.id})`,'pointer-events':'none'});
      cover.style.transition='opacity .3s ease';$('terrain-layers').append(cover);coverNodes.set(item.id,cover);
    }
    layerNodes.set(item.id, node);
  }

  for(const [index,decoration] of (map.decorations||[]).entries()){const id=`decoration-${index}`,clip=svgNode('clipPath',{id});clip.append(svgNode('polygon',{points:polygon(decoration.polygon)}));defs.append(clip);$('terrain-layers').append(svgNode('image',{...dimensions,href:artwork[decoration.asset],'clip-path':`url(#${id})`,'pointer-events':'none'}));}

  const floorNodes=new Map(),floorLayer=svgNode('g',{id:'floor-layers'});$('terrain-layers').before(floorLayer);
  for(const place of map.places)for(const floor of floorList(place)){if(!floor.asset)continue;const id=`floor-${place.id}-${floor.id}`,clip=svgNode('clipPath',{id});clip.append(svgNode('polygon',{points:polygon(floor.polygon)}));defs.append(clip);const art=svgNode('image',{...dimensions,href:artwork[floor.asset],'clip-path':`url(#${id})`,'pointer-events':'none'});floorLayer.append(art);floorNodes.set(`${place.id}:${floor.id}`,art);}

  const scenery=createScenery(map,$('map'));
  $('dm-hotspots').after($('discovery-markers'));
  const party = svgNode('g', { class: 'party-token', ...(player ? {} : { role: 'button', tabindex: 0, 'aria-label': 'Party marker. Drag to move.' }) });
  party.append(svgNode('circle', { r: 21, fill: '#203d48', stroke: '#e9e7bb', 'stroke-width': 3 }));
  party.append(svgNode('circle', { r: 12, fill: '#84c5d6', opacity: .28 }));
  party.append(svgNode('text', { 'text-anchor': 'middle', y: 5, fill: '#fff9dc', 'font-size': 14, 'font-weight': 700 }, 'P'));
  $('party-layer').append(party);
  function finishDrag(before,message){currentHistory().record(before);state=syncCampaign({...state,revision:state.revision+1});render();save();announce(message);}
  function preview(next,mode=false){state=next;if(mode==='fog')fog?.render();else if(mode==='aura')encounter.renderAuras();else if(mode)encounter.renderCharacterPositions(typeof mode==='string'?mode:null);else render();}
  let positionSequence=0,lastPositionSequence=-1;
  function livePositions(id){const members=mapTokens(state).filter(m=>(!id||m.id===id)&&(!(m.monster||m.item)||m.visible&&(!m.item||!m.floor||state.floors?.[m.floor.placeId]===m.floor.floorId)));send({type:'positions',mapId:map.id,revision:state.revision,sequence:++positionSequence,...(!id?{party:state.party}:{}),positions:members.map(m=>({id:m.id,position:m.position,stack:m.stack||0}))});}
  function setTool(value){if(drag?.measure){const id=drag.id;drag=null;ruler=[];if($('map').hasPointerCapture(id))$('map').releasePointerCapture(id);renderRuler(true);}tool=value;measuring=value==='measure';$('map-stage').classList.toggle('is-measuring',measuring);$('measure').setAttribute('aria-pressed',measuring);fog?.setMode(value);$('map').style.cursor=value==='measure'?'crosshair':'';encounter.clearSelection();}
  if(!player){$('map-stage').addEventListener('pointerdown',event=>{if(event.button!==2||!['measure','paint','erase'].includes(tool)||event.target.closest('.reference-suite,.dice-panel,.token-status-editor,.item-comment,.building-popup'))return;fog?.cancel();setTool(null);ruler=[];renderRuler(true);consumeMapDismissal(event,$('map-stage'));},true);}
  let references;
  const encounter=createEncounterTools({map,player,getState:()=>state,commit,pointAt,announce,preview,finishDrag,getTool:()=>tool,setTool,livePositions});
  if(!player){const overlay=svgNode('svg',{id:'party-overlay',preserveAspectRatio:'xMidYMid meet'});overlay.append($('party-layer'));$('map-stage').append(overlay);}
  fog=createFogTools({map,player,getState:()=>state,commit,preview,finishDrag,pointAt,setTool,sendPreview:strokes=>send({type:'fog-preview',mapId:map.id,revision:state.revision,fog:strokes}),announce});
  const dice=player?null:createDiceTools();if(!player)createMapNavigation({map,getCamera:()=>state.camera,viewport:()=>viewportSize(),prepare:()=>{cameraAnimation.cancel();setTool(null);},setCamera:camera=>{focusedPlace=null;state={...state,camera,revision:state.revision+1};queueCamera();clearTimeout(zoomSave);zoomSave=setTimeout(save,100);}});
  combat=createCombatUI({map,player,getState:()=>state,commit,announce,showStat:(m,side)=>references?.showStat(m,side),showAssigned:(id,side)=>references?.showAssigned(id,side),locate:id=>{references?.close();encounter.locateToken(id);},getPresentation:()=>project,advanceStory:()=>setProject({...project,vibe:nextStory(project)})});

  function remember(view) { currentHistory().record(state,view); }
  function save() {
    if (player||privatePreview||window.ullhexaResetting) return;
    state=syncCampaign(state);
    storageWorks = writeStored(key, state);
    if(state.campaign)storageWorks=writeStored(`${sessionKey}:campaign`,state.campaign)&&storageWorks;
    writeStored(`${sessionKey}:map`,map.id);
    $('save-status').textContent = !autoSaveEnabled()?'Temporary session':storageWorks?'Saved in this browser':'Session only · storage unavailable';
    writeStored(`${sessionKey}:project`,project);
    publish();
  }
  function publish(){
    if(player||!runtimeReady||window.ullhexaResetting)return;
    const visible=privatePreview?.base||state;
    send({type:'state',state:playerProjection(visible),...(pendingCameraDuration?{cameraDuration:pendingCameraDuration}:{})});pendingCameraDuration=0;
    send({type:'ruler',mapId:map.id,points:privatePreview?.ruler||ruler},true);
    const storyAsset=storyCatalog(project).find(s=>s.id===project.vibe);
    const presentation={...(storyAsset?.asset?{storyAsset}:{}),mode:project.mode,vibe:project.vibe,mapId:map.id,mapContent:mapContentKey(map),sceneRevision:visible.revision,revision:++presentationRevision};
    writeStored(`${sessionKey}:presentation`,presentation);send({type:'presentation',presentation});
  }
  function reportScene(){if(embedded&&sceneReady)window.parent.postMessage({type:'scene-ready',mapId:map.id,revision:state.revision},location.origin);}
  function commit(next, message, undoable = true) {
    if (player) return;
    if (undoable) remember();
    state = syncCampaign({ ...next, revision: state.revision + 1 });
    render(); save();
    if (message) announce(message);
  }
  function restoreEncounter(restored,restoredProject) {
    cameraAnimation.cancel();
    remember({selectedPlace:selected,ruler,project});
    if(restoredProject){project=normalizeProject(restoredProject,catalog,map.id);director.render();}
    setTool(null);ruler=restored.view.ruler;measuring=false;$('map-stage').classList.remove('is-measuring');
    $('measure').setAttribute('aria-pressed','false');$('map').style.cursor='';
    encounter.clearSelection();clearTimeout(zoomSave);
    commit(restored.state,`Loaded ${restored.name}.`,false);
    selectPlace(restored.view.selectedPlace);
  }
  function activate(id) {
    const item = map.interactions.find(item => item.id === id);
    try { const next = toggleInteraction(map, state, id); commit(next, next.active.includes(id) ? item.label.replace(/^Remove/, 'Removed').replace(/^Reveal/, 'Revealed') + '.' : item.activeLabel + '.'); }
    catch (error) { announce(error.message); }
  }
  function selectPlace(id) {
    if(selected!==id)focusedPlace=null;
    selected=id;buildingUI?.render();renderControls();
  }
  function renderControls(cameraOnly=false) {
    if(player)return;
    if(!cameraOnly)for(const place of map.places){
      placeButtons.get(place.id)?.setAttribute('aria-pressed',String(place.id===selected));floorControls.get(place.id)?.render();
      const node=hotspots.get(place.id);if(node){node.querySelector('circle').setAttribute('fill',place.id===selected?'#e8ba71':'#172a21');const name=placeName(place,state),tag=node.querySelector('.place-name-tag');if(tag.lastElementChild.textContent!==name){tag.lastElementChild.textContent=name;delete tag._width;}const row=placeButtons.get(place.id)?.firstElementChild;if(row?.lastChild)row.lastChild.textContent=name;node.setAttribute('aria-label',`${name}. Click for quick actions; double-click to prepare building.`);}
    }
    sizeHotspots();
    if($('undo').disabled!==(!currentHistory().canUndo))$('undo').disabled=!currentHistory().canUndo;
    if($('redo').disabled!==(!currentHistory().canRedo))$('redo').disabled=!currentHistory().canRedo;
    const overview = Math.abs(state.camera.zoom-1)<.001 && Math.abs(state.camera.x-.5)<.001 && Math.abs(state.camera.y-.5)<.001;
    const place=map.places.find(p=>p.id===focusedPlace);
    const focus=place?buildingFocusCamera(map,place,viewportSize()):null;
    if(!cameraAnimation.active&&(!focus||selected!==focusedPlace||Math.abs(state.camera.x-focus.x)>.00001||Math.abs(state.camera.y-focus.y)>.00001||Math.abs(state.camera.zoom-focus.zoom)>.00001))focusedPlace=null;
    buildingUI?.render();
    if($('fit-map').disabled!==(overview))$('fit-map').disabled=overview;
  }
  let viewport=[$('map').clientWidth,$('map').clientHeight],viewGeometry;
  const viewportSize=()=>viewport;
  const cameraAnimation=createCameraAnimation({getCamera:()=>state.camera,update:camera=>{state={...state,camera:boundedCamera(map,camera,viewportSize())};renderCamera();if(!player)send({type:'camera',mapId:map.id,camera:state.camera,revision:state.revision});},complete:()=>{renderControls(true);if(!player)save();}});
  function focusBuilding(place){
    const overview=!place||focusedPlace===place.id;focusedPlace=overview?null:place.id;
    if(privatePreview)privatePreview.focus=true;
    state={...state,revision:state.revision+1};cameraAnimation.start(overview?{x:.5,y:.5,zoom:1}:buildingFocusCamera(map,place,viewportSize()));renderControls(true);
  }
  function beginBuildingPreview(){cameraAnimation.cancel();clearTimeout(zoomSave);privatePreview={base:structuredClone(state),ruler:structuredClone(ruler),history:createHistory(),focus:false};renderControls();}
  function endBuildingPreview(){
    if(!privatePreview)return;cameraAnimation.finish();const draft=privatePreview;privatePreview=null;
    if(JSON.stringify({...draft.base,revision:0})!==JSON.stringify({...state,revision:0})){history.record(draft.base);state={...state,revision:Math.max(state.revision,draft.base.revision)+1};if(draft.focus&&JSON.stringify(draft.base.camera)!==JSON.stringify(state.camera))pendingCameraDuration=2000;}
    render();save();
  }
  function cameraView(){
    const view=cameraViewBox(map,state.camera,viewportSize()),{zoom}=view.camera;
    if(!player)state={...state,camera:view.camera};
    viewGeometry=cameraGeometry(map,view.camera,viewport);scenery.position(viewGeometry);
    $('map-grid').firstElementChild.setAttribute('stroke-width',state.gridThickness/viewGeometry.scale);
    const viewBox=view.viewBox.join(' ');if($('map').getAttribute('viewBox')!==viewBox)$('map').setAttribute('viewBox',viewBox);$('party-overlay')?.setAttribute('viewBox',viewBox);
    const label=`${Math.round(zoom * 100)}%`;if($('zoom-value').textContent!==label)$('zoom-value').textContent=label;
    if($('zoom-out').disabled!==(zoom <= 1))$('zoom-out').disabled=zoom <= 1;
    if($('zoom-in').disabled!==(zoom >= 3))$('zoom-in').disabled=zoom >= 3;
  }
  function renderCamera(){cameraFrame=0;cameraView();encounter.renderCamera(viewGeometry);fog?.position(viewGeometry);renderRuler();renderControls(true);reportScene();}
  function queueCamera(){if(!cameraFrame)cameraFrame=requestAnimationFrame(()=>{renderCamera();if(!player)send({type:'camera',mapId:map.id,camera:state.camera,revision:state.revision});});}
  function render() {
    renderLighting(state);
    document.querySelector('.map-name').textContent=map.title;
    $('light-level').value=state.environment.darkness;
    $('light-level').setAttribute('aria-valuetext',`${state.environment.darkness}% darkness`);
    $('light-level-value').value=`${state.environment.darkness}%`;
    for (const item of map.interactions) {
      const visible = isVisible(map, state, item.id);
      if(item.type==='marker'){const available=interactionOnFloor(map,state,item)&&(item.requires||[]).every(dep=>isVisible(map,state,dep));const door=layerNodes.get(item.id);door.style.display=available?'':'none';door.classList.toggle('door-open',visible);if(!player)door.setAttribute('aria-label',`${item.publicLabel}: ${visible?'open':'closed'}`);if(coverNodes.has(item.id))coverNodes.get(item.id).style.opacity=visible?'0':'1';continue;}
      layerNodes.get(item.id).style.display=(interactionOnFloor(map,state,item)&&(item.type!=='roof'||!buildingCollapsed(map,state,item.placeId))&&(item.type==='terrain'?visible:!visible))?'':'none';
      if(coverNodes.has(item.id))coverNodes.get(item.id).style.display=visible?'none':'';
    }
    for(const [key,node] of floorNodes){const [placeId,floorId]=key.split(':');const p=map.places.find(p=>p.id===placeId);node.style.display=selectedFloor(p,state)?.id===floorId?'':'none';}
    scenery.render(state.environment.darkness,state.floors);
    cameraView();
    $('grid-overlay').style.display = state.grid ? '' : 'none';
    $('map-grid').firstElementChild.setAttribute('stroke',gridColor(map,state.gridColor));
    $('map-grid').firstElementChild.setAttribute('stroke-opacity',state.gridColor==='map'?'0.3':'0.55');
    gridControls?.render();
    const [px, py] = xy(state.party); party.setAttribute('transform', `translate(${px} ${py})`);
    $('party-layer').style.display = featureEnabled(state,'party')&&state.tokenMode === 'party' ? '' : 'none';$('token-mode').hidden=!featureEnabled(state,'party');references?.renderAvailability();
    $('party-hint').textContent = state.tokenMode === 'party' ? 'Drag the party marker to move freely.' : 'Drag each character to move freely.';
    encounter.render();fog?.render();combat?.render();itemsUI?.render(); renderControls(); renderRuler(); reportScene();
  }
  function renderRuler(broadcast = false) {
    if (broadcast && !player) send({ type: 'ruler', mapId:map.id, points: ruler });
    const group = $('measurement'); group.replaceChildren();
    $('clear-measurement').hidden = ruler.length === 0;
    if (!ruler.length) return;
    const unit=1/(viewGeometry?.scale||1),points=ruler.map(xy);
    for(const[x,y]of points)group.append(svgNode('circle',{cx:x,cy:y,r:4*unit,fill:'#fff6cb'}));
    if(points.length<2)return;
    group.append(svgNode('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#fff6cb','stroke-width':2*unit,'stroke-dasharray':`${7*unit} ${4*unit}`}));
    if(points.length<2)return;
    const distance=ruler.slice(1).reduce((sum,p,i)=>sum+distanceBetween(map,ruler[i],p),0),[a,b]=points.slice(-2),x=(a[0]+b[0])/2,y=(a[1]+b[1])/2-14*unit;
    group.append(svgNode('text',{class:'ruler-label',x,y,'text-anchor':'middle','font-size':18*unit,'stroke-width':3*unit},`${distance.toFixed(1)} ${map.grid.unit}`));
  }
  function pointAt(event) {
    const transform = $('map').getScreenCTM();
    if (!transform) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
    return [p.x/map.width, p.y/map.height];
  }
  const inBounds = p => p && p.every(n => n >= 0 && n <= 1);
  function zoomBy(factor, anchor, immediate=false) {
    cameraAnimation.cancel();focusedPlace=null;
    const before = state.camera;
    const zoom = clamp(before.zoom * factor, 1, 3);
    const ratio = before.zoom / zoom;
    const camera = zoom === 1 ? { x: .5, y: .5, zoom } : { x: clamp(anchor ? anchor[0] + (before.x-anchor[0])*ratio : before.x, 0, 1), y: clamp(anchor ? anchor[1] + (before.y-anchor[1])*ratio : before.y, 0, 1), zoom };
    state = { ...state, camera, revision: state.revision+1 };if(immediate){renderCamera();if(!player)send({type:'camera',mapId:map.id,camera:state.camera,revision:state.revision});}else queueCamera();
    clearTimeout(zoomSave); zoomSave = setTimeout(save, 100);
  }

  function activateHotspot(node,event={}){
    if(tool||event.button===2)return;const place=map.places.find(p=>p.id===node.dataset.place);if(place)buildingUI?.show(place);
  }
  function sizeHotspots(){
    const scale=.8/(viewGeometry?.scale||cameraGeometry(map,state.camera,viewport).scale);
    for(const node of hotspots.values()){const label=node.querySelector('.place-name-tag'),width=label._width??(label._width=label.lastElementChild.getComputedTextLength()+14);if(label.firstElementChild.getAttribute('width')!==String(width)){label.firstElementChild.setAttribute('x',-width/2);label.firstElementChild.setAttribute('width',width);}const glyph=node.querySelector('.hotspot-glyph');if(glyph._scale!==scale){glyph._scale=scale;glyph.setAttribute('transform',`translate(${glyph.dataset.x} ${glyph.dataset.y}) scale(${scale})`);}}
  }
  function makeHotspot(place,point,number){
    const node=svgNode('g',{class:'hotspot',role:'button',tabindex:0,'data-place':place.id});
    const[x,y]=xy(point),glyph=svgNode('g',{class:'hotspot-glyph','data-x':x,'data-y':y});
    glyph.append(svgNode('circle',{r:21,fill:'#172a21',stroke:'#e8ba71','stroke-width':2}));
    glyph.append(svgNode('text',{'text-anchor':'middle',y:6,'font-size':17,'pointer-events':'none'},number));
    const label=svgNode('g',{class:'place-name-tag','pointer-events':'none'});label.append(svgNode('rect',{x:-50,y:29,width:100,height:32,rx:4,fill:'#ffffff'}),svgNode('text',{'text-anchor':'middle',y:52,'font-size':22.5,fill:'#101710'},place.name));glyph.append(label);node.append(glyph);
    node.addEventListener('mousedown',event=>{if(event.button===0)event.preventDefault();});
    node.addEventListener('click',event=>{if(!drag)activateHotspot(node,event);});
    node.addEventListener('dblclick',event=>{if(tool||drag)return;event.preventDefault();event.stopPropagation();buildingUI.show(place,true);});
    node.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();activateHotspot(node,event);}});
    return node;
  }

  if (!player) {
    buildingUI=createBuildingControls({map,getState:()=>state,getSelected:()=>selected,rename:(place,name)=>commit({...state,placeNames:{...state.placeNames,[place.id]:name.trim().slice(0,64)||place.name}},'Place renamed.'),getFocused:()=>focusedPlace,select:selectPlace,focus:focusBuilding,toggle:activate,setFloor:(place,floor,level)=>{selectPlace(place.id);commit(selectFloor(map,state,place.id,floor.id),`${place.name}: floor ${level}.`);},beginPreview:beginBuildingPreview,endPreview:endBuildingPreview,prepare:()=>{references?.close();dice?.close();setTool(null);},getGeometry:()=>viewGeometry});
    new ResizeObserver(()=>{sizeHotspots();buildingUI.position();}).observe($('map-stage'));
    for (const [index, place] of map.places.entries()) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'place-button';
      const title = document.createElement('span');
      const number = document.createElement('b'); number.className='place-number';number.textContent=`${index+1}. `;
      title.append(number,document.createTextNode(place.name));
      button.append(title); button.addEventListener('click', () => selectPlace(place.id));
      const row=document.createElement('div');row.className='place-row';row.dataset.placeRow=place.id;row.append(button);placeButtons.set(place.id,button);
      if(floorList(place).length>1){
        const control=createFloorControl(place,{getFloor:()=>selectedFloor(place,state),onSelect:(floor,level)=>{selectPlace(place.id);commit(selectFloor(map,state,place.id,floor.id),`${place.name}: floor ${level}.`);}});
        floorControls.set(place.id,control);row.append(control.root);
      }else row.classList.add('single-floor');
      $('places').append(row);
      const node=makeHotspot(place,place.point,String(index+1));
      $('dm-hotspots').append(node);hotspots.set(place.id,node);

    }
    document.fonts.ready.then(()=>{for(const node of hotspots.values())delete node.querySelector('.place-name-tag')._width;sizeHotspots();});
    selectPlace(selected);
    if(!map.places.length){$('places').previousElementSibling.hidden=true;$('places').hidden=true;announce('Custom map ready. Paint fog or add tokens and spell areas.');}
    setupSidebarResize();
    $('zoom-in').addEventListener('click', () => zoomBy(1.25));
    $('zoom-out').addEventListener('click', () => zoomBy(.8));
    $('fit-map').addEventListener('click',()=>focusBuilding(null));

    let adjustingLighting=false;
    $('light-level').addEventListener('input',event=>{
      const darkness=clamp(Math.round(Number(event.target.value)),0,95);
      if(darkness===state.environment.darkness)return;
      if(!adjustingLighting){remember();adjustingLighting=true;}
      commit({...state,environment:{darkness}},'',false);
    });
    $('light-level').addEventListener('change',()=>{adjustingLighting=false;announce(`Map darkness: ${state.environment.darkness}%.`);});
    $('light-level').addEventListener('blur',()=>{adjustingLighting=false;});
    $('measure').addEventListener('click',()=>{setTool(measuring?null:'measure');announce(measuring?'Drag between two points to measure. Clear ruler removes the line.':'Measurement off.');});
    $('clear-measurement').addEventListener('click', () => { ruler = []; renderRuler(true); });
    document.addEventListener('keydown', event => { if(!event.defaultPrevented&&event.key==='Escape'&&tool){setTool(null);ruler=[];renderRuler(true);} });
    function travelHistory(direction){
      const entry=currentHistory()[direction](state,{selectedPlace:selected,ruler,project});if(!entry)return;
      if(entry.view){ruler=entry.view.ruler;if(entry.view.project){project=entry.view.project;director.render();}}
      commit(entry.state,direction==='undo'?'Last encounter change undone.':'Last encounter change redone.',false);
      if(entry.view)selectPlace(entry.view.selectedPlace);
    }
    $('initialize-board').addEventListener('click',async()=>{if(!await confirmInitializeControlBoard())return;const b=$('initialize-board');b.disabled=true;b.textContent='Initializing…';try{await initializeControlBoard();}catch(error){announce(error.message);b.disabled=false;b.textContent='Initialize Control Board';}});
    $('undo').addEventListener('click',()=>travelHistory('undo'));
    $('redo').addEventListener('click',()=>travelHistory('redo'));
    $('open-player').addEventListener('click', () => {
      if(displayConnected()){
        send({type:'close-player'});announce('Closing the player display…');return;
      }
      save();const url=new URL(location.href);url.search=new URLSearchParams({view:'player',session,map:map.id,build:'62',popup:'1'}).toString();
      playerWindow=dmHost?dmHost.openPlayer(url):openPlayerWindow(url);
      if(playerWindow){updateConnection();announce('Move the player window to your TV/projector using an extended display.');}
      else announce('Your browser blocked the player window. Allow pop-ups for this page and try again.');
    });
    $('map-stage').addEventListener('wheel', event => {if(event.target.closest('.token-status-editor,.shape-palette,.item-comment,.dice-panel,.reference-suite,.building-popup')||encounter.isDragging()||fog.isDrawing())return;event.preventDefault();wheelDelta+=event.deltaY;wheelPoint={clientX:event.clientX,clientY:event.clientY};if(!wheelFrame)wheelFrame=requestAnimationFrame(()=>{wheelFrame=0;const delta=wheelDelta;wheelDelta=0;zoomBy(Math.exp(-delta*.0015),pointAt(wheelPoint),true);});}, { passive: false });
    $('map-stage').addEventListener('pointerdown', event => {
      const right=event.button===2;
      if(!$('map').contains(event.target)&&!party.contains(event.target)&&!(right&&event.target.closest('#character-tokens [data-character],#shape-handle-overlay,#aura-handles')))return;
      if((event.button!==0&&!right)||drag||encounter.isDragging()||fog.isDrawing()||(!right&&['paint','erase'].includes(tool)))return;
      const p = pointAt(event);
      if(measuring&&!right){if(inBounds(p)){ruler=[p,p];drag={id:event.pointerId,measure:true,start:structuredClone(state),moved:false};$('map').setPointerCapture(event.pointerId);renderRuler(true);}return;}
      const token = !right&&party.contains(event.target);
      if(!token&&!right&&!event.ctrlKey&&!event.metaKey)return;
      cameraAnimation.cancel();renderControls(true);const ctm = $('map').getScreenCTM();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: { ...state.camera }, scale: ctm.a, point: p, start: structuredClone(state), token, moved: false, hotspot: !right&&!!event.target.closest('.hotspot,.map-door') };
      $('map-stage').classList.toggle('is-panning',!token);
      event.preventDefault();
      $('map').setPointerCapture(event.pointerId);
    });
    $('map-stage').addEventListener('contextmenu',event=>{if($('map').contains(event.target)||party.contains(event.target)||event.target.closest('#character-tokens [data-character],#shape-handle-overlay,#aura-handles'))event.preventDefault();});
    const panCursor=event=>{const held=event.ctrlKey||event.metaKey;$('map-stage').classList.toggle('can-pan',!measuring&&held);if(drag?.measure&&['Control','Meta'].includes(event.key)){if(held&&!drag.bend)drag.bend=[...ruler.at(-1)];if(!held)drag.bend=null;ruler=[ruler[0],...(drag.bend?[drag.bend]:[]),ruler.at(-1)];renderRuler(true);}};
    document.addEventListener('keydown',panCursor);document.addEventListener('keyup',panCursor);window.addEventListener('blur',()=>$('map-stage').classList.remove('can-pan'));
    $('map').addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      if(!event.buttons){endDrag(event);return;}
      if(drag.measure){const p=pointAt(event);if(p){ruler=[ruler[0],...(drag.bend?[drag.bend]:[]),p.map(n=>clamp(n,0,1))];drag.moved=true;renderRuler(true);}return;}
      const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
      if (Math.hypot(dx, dy) < (drag.token ? 3 : 4) && !drag.moved) return;
      drag.moved = true;
      if (drag.token) {
        const p = pointAt(event);
        if (!p) return;
        let position=drag.start.party.map((n,axis)=>clamp(n+p[axis]-drag.point[axis],0,1));if(state.snap)position=snapPoint(map,position);state=moveParty(state,position);
        if(!partyFrame)partyFrame=requestAnimationFrame(paintParty);return;
      }
      else {focusedPlace=null;const camera=boundedCamera(map,{x:drag.camera.x-dx/drag.scale/map.width,y:drag.camera.y-dy/drag.scale/map.height,zoom:drag.camera.zoom},viewportSize());state={...state,camera};drag.x=event.clientX;drag.y=event.clientY;drag.camera=camera;}
      queueCamera();
    });
    const endDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      cancelAnimationFrame(partyFrame);partyFrame=0;cancelAnimationFrame(cameraFrame);cameraFrame=0;const finished = drag;
      finished.ending=true;$('map-stage').classList.remove('is-panning');if($('map').hasPointerCapture(event.pointerId))$('map').releasePointerCapture(event.pointerId);
      if(finished.measure){if(!finished.moved)ruler=[];drag=null;renderRuler(true);return;}
      if (finished.moved) {
        if (finished.token) currentHistory().record(finished.start);
        state.revision += 1; render(); save();
        if (finished.token) announce('Party moved.');
      }
      // Pointer capture redirects click; handle a stationary building click explicitly.
      if (!finished.moved && finished.hotspot) {
        const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('.hotspot,.map-door');
        if(hit)activateHotspot(hit,event);
      }
      setTimeout(() => { if (drag === finished) drag = null; }, 0);
    };
    $('map').addEventListener('pointerup', endDrag);
    const cancelDrag=event=>{if(!drag||drag.ending||(event.pointerId!==undefined&&drag.id!==event.pointerId))return;const id=drag.id;cancelAnimationFrame(partyFrame);partyFrame=0;cancelAnimationFrame(cameraFrame);cameraFrame=0;state=drag.start;if(drag.measure){ruler=[];renderRuler(true);}drag=null;$('map-stage').classList.remove('is-panning');if($('map').hasPointerCapture(id))$('map').releasePointerCapture(id);render();livePositions();send({type:'camera',mapId:map.id,camera:state.camera,revision:state.revision});};
    $('map').addEventListener('pointercancel',cancelDrag);$('map').addEventListener('lostpointercapture',cancelDrag);window.addEventListener('blur',cancelDrag);document.addEventListener('visibilitychange',event=>{if(document.hidden)cancelDrag(event);});

  }

  function receive(message) {
    if (!message || typeof message !== 'object') return;
    if(!player&&message.type==='hello'){
      const probe=presence.hello(message.playerId);if(probe)send(probe);
      if(runtimeReady){const presentation=readStored(`${sessionKey}:presentation`);if(presentation)send({type:'presentation',presentation});else publish();}
    }
    if(!player&&message.type==='scene-hello')publish();
    if(!player&&message.type==='display-alive'){presence.confirm(message);updateConnection();}
    if(!player&&message.type==='bye'){presence.bye(message.playerId);updateConnection();}
    if(!player&&message.type==='close-blocked')announce('This player tab was opened manually. Close it using the browser’s tab controls.');
    if(!player&&message.type==='display-error')announce(typeof message.message==='string'?message.message:'The player display could not load.');
    if(player&&message.mapId===map.id&&message.revision===state.revision&&message.type==='positions'&&Number.isSafeInteger(message.sequence)&&message.sequence>lastPositionSequence){
      lastPositionSequence=message.sequence;const positions=new Map((Array.isArray(message.positions)?message.positions:[]).filter(p=>p&&typeof p.id==='string'&&inBounds(p.position)).map(p=>[p.id,{position:p.position,...(Number.isSafeInteger(p.stack)&&p.stack>=0?{stack:p.stack}:{})}]));
      state={...state,roster:state.roster.map(m=>({...m,...(positions.get(m.id)||{})})),items:(state.items||[]).map(m=>({...m,...(positions.get(m.id)||{})})),monsters:state.monsters.map(m=>({...m,...(positions.get(m.id)||{})}))};
      if(inBounds(message.party)){state.party=message.party;const[x,y]=xy(state.party);party.setAttribute('transform',`translate(${x} ${y})`);}encounter.renderCharacterPositions(positions.size===1?[...positions.keys()][0]:null);
    }
    if(player&&message.type==='camera'&&message.mapId===map.id&&Number.isSafeInteger(message.revision)&&message.revision>=state.revision&&inBounds([message.camera?.x,message.camera?.y])&&Number.isFinite(message.camera?.zoom)&&message.camera.zoom>=1&&message.camera.zoom<=3){cameraAnimation.cancel();state={...state,camera:message.camera,revision:message.revision};queueCamera();return;}
    if(player&&message.mapId===map.id&&message.revision===state.revision&&message.type==='fog-preview'){state={...state,fog:normalizeFog(message.fog)};fog.render();}
    if(player&&message.type==='ruler'&&message.mapId===map.id&&Array.isArray(message.points)&&message.points.length<=3&&message.points.every(inBounds)){ruler=message.points;renderRuler();}
    if (player && message.type === 'state' && message.state?.mapId === map.id && message.state?.mapVersion === map.version) {
      const incoming = playerProjection(sanitizeState(map, message.state));
      if(incoming.revision>=state.revision){const previousCamera=state.camera;cameraAnimation.cancel();state=incoming;lastPositionSequence=-1;if(message.cameraDuration===2000){state={...state,camera:previousCamera};render();cameraAnimation.start(incoming.camera);}else render();}
      lastPeer = Date.now(); updateConnection();
    }
  }
  if (channel) channel.onmessage = event => receive(event.data);
  window.addEventListener('storage', event => {
    if (event.key !== `${sessionKey}:signal` || !event.newValue) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* Ignore unrelated or invalid storage data. */ }
  });
  function displayConnected(){
    // An owned window's actual closure overrides its last in-flight heartbeat.
    if(playerWindow?.closed){playerWindow=null;presence.clear();}
    return !!playerWindow||presence.connected();
  }
  function updateConnection() {
    const connected=player?Date.now()-lastPeer<15000:displayConnected();
    if(player)$('connection-status').textContent=connected?'Following the DM':'DM disconnected · last view kept';
    if(!player&&$('open-player').getAttribute('aria-pressed')!==String(connected)){$('open-player').setAttribute('aria-pressed',String(connected));$('open-player').setAttribute('aria-label',connected?'Close player display':'Open player display');$('open-player').title=connected?'Close player display':'Open player display';$('open-player').replaceChildren(document.createTextNode('Player Display '));const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent=connected?'↙':'↗';$('open-player').append(arrow);}
  }
  if(!embedded)setInterval(updateConnection,500);
  window.addEventListener('pagehide',()=>{if(!player&&runtimeReady)save();});
  if(!player){createUserManual();director=createDirector({catalog,mapId:map.id,getProject:()=>project,setProject,prepareMap,announce});createLibraries({map,getState:()=>state,commit,announce});itemsUI=createItemsUI({map,getState:()=>state,commit,announce,pointAt,setTool,selectItem:id=>encounter.selectItem(id),editItem:id=>{references?.close();encounter.editItem(id);},showNotes:id=>{references?.close();encounter.showItemNotes(id);}});createSpellLibrary({getState:()=>state,commit,announce});references=createReferenceViewers({getState:()=>state,commit,announce,prepare:()=>{dice?.close();setTool(null);}});createBoardLayout();mapMenu.setUpload(createMapUpload({sessionKey,catalog,onAdded:entry=>{mapMenu.addEntry(entry);mapMenu.showEntry(entry);},announce}));}
  if(embedded){
    let lastActivity=0;
    const activity=()=>{if(performance.now()-lastActivity>100){lastActivity=performance.now();window.parent.postMessage({type:'player-activity'},location.origin);}};
    document.addEventListener('pointermove',activity);document.addEventListener('pointerdown',activity);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')window.parent.postMessage({type:'player-escape'},location.origin);});
  }
  if(!player){const auto=$('auto-save');auto.checked=autoSaveEnabled();auto.disabled=false;auto.addEventListener('change',async()=>{auto.disabled=true;try{await setAutoSave(auto.checked,persistAssets);save();}catch(error){auto.checked=autoSaveEnabled();announce(error.message);}finally{auto.disabled=false;}});}
  if(!embedded)setupFullscreen({player,announce});
  render(); updateConnection();
  if(player)send({type:'scene-hello'});
  await Promise.all(Object.values(artwork).map(loadRaster));
  $('map-loading').hidden = true;sceneReady=true;reportScene();
  if(!player) {
    const bundle=createSessionBundle({sessionKey,catalog,loadMap,getState:()=>state,readMapState,saveCurrent:save});
    const saveControls=createSaveControls({map,catalog,loadMap,bundle,getState:()=>state,getView:()=>({selectedPlace:selected,ruler:structuredClone(ruler)}),getProject:()=>project,announce,
      applySave:async(target,restored,data)=>{
        for(const entry of catalog)mapMenu.addEntry(entry);
        if(target.id===map.id){restoreEncounter(restored,data.project);return;}
        // Hand off only a validated save. The destination restores it after its art loads.
        try{sessionStorage.setItem(pendingLoadKey,JSON.stringify({...data,assets:undefined,mapStates:undefined,customMaps:undefined}));}
        catch{throw new Error('This browser could not prepare the saved map. Allow browser storage and try again.');}
        runtimeReady=false;
        if(data.project){project=normalizeProject(data.project,catalog,target.id);writeStored(`${sessionKey}:project`,project);}
        const url=new URL(location.href);url.searchParams.set('map',target.id);location.assign(url);
      }
    });
    let pending;try{pending=sessionStorage.getItem(pendingLoadKey);}catch{}
    if(pending) {
      try {
        const data=parseSave(pending),restored=restoreSave(map,data);
        restoreEncounter(restored,data.project);saveControls.setName(data.name);
      } catch(error){saveControls.showError(error.message);}
      try{sessionStorage.removeItem(pendingLoadKey);}catch{}
    }
  }

  runtimeReady=true;if(!player)save();
  new ResizeObserver(entries=>{const r=entries[0].contentRect;viewport=[r.width,r.height];if(runtimeReady)queueCamera();}).observe($('map-stage'));
  window.addEventListener('pageshow',event=>{if(event.persisted){render();updateConnection();if(player){send({type:'scene-hello'});reportScene();}else save();}});
  if(dmFrame)window.parent.postMessage({type:'dm-ready',url:location.href,title:document.title},location.origin);

  // Optional browser-native agent tools use the same state transitions as the visible controls.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(error => console.warn('Optional browser tool unavailable:', error)); } catch (error) { console.warn('Optional browser tool unavailable:', error); } };
    register({ name: 'read_map_state', description: 'Read the current encounter state and visible discoveries.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true }, execute: async () => ({ content: [{ type: 'text', text: JSON.stringify({ map: map.title, role: player ? 'player' : 'dm', active: map.interactions.filter(item => isVisible(map,state,item.id)).map(item=>item.id), camera: state.camera, party: state.party, tokenMode: state.tokenMode, roster: state.roster, shapes: state.shapes }) }] }) });
    if (!player) register({ name: 'set_map_reveal', description: 'Reveal or conceal a map interaction in the DM encounter. The player display follows.', annotations: { readOnlyHint: false }, inputSchema: { type: 'object', properties: { id: { type: 'string', enum: map.interactions.map(item=>item.id) }, revealed: { type: 'boolean' } }, required: ['id','revealed'], additionalProperties: false }, execute: async ({ id, revealed }) => {
      if (!map.interactions.some(item => item.id === id) || typeof revealed !== 'boolean') throw new Error('Invalid reveal request.');
      if (state.active.includes(id) !== revealed) commit(toggleInteraction(map,state,id), 'Encounter reveal updated.');
      return { content: [{ type: 'text', text: JSON.stringify({ id, revealed: isVisible(map,state,id) }) }] };
    } });
  }
}
(!player&&!query.has('dm-frame')?Promise.resolve(startDMShell()):player&&!embedded?startPlayerDisplay():start()).catch(error => { if(embedded)window.parent.postMessage({type:'scene-error'},location.origin); $('map-loading').textContent = error.message; $('map-loading').hidden = false; $('live-message').textContent = 'The encounter could not start. Reload this page to try again.'; console.error(error); });
