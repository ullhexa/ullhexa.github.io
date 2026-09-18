import {placeStep,setPlaceStep,cyclePlace} from './map-events.js?v=20';
import {setupSidebarResize} from './sidebar-resize.js?v=20';
import {syncCampaign,normalizeCampaign,combatants,snapPoint} from './combat-state.js?v=20';
import {createCombatUI,createLibraries} from './combat-ui.js?v=20';
import {createFogTools} from './fog-tools.js?v=20';
import {normalizeFog} from './fog-state.js?v=20';
import {customCatalog,createMapUpload,resolveMapArt} from './custom-maps.js?v=20';
import {createSessionBundle} from './session-bundle.js?v=20';
import { startDMShell } from './dm-shell.js?v=20';
import { openPlayerWindow } from './display-window.js?v=20';
import { validateMap, initialState, sanitizeState, isVisible, toggleInteraction, distanceBetween } from './state.js?v=20';
import { createEncounterTools } from './encounter-tools.js?v=20';
import { playerProjection, formation, moveParty, PORTRAIT_ASSETS } from './encounter-state.js?v=20';
import { createMapMenu } from './map-menu.js?v=20';
import { createSaveControls } from './save-controls.js?v=20';
import { parseSave, restoreSave } from './save-file.js?v=20';
import { createLighting } from './lighting.js?v=20';
import { setupFullscreen } from './fullscreen.js?v=20';
import { startPlayerDisplay } from './player-display.js?v=20';
import { createDirector } from './director.js?v=20';
import { normalizeProject } from './presentation-state.js?v=20';

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
const readStored = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const writeStored = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const fetchJSON = async url => { const response = await fetch(url); if (!response.ok) throw new Error(`Could not load ${url}.`); return response.json(); };

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
  const catalog = (await fetchJSON('./maps/catalog.json?v=20')).maps;
  const remembered = readStored('lanternford:last-session');
  const session = query.get('session') || (player ? null : (typeof remembered === 'string' ? remembered : crypto.randomUUID()));
  if (!session || !/^[a-zA-Z0-9-]{1,80}$/.test(session)) throw new Error('Open this player display using the button in the DM window.');
  if (!player && !query.has('session')) writeStored('lanternford:last-session', session);
  const sessionKey = `lanternford:session:${session}`;
  catalog.push(...customCatalog(sessionKey));
  const pendingLoadKey = `${sessionKey}:pending-load`;
  const selectedMap = query.get('map') || readStored(`${sessionKey}:map`);
  const entry = catalog.find(item => item.id === selectedMap) || catalog[0];
  const loadMap = async item => {
    const content=validateMap(item.map||await fetchJSON(`${item.manifest}?v=20`));
    if(content.id!==item.id)throw new Error('The map catalog and content do not match.');
    return content;
  };
  const map = await loadMap(entry);
  const artwork=await resolveMapArt(map);
  let mapMenu,combat,fog,tool=null;
  let project=normalizeProject(readStored(`${sessionKey}:project`),catalog,map.id);
  let director,playerWindow=dmHost?.playerWindow||null,runtimeReady=false,sceneReady=false;
  const peers=new Map();
  const storedRevision=readStored(`${sessionKey}:presentation`)?.revision;
  let presentationRevision=Number.isSafeInteger(storedRevision)&&storedRevision>=0?storedRevision:0;
  const setProject=next=>{project=normalizeProject(next,catalog,map.id);writeStored(`${sessionKey}:project`,project);director?.render();publish();};
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
  $('map-identity').textContent = entry.identity || map.title;
  document.querySelector('.edition').textContent = entry.edition || 'FIELD TEST';
  document.querySelector('.brand').setAttribute('aria-label', `${entry.identity || map.title} home`);
  if(dmFrame)document.querySelector('.brand').href='./?dm-frame=1';
  document.title = `${map.title} — ${player ? 'Player display' : 'Interactive map playtest'}`;
  document.querySelector('.map-name').textContent = `${map.title} · ${entry.subtitle}`;
  $('map').setAttribute('aria-label', `${player ? 'Player' : 'Interactive'} map of ${map.title}`);
  $('map').querySelector('title').textContent = `${map.title} encounter map`;
  if(!player) {
    document.querySelector('.encounter-heading h1').textContent=map.title;
    document.querySelector('.encounter-heading .eyebrow').textContent=entry.category.toUpperCase();
    mapMenu=createMapMenu({catalog,activeId:map.id,activeMap:map,loadMap,getEnvironment:target=>target.id===map.id?state.environment:readMapState(target).environment,getProject:()=>project,setProject,applyMap:(target,environment)=>prepareMap(target.id,environment).catch(error=>announce(error.message))});
  }
  const key = `lanternford:${map.id}:${map.version}:${session}`;
  function readMapState(content){
    const previous=readStored(`lanternford:${content.id}:${content.version}:${session}`)||(content.previousVersions||[]).map(version=>readStored(`lanternford:${content.id}:${version}:${session}`)).find(Boolean);
    let next=sanitizeState(content,previous);
    if(!player){
      const campaign=normalizeCampaign(readStored(`${sessionKey}:campaign`)||next.campaign,next.roster);
      const savedMembers=[...(next.roster||[]),...(next.monsters||[]),...(next.campaign?.parties||[]).flatMap(g=>g.members),...(next.campaign?.encounters||[]).flatMap(g=>g.members)];
      const points=formation(content,next.party,60);
      for(const kind of ['parties','encounters'])campaign[kind]=campaign[kind].map(g=>({...g,members:g.members.map((m,i)=>({...m,position:savedMembers.find(p=>p.id===m.id)?.position||points[i]||content.partyStart}))}));
      next={...next,campaign,roster:campaign.parties.find(g=>g.id===campaign.activeParty).members,monsters:campaign.encounters.find(g=>g.id===campaign.activeEncounter)?.members||[]};
    }
    return syncCampaign(next);
  }
  let state = readMapState(map);
  if (player) state = playerProjection(state);
  let selected = map.places[0]?.id||null;
  let focusedPlace = null;
  let history = [];
  let lastPeer = 0;
  let ruler = [];
  let measuring = false;
  let drag = null;
  let zoomSave,partyFrame=0;
  function paintParty(){partyFrame=0;const[x,y]=xy(state.party);party.setAttribute('transform',`translate(${x} ${y})`);livePositions();}
  let storageWorks = true;
  let channel;
  try { channel = new BroadcastChannel(sessionKey); } catch { /* Storage events also synchronize windows. */ }
  const send = value => { if(channel)channel.postMessage(value);else writeStored(`${sessionKey}:signal`, { ...value, nonce: crypto.randomUUID() }); };
  const announce = text => { $('live-message').textContent = text; };
  const xy = point => [point[0] * map.width, point[1] * map.height];
  const polygon = points => points.map(point => xy(point).join(',')).join(' ');
  const defs = $('map').querySelector('defs');
  const dimensions = { width: map.width, height: map.height };
  const layerNodes = new Map();
  const coverNodes = new Map();
  const placeButtons = new Map(),placeExpansions=new Map();let expandedPlace=null;
  const actionButtons = new Map();
  const hotspots = new Map();
  const doorHotspots=new Map();
  const stepButtons=new Map();
  $('map-grid').setAttribute('width', map.grid.size);
  $('map-grid').setAttribute('height', map.grid.size);
  $('map-grid').firstElementChild.setAttribute('d', `M${map.grid.size} 0H0V${map.grid.size}`);
  const gridColors = {map:map.grid.color || '#eff4d2',black:'#000000',white:'#ffffff'};
  const gridColorButtons = [...document.querySelectorAll('[data-grid-color]')];
  for(const button of gridColorButtons)button.style.setProperty('--grid-color',gridColors[button.dataset.gridColor]);
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
      node = svgNode('g', { transform: `translate(${x} ${y})`, 'pointer-events': 'none' });
      node.append(svgNode('circle', { r: 17, fill: '#e8ba71', stroke: '#28271a', 'stroke-width': 3 }));
      node.append(svgNode('text', { 'text-anchor': 'middle', y: 6, 'font-size': 21, fill: '#252219', 'font-weight': 700 }, item.symbol));
      node.append(svgNode('text', { class: 'marker-label', 'text-anchor': 'middle', y: 37, 'font-size': 16 }, item.publicLabel));
      $('discovery-markers').append(node);
    }
    if(item.cover){
      const clip=svgNode('clipPath',{id:`clip-cover-${item.id}`});
      clip.append(svgNode('polygon',{points:polygon(item.cover.polygon)}));defs.append(clip);
      const cover=svgNode('image',{...dimensions,href:artwork[item.cover.asset],'clip-path':`url(#clip-cover-${item.id})`,'pointer-events':'none'});
      $('terrain-layers').append(cover);coverNodes.set(item.id,cover);
    }
    layerNodes.set(item.id, node);
  }

  const party = svgNode('g', { class: 'party-token', ...(player ? {} : { role: 'button', tabindex: 0, 'aria-label': 'Party marker. Drag to move.' }) });
  party.append(svgNode('circle', { r: 21, fill: '#203d48', stroke: '#e9e7bb', 'stroke-width': 3 }));
  party.append(svgNode('circle', { r: 12, fill: '#84c5d6', opacity: .28 }));
  party.append(svgNode('text', { 'text-anchor': 'middle', y: 5, fill: '#fff9dc', 'font-size': 14, 'font-weight': 700 }, 'P'));
  party.append(svgNode('text', { class: 'marker-label', 'text-anchor': 'middle', y: 39, 'font-size': 16 }, 'Party'));
  $('party-layer').append(party);
  function finishDrag(before,message){history.push(before);if(history.length>40)history.shift();state=syncCampaign({...state,revision:state.revision+1});render();save();announce(message);}
  function preview(next,mode=false){state=next;if(mode===true)encounter.renderCharacterPositions();else if(mode==='fog')fog?.render();else render();}
  let positionSequence=0,lastPositionSequence=-1;
  function livePositions(){send({type:'positions',mapId:map.id,revision:state.revision,sequence:++positionSequence,party:state.party,positions:combatants(playerProjection(state)).map(m=>({id:m.id,position:m.position,stack:m.stack||0}))});}
  function setTool(value){tool=value;measuring=value==='measure';$('map-stage').classList.toggle('is-measuring',measuring);$('measure').setAttribute('aria-pressed',measuring);fog?.setMode(value);$('map').style.cursor=value?'crosshair':'';encounter.clearSelection();}
  const encounter=createEncounterTools({map,player,getState:()=>state,commit,pointAt,announce,preview,finishDrag,getTool:()=>tool,livePositions});
  fog=createFogTools({map,player,getState:()=>state,preview,finishDrag,pointAt,setTool,sendPreview:strokes=>send({type:'fog-preview',mapId:map.id,revision:state.revision,fog:strokes}),announce});
  combat=createCombatUI({map,player,getState:()=>state,commit,announce});

  function remember() { history.push(structuredClone(state)); if (history.length > 40) history.shift(); }
  function save() {
    if (player) return;
    state=syncCampaign(state);
    storageWorks = writeStored(key, state);
    if(state.campaign)storageWorks=writeStored(`${sessionKey}:campaign`,state.campaign)&&storageWorks;
    writeStored(`${sessionKey}:map`,map.id);
    $('save-status').textContent = storageWorks ? 'Saved in this browser' : 'Session only · storage unavailable';
    writeStored(`${sessionKey}:project`,project);
    publish();
  }
  function publish(){
    if(player||!runtimeReady)return;
    send({type:'state',state:playerProjection(state)});
    send({type:'ruler',mapId:map.id,points:ruler});
    const presentation={mode:project.mode,vibe:project.vibe,mapId:map.id,sceneRevision:state.revision,revision:++presentationRevision};
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
    remember();
    history[history.length-1].restoreView={selectedPlace:selected,ruler:structuredClone(ruler),project:structuredClone(project)};
    if(restoredProject){project=normalizeProject(restoredProject,catalog,map.id);director.render();}
    ruler=restored.view.ruler;measuring=false;$('map-stage').classList.remove('is-measuring');
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
    selected = id;
    const place = map.places.find(place => place.id === id);
    if(!place){document.querySelector('.selected-place').hidden=true;return;}
    document.querySelector('.selected-place').hidden=false;
    $('selected-title').textContent = `${map.places.indexOf(place)+1}. ${place.name}`;
    $('selected-actions').replaceChildren(); actionButtons.clear();stepButtons.clear();
    const sequence=place.sequence||[],managed=new Set(sequence.flatMap(step=>step.active));
    if(sequence.length){const steps=document.createElement('div');steps.className='place-sequence';steps.setAttribute('role','group');steps.setAttribute('aria-label',`${place.name} states`);sequence.forEach((step,index)=>{const b=document.createElement('button');b.type='button';const number=document.createElement('small');number.textContent=`${index+1}/${sequence.length}`;const label=document.createElement('span');label.textContent=step.label;b.append(number,label);b.setAttribute('aria-label',`${place.name}: ${step.label}`);b.addEventListener('click',()=>commit(setPlaceStep(place,state,index),`${place.name}: ${step.label}.`));steps.append(b);stepButtons.set(index,b);});$('selected-actions').append(steps);}
    for (const id of place.actions.filter(id=>!managed.has(id))) {
      const button = document.createElement('button'); button.type = 'button';
      button.addEventListener('click', () => activate(id));
      $('selected-actions').append(button); actionButtons.set(id, button);
    }
    renderControls();
  }
  function renderControls() {
    if (player) return;
    for (const place of map.places) {
      const button = placeButtons.get(place.id);
      button?.setAttribute('aria-pressed', place.id === selected);
      const step=placeStep(place,state),sequence=place.sequence||[];
      for(const[index,b]of (placeExpansions.get(place.id)?.steps||[]).entries())b.setAttribute('aria-pressed',index===step);
      if(button)button.lastElementChild.textContent=sequence.length?`${step+1}/${sequence.length} · ${sequence[step].label}`:'';
      const node = hotspots.get(place.id);
      if(node){node.querySelector('circle').setAttribute('fill',place.id===selected?'#e8ba71':'#172a21');node.querySelector('.event-step').textContent=`${step+1}/${sequence.length||1}`;node.setAttribute('aria-label',`${place.name}: ${sequence[step]?.label||'Ready'}, ${step+1} of ${sequence.length||1}. Click for next state.`);}
      if(place.id===selected)for(const[index,b]of stepButtons)b.setAttribute('aria-pressed',index===step);
    }
    for (const [id, button] of actionButtons) {
      const item = map.interactions.find(item => item.id === id);
      const on = state.active.includes(id);
      button.textContent = `${on?'2/2':'1/2'} · ${on ? item.activeLabel : item.label}`;
      button.setAttribute('aria-pressed', on);
      button.disabled = !on && (item.requires || []).some(dep => !isVisible(map, state, dep));
      button.title = button.disabled ? 'Reveal the surrounding area first.' : '';
    }
    for(const[id,node]of doorHotspots){const item=map.interactions.find(i=>i.id===id),available=(item.requires||[]).every(dep=>isVisible(map,state,dep)),on=state.active.includes(id);node.style.display=available?'':'none';node.querySelector('.event-step').textContent=on?'2/2':'1/2';node.setAttribute('aria-label',`${item.publicLabel}: ${on?'open':'closed'}, ${on?2:1} of 2. Click for next state.`);}
    sizeHotspots();
    $('undo').disabled = history.length === 0;
    const overview = Math.abs(state.camera.zoom-1)<.001 && Math.abs(state.camera.x-.5)<.001 && Math.abs(state.camera.y-.5)<.001;
    const place=map.places.find(p=>p.id===focusedPlace);
    if(!place||selected!==focusedPlace||Math.abs(state.camera.x-place.point[0])>.00001||Math.abs(state.camera.y-place.point[1])>.00001||Math.abs(state.camera.zoom-place.focusZoom)>.00001)focusedPlace=null;
    $('focus-place').textContent=focusedPlace?'Overview':'Focus';
    $('fit-map').disabled = overview;
  }
  function render() {
    renderLighting(state);
    document.querySelector('.map-name').textContent=`${map.title} · ${entry.subtitle}`;
    $('light-level').value=state.environment.darkness;
    $('light-level').setAttribute('aria-valuetext',`${state.environment.darkness}% darkness`);
    $('light-level-value').value=`${state.environment.darkness}%`;
    for (const item of map.interactions) {
      const visible = isVisible(map, state, item.id);
      layerNodes.get(item.id).style.display = (item.type==='marker'&&!player?false:['marker','terrain'].includes(item.type)?visible:!visible) ? '' : 'none';
      if(coverNodes.has(item.id))coverNodes.get(item.id).style.display=visible?'none':'';
    }
    const { x, y, zoom } = state.camera;
    const w = map.width / zoom, h = map.height / zoom;
    $('map').setAttribute('viewBox', `${x * map.width - w / 2} ${y * map.height - h / 2} ${w} ${h}`);
    $('zoom-value').textContent = `${Math.round(zoom * 100)}%`;
    $('zoom-out').disabled = zoom <= 1;
    $('zoom-in').disabled = zoom >= 4;
    $('grid-overlay').style.display = state.grid ? '' : 'none';
    $('show-grid').checked = state.grid;
    $('snap-grid').checked = state.snap;
    $('map-grid').firstElementChild.setAttribute('stroke',gridColors[state.gridColor]);
    $('map-grid').firstElementChild.setAttribute('stroke-opacity',state.gridColor==='map'?'0.3':'0.55');
    for(const button of gridColorButtons)button.setAttribute('aria-pressed',button.dataset.gridColor===state.gridColor);
    const [px, py] = xy(state.party); party.setAttribute('transform', `translate(${px} ${py})`);
    $('party-layer').style.display = state.tokenMode === 'party' ? '' : 'none';
    $('party-hint').textContent = state.tokenMode === 'party' ? 'Drag the party marker to move freely.' : 'Drag each character to move freely.';
    encounter.render();fog?.render();combat?.render(); renderControls(); renderRuler(); reportScene();
  }
  function renderRuler(broadcast = false) {
    if (broadcast && !player) send({ type: 'ruler', mapId:map.id, points: ruler });
    const group = $('measurement'); group.replaceChildren();
    $('clear-measurement').hidden = ruler.length === 0;
    if (!ruler.length) return;
    const [x1, y1] = xy(ruler[0]);
    group.append(svgNode('circle', { cx: x1, cy: y1, r: 6, fill: '#fff6cb' }));
    if (ruler.length < 2) return;
    const [x2, y2] = xy(ruler[1]);
    group.append(svgNode('line', { x1, y1, x2, y2, stroke: '#fff6cb', 'stroke-width': 3, 'stroke-dasharray': '10 5' }));
    group.append(svgNode('circle', { cx: x2, cy: y2, r: 6, fill: '#fff6cb' }));
    group.append(svgNode('text', { class: 'marker-label', x: (x1+x2)/2, y: (y1+y2)/2-14, 'text-anchor': 'middle', 'font-size': 23 }, `${distanceBetween(map, ...ruler).toFixed(1)} ${map.grid.unit}`));
  }
  function pointAt(event) {
    const transform = $('map').getScreenCTM();
    if (!transform) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
    return [p.x/map.width, p.y/map.height];
  }
  const inBounds = p => p && p.every(n => n >= 0 && n <= 1);
  function zoomBy(factor, anchor) {
    focusedPlace=null;
    const before = state.camera;
    const zoom = clamp(before.zoom * factor, 1, 4);
    const ratio = before.zoom / zoom;
    const camera = zoom === 1 ? { x: .5, y: .5, zoom } : { x: clamp(anchor ? anchor[0] + (before.x-anchor[0])*ratio : before.x, 0, 1), y: clamp(anchor ? anchor[1] + (before.y-anchor[1])*ratio : before.y, 0, 1), zoom };
    state = { ...state, camera, revision: state.revision+1 }; render();
    clearTimeout(zoomSave); zoomSave = setTimeout(save, 100);
  }

  function activateHotspot(node,event={}){
    if(tool)return;const place=map.places.find(p=>p.id===node.dataset.place);if(!place)return;selectPlace(place.id);
    if(node.dataset.action)activate(node.dataset.action);
    else{const next=cyclePlace(place,state,event.shiftKey||event.metaKey?-1:1);commit(next,`${place.name}: ${place.sequence?.[placeStep(place,next)]?.label||'Updated'}.`);}
  }
  function sizeHotspots(){
    const matrix=$('map').getScreenCTM();if(!matrix)return;
    const scale=.8/Math.hypot(matrix.a,matrix.b);
    for(const node of [...hotspots.values(),...doorHotspots.values()]){const glyph=node.querySelector('.hotspot-glyph');glyph.setAttribute('transform',`translate(${glyph.dataset.x} ${glyph.dataset.y}) scale(${scale})`);}
  }
  function makeHotspot(place,point,number,area,action){
    const node=svgNode('g',{class:'hotspot',role:'button',tabindex:0,'data-place':place.id,...(action?{'data-action':action}:{})});
    if(area)node.append(svgNode('polygon',{points:polygon(area),fill:'transparent'}));
    const[x,y]=xy(point),glyph=svgNode('g',{class:'hotspot-glyph','data-x':x,'data-y':y});
    glyph.append(svgNode('circle',{r:action?17:21,fill:'#172a21',stroke:'#e8ba71','stroke-width':2}));
    glyph.append(svgNode('text',{'text-anchor':'middle',y:6,'font-size':action?13:17,'pointer-events':'none'},number));
    glyph.append(svgNode('text',{class:'event-step','text-anchor':'middle',y:action?-25:-30,'font-size':14,'pointer-events':'none'},''));node.append(glyph);
    node.addEventListener('click',event=>{if(!drag)activateHotspot(node,event);});
    node.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();activateHotspot(node,event);}});
    return node;
  }

  if (!player) {
    new ResizeObserver(sizeHotspots).observe($('map-stage'));
    for (const [index, place] of map.places.entries()) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'place-button';
      const title = document.createElement('span');
      const number = document.createElement('b'); number.className='place-number';number.textContent=`${index+1}. `;
      title.append(number,document.createTextNode(place.name));
      button.append(title, document.createElement('span')); button.addEventListener('click', () => selectPlace(place.id));
      const row=document.createElement('div');row.className='place-row';row.dataset.placeRow=place.id;row.append(button);placeButtons.set(place.id,button);
      const expand=document.createElement('button');expand.type='button';expand.className='place-expand';expand.textContent='⌄';expand.setAttribute('aria-label',`Show ${place.name} states`);expand.setAttribute('aria-expanded','false');const sequence=document.createElement('div');sequence.className='place-inline-sequence';sequence.id=`sequence-${place.id}`;sequence.hidden=true;expand.setAttribute('aria-controls',sequence.id);const steps=[];
      function collapse(){sequence.hidden=true;expand.textContent='⌄';expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-label',`Show ${place.name} states`);row.classList.remove('expanded');}
      expand.addEventListener('click',()=>{const wasOpen=expandedPlace===place.id;for(const p of placeExpansions.values())p.collapse();expandedPlace=wasOpen?null:place.id;if(!wasOpen){sequence.hidden=false;expand.textContent='⌃';expand.setAttribute('aria-expanded','true');expand.setAttribute('aria-label',`Hide ${place.name} states`);row.classList.add('expanded');}});
      (place.sequence||[]).forEach((step,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1}/${place.sequence.length} · ${step.label}`;b.setAttribute('aria-label',`${place.name} state ${i+1}: ${step.label}`);b.addEventListener('click',()=>{selectPlace(place.id);commit(setPlaceStep(place,state,i),`${place.name}: ${step.label}.`);});sequence.append(b);steps.push(b);});
      placeExpansions.set(place.id,{row,collapse,steps});row.append(expand,sequence);$('places').append(row);
      const [x, y] = xy(place.point);
      const roof = map.interactions.find(item => item.type === 'roof' && item.placeId === place.id);
      const terrain=map.interactions.find(item=>item.type==='terrain'&&item.placeId===place.id&&!item.variant);
      const node=makeHotspot(place,place.point,String(index+1),roof?.polygon||terrain?.polygon);
      $('dm-hotspots').append(node);hotspots.set(place.id,node);
      const doors=map.interactions.filter(item=>item.type==='marker'&&item.placeId===place.id);
      doors.forEach((item,i)=>{const door=makeHotspot(place,item.point,`${index+1}${String.fromCharCode(97+i)}`,item.cover?.polygon,item.id);$('dm-hotspots').append(door);doorHotspots.set(item.id,door);});
    }
    document.addEventListener('pointerdown',e=>{if(expandedPlace&&!placeExpansions.get(expandedPlace)?.row.contains(e.target)){placeExpansions.get(expandedPlace)?.collapse();expandedPlace=null;}},true);
    selectPlace(selected);
    if(!map.places.length){$('places').previousElementSibling.hidden=true;$('places').hidden=true;announce('Custom map ready. Paint fog or add tokens and spell areas.');}
    setupSidebarResize();
    $('focus-place').addEventListener('click', () => { const place=map.places.find(p=>p.id===selected);if(!place)return;if(focusedPlace){focusedPlace=null;$('fit-map').click();return;}focusedPlace=place.id;commit({...state,camera:{x:place.point[0],y:place.point[1],zoom:place.focusZoom}},`Focused on ${place.name.toLowerCase()}.`,false); });
    $('zoom-in').addEventListener('click', () => zoomBy(1.25));
    $('zoom-out').addEventListener('click', () => zoomBy(.8));
    $('fit-map').addEventListener('click', () => commit({ ...state, camera: initialState(map).camera }, 'Showing the whole map.', false));
    $('snap-grid').addEventListener('change',event=>commit({...state,snap:event.target.checked},'Grid snapping updated.'));
    $('show-grid').addEventListener('change', event => commit({ ...state, grid: event.target.checked }, '', false));
    for(const button of gridColorButtons)button.addEventListener('click',()=>commit({...state,gridColor:button.dataset.gridColor},'',false));
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
    $('undo').addEventListener('click', () => {
      if(!history.length)return;
      const {restoreView,...previous}=history.pop();
      if(restoreView)ruler=restoreView.ruler;
      if(restoreView?.project){project=restoreView.project;director.render();}
      commit({ ...previous, camera: restoreView?previous.camera:state.camera, grid: restoreView?previous.grid:state.grid, gridColor: restoreView?previous.gridColor:state.gridColor }, 'Last encounter change undone.', false);
      if(restoreView)selectPlace(restoreView.selectedPlace);
    });
    $('open-player').addEventListener('click', () => {
      if((playerWindow&&!playerWindow.closed)||peers.size){
        send({type:'close-player'});announce('Closing the player display…');return;
      }
      save();const url=new URL(location.href);url.search=new URLSearchParams({view:'player',session,map:map.id,build:'20',popup:'1'}).toString();
      playerWindow=dmHost?dmHost.openPlayer(url):openPlayerWindow(url);
      if(playerWindow){updateConnection();announce('Move the player window to your TV/projector using an extended display.');}
      else announce('Your browser blocked the player window. Allow pop-ups for this page and try again.');
    });
    $('map-stage').addEventListener('wheel', event => { event.preventDefault(); zoomBy(Math.exp(-event.deltaY * .0015), pointAt(event)); }, { passive: false });
    $('map').addEventListener('pointerdown', event => {
      if(event.button!==0||drag||['paint','erase'].includes(tool))return;
      const p = pointAt(event);
      if(measuring){if(inBounds(p)){ruler=[p,p];drag={id:event.pointerId,measure:true,start:structuredClone(state),moved:false};$('map').setPointerCapture(event.pointerId);renderRuler(true);}return;}
      const token = party.contains(event.target);
      const ctm = $('map').getScreenCTM();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: { ...state.camera }, scale: ctm.a, point: p, start: structuredClone(state), token, moved: false, hotspot: !!event.target.closest('.hotspot') };
      if (token) event.preventDefault();
      $('map').setPointerCapture(event.pointerId);
    });
    $('map').addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      if(drag.measure){const p=pointAt(event);if(p){ruler=[ruler[0],p.map(n=>clamp(n,0,1))];drag.moved=true;renderRuler(true);}return;}
      const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
      if (Math.hypot(dx, dy) < (drag.token ? 3 : 4) && !drag.moved) return;
      drag.moved = true;
      if (drag.token) {
        const p = pointAt(event);
        if (!p) return;
        let position=drag.start.party.map((n,axis)=>clamp(n+p[axis]-drag.point[axis],0,1));if(state.snap)position=snapPoint(map,position);state=moveParty(state,position);
        if(!partyFrame)partyFrame=requestAnimationFrame(paintParty);return;
      }
      else state = { ...state, camera: { x: clamp(drag.camera.x-dx/drag.scale/map.width, 0, 1), y: clamp(drag.camera.y-dy/drag.scale/map.height, 0, 1), zoom: drag.camera.zoom } };
      render();
    });
    const endDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      cancelAnimationFrame(partyFrame);partyFrame=0;const finished = drag;
      if(finished.measure){if(!finished.moved)ruler=[];drag=null;renderRuler(true);return;}
      if (finished.moved) {
        if (finished.token) { history.push(finished.start); if (history.length > 40) history.shift(); }
        state.revision += 1; render(); save();
        if (finished.token) announce('Party moved.');
      }
      // Pointer capture redirects click; handle a stationary building click explicitly.
      if (!finished.moved && finished.hotspot) {
        const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('.hotspot');
        if(hit)activateHotspot(hit,event);
      }
      setTimeout(() => { if (drag === finished) drag = null; }, 0);
    };
    $('map').addEventListener('pointerup', endDrag);
    $('map').addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) { cancelAnimationFrame(partyFrame);partyFrame=0;state=drag.start;drag=null;render();livePositions(); } });

  }

  function receive(message) {
    if (!message || typeof message !== 'object') return;
    if(!player&&message.type==='hello'){
      if(typeof message.playerId==='string'){peers.set(message.playerId,Date.now());lastPeer=Date.now();updateConnection();}
      if(runtimeReady){const presentation=readStored(`${sessionKey}:presentation`);if(presentation)send({type:'presentation',presentation});else publish();}
    }
    if(!player&&message.type==='scene-hello')publish();
    if(!player&&message.type==='bye'){peers.delete(message.playerId);updateConnection();}
    if(!player&&message.type==='close-blocked')announce('This player tab was opened manually. Close it using the browser’s tab controls.');
    if(!player&&message.type==='display-error')announce('The player map could not load. Close and reopen the player display to retry.');
    if(player&&message.mapId===map.id&&message.revision===state.revision&&message.type==='positions'&&Number.isSafeInteger(message.sequence)&&message.sequence>lastPositionSequence){
      lastPositionSequence=message.sequence;const positions=new Map((Array.isArray(message.positions)?message.positions:[]).filter(p=>p&&typeof p.id==='string'&&inBounds(p.position)).map(p=>[p.id,{position:p.position,...(Number.isSafeInteger(p.stack)&&p.stack>=0?{stack:p.stack}:{})}]));
      state={...state,roster:state.roster.map(m=>({...m,...(positions.get(m.id)||{})})),monsters:state.monsters.map(m=>({...m,...(positions.get(m.id)||{})}))};
      if(inBounds(message.party)){state.party=message.party;const[x,y]=xy(state.party);party.setAttribute('transform',`translate(${x} ${y})`);}encounter.renderCharacterPositions();
    }
    if(player&&message.mapId===map.id&&message.revision===state.revision&&message.type==='fog-preview'){state={...state,fog:normalizeFog(message.fog)};fog.render();}
    if(player&&message.type==='ruler'&&message.mapId===map.id&&Array.isArray(message.points)&&message.points.length<=2&&message.points.every(inBounds)){ruler=message.points;renderRuler();}
    if (player && message.type === 'state' && message.state?.mapId === map.id && message.state?.mapVersion === map.version) {
      const incoming = playerProjection(sanitizeState(map, message.state));
      if (incoming.revision >= state.revision) { state = incoming;lastPositionSequence=-1; render(); }
      lastPeer = Date.now(); updateConnection();
    }
  }
  if (channel) channel.onmessage = event => receive(event.data);
  window.addEventListener('storage', event => {
    if (event.key !== `${sessionKey}:signal` || !event.newValue) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* Ignore unrelated or invalid storage data. */ }
  });
  function updateConnection() {
    for(const [id,seen] of peers)if(Date.now()-seen>7000)peers.delete(id);
    const connected=player?Date.now()-lastPeer<15000:!!((playerWindow&&!playerWindow.closed)||peers.size);
    $('connection-status').textContent=player?(connected?'Following the DM':'DM disconnected · last view kept'):(connected?'Player display connected':'Player display not open');
    if(!player){$('open-player').replaceChildren(document.createTextNode(connected?'Close player display ':'Open player display '));const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent=connected?'↙':'↗';$('open-player').append(arrow);}
  }
  if(!embedded)setInterval(updateConnection,1000);
  window.addEventListener('pagehide',()=>{if(!player&&runtimeReady)save();});
  if(!player){director=createDirector({catalog,mapId:map.id,getProject:()=>project,setProject,prepareMap,announce});createLibraries({map,getState:()=>state,commit,announce});createMapUpload({sessionKey,catalog,onAdded:entry=>{setProject({...project,maps:[...project.maps,entry.id]});mapMenu.addEntry(entry);},announce});}
  if(embedded){
    let lastActivity=0;
    const activity=()=>{if(performance.now()-lastActivity>100){lastActivity=performance.now();window.parent.postMessage({type:'player-activity'},location.origin);}};
    document.addEventListener('pointermove',activity);document.addEventListener('pointerdown',activity);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')window.parent.postMessage({type:'player-escape'},location.origin);});
  }
  if(!embedded)setupFullscreen({player,announce});
  render(); updateConnection();
  if(player)send({type:'scene-hello'});
  const loadImage = src => new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error('The map artwork could not load. Reload to try again.')); image.src = src; });
  await Promise.all([...Object.values(artwork).map(loadImage), ...PORTRAIT_ASSETS.map(loadImage)]);
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
