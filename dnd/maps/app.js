import { validateMap, initialState, sanitizeState, isVisible, toggleInteraction, distanceBetween } from './state.js?v=4';
import { createEncounterTools } from './encounter-tools.js?v=4';
import { playerProjection, formation, moveParty, PORTRAIT_ASSETS } from './encounter-state.js?v=4';
import { createMapMenu } from './map-menu.js?v=4';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const query = new URLSearchParams(location.search);
const player = query.get('view') === 'player';
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
  if (player) {
    $('dm-panel').remove();
    $('open-maps').remove();
    $('map-dialog').remove();
    $('view-label').textContent = 'PLAYER DISPLAY';
    $('gesture-hint').textContent = 'View follows the DM';
    $('live-message').textContent = 'Waiting for the DM…';
    $('map').setAttribute('aria-label', 'Player map of the Last Lantern crossing');
  }
  const catalog = (await fetchJSON('./maps/catalog.json?v=4')).maps;
  const remembered = readStored('lanternford:last-session');
  const session = query.get('session') || (player ? null : (typeof remembered === 'string' ? remembered : crypto.randomUUID()));
  if (!session || !/^[a-zA-Z0-9-]{1,80}$/.test(session)) throw new Error('Open this player display using the button in the DM window.');
  if (!player && !query.has('session')) writeStored('lanternford:last-session', session);
  const sessionKey = `lanternford:session:${session}`;
  const selectedMap = query.get('map') || readStored(`${sessionKey}:map`);
  const entry = catalog.find(item => item.id === selectedMap) || catalog[0];
  const loadMap = async item => {
    const content=validateMap(await fetchJSON(`${item.manifest}?v=4`));
    if(content.id!==item.id)throw new Error('The map catalog and content do not match.');
    return content;
  };
  const map = await loadMap(entry);
  const notes = player ? {} : await fetchJSON(entry.notes);
  document.title = `${map.title} — ${player ? 'Player display' : 'Interactive map playtest'}`;
  document.querySelector('.map-name').textContent = `${map.title} · ${entry.subtitle}`;
  $('map').setAttribute('aria-label', `${player ? 'Player' : 'Interactive'} map of ${map.title}`);
  $('map').querySelector('title').textContent = `${map.title} encounter map`;
  if(!player) {
    document.querySelector('.encounter-heading h1').textContent=map.title;
    document.querySelector('.encounter-heading .eyebrow').textContent=entry.category.toUpperCase();
    document.querySelector('.encounter-heading .intro').textContent=entry.description;
    createMapMenu({catalog,activeId:map.id,activeMap:map,loadMap,applyMap:id=>{
      if(id===map.id){announce(`${map.title} is already in play. Your progress is kept.`);return;}
      save();const url=new URL(location.href);url.searchParams.set('map',id);location.assign(url);
    }});
  }
  const key = `lanternford:${map.id}:${map.version}:${session}`;
  const previousSave = readStored(key) || (map.previousVersions || []).map(version => readStored(`lanternford:${map.id}:${version}:${session}`)).find(Boolean);
  let state = sanitizeState(map, previousSave);
  if (player) state = playerProjection(state);
  let selected = map.places[0].id;
  let history = [];
  let lastPeer = 0;
  let ruler = [];
  let measuring = false;
  let drag = null;
  let zoomSave;
  let storageWorks = true;
  let channel;
  try { channel = new BroadcastChannel(sessionKey); } catch { /* Storage events also synchronize windows. */ }
  const send = value => { channel?.postMessage(value); writeStored(`${sessionKey}:signal`, { ...value, nonce: crypto.randomUUID() }); };
  const announce = text => { $('live-message').textContent = text; };
  const xy = point => [point[0] * map.width, point[1] * map.height];
  const polygon = points => points.map(point => xy(point).join(',')).join(' ');
  const defs = $('map').querySelector('defs');
  const dimensions = { width: map.width, height: map.height };
  const layerNodes = new Map();
  const placeButtons = new Map();
  const actionButtons = new Map();
  const hotspots = new Map();
  $('map-grid').setAttribute('width', map.grid.size);
  $('map-grid').setAttribute('height', map.grid.size);
  $('map-grid').firstElementChild.setAttribute('d', `M${map.grid.size} 0H0V${map.grid.size}`);
  for (const [attr, value] of Object.entries(dimensions)) $('grid-overlay').setAttribute(attr, value);
  $('scale-label').textContent = `1 square = ${map.grid.distance} ${map.grid.unit}`;
  $('artwork').append(svgNode('image', { ...dimensions, href: map.art.base }));

  for (const item of map.interactions) {
    let node;
    if (item.type === 'roof' || item.type === 'terrain') {
      const clip = svgNode('clipPath', { id: `clip-${item.id}` });
      clip.append(svgNode('polygon', { points: polygon(item.polygon) }));
      defs.append(clip);
      node = svgNode('image', { ...dimensions, href: item.type === 'roof' ? map.art.roofs : map.art[item.asset], 'clip-path': `url(#clip-${item.id})`, 'pointer-events': 'none' });
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
    layerNodes.set(item.id, node);
  }

  const party = svgNode('g', { class: 'party-token', ...(player ? {} : { role: 'button', tabindex: 0, 'aria-label': 'Party marker. Drag or use arrow keys to move one square.' }) });
  party.append(svgNode('circle', { r: 21, fill: '#203d48', stroke: '#e9e7bb', 'stroke-width': 3 }));
  party.append(svgNode('circle', { r: 12, fill: '#84c5d6', opacity: .28 }));
  party.append(svgNode('text', { 'text-anchor': 'middle', y: 5, fill: '#fff9dc', 'font-size': 14, 'font-weight': 700 }, 'P'));
  party.append(svgNode('text', { class: 'marker-label', 'text-anchor': 'middle', y: 39, 'font-size': 16 }, 'Party'));
  $('party-layer').append(party);
  const encounter = createEncounterTools({ map, player, getState: () => state, commit, pointAt, announce,
    preview: next => { state = next; render(); },
    finishDrag: (before, message) => { history.push(before); if (history.length > 40) history.shift(); state.revision += 1; render(); save(); announce(message); }
  });

  function remember() { history.push(structuredClone(state)); if (history.length > 40) history.shift(); }
  function save() {
    if (player) return;
    storageWorks = writeStored(key, state);
    writeStored(`${sessionKey}:map`,map.id);
    $('save-status').textContent = storageWorks ? 'Saved in this browser' : 'Session only · storage unavailable';
    send({ type: 'map', mapId: map.id });
    send({ type: 'state', state: playerProjection(state) });
    send({ type: 'ruler', points: ruler });
  }
  function commit(next, message, undoable = true) {
    if (player) return;
    if (undoable) remember();
    state = { ...next, revision: state.revision + 1 };
    render(); save();
    if (message) announce(message);
  }
  function activate(id) {
    const item = map.interactions.find(item => item.id === id);
    try { const next = toggleInteraction(map, state, id); commit(next, next.active.includes(id) ? item.label.replace(/^Remove/, 'Removed').replace(/^Reveal/, 'Revealed') + '.' : item.activeLabel + '.'); }
    catch (error) { announce(error.message); }
  }
  function selectPlace(id) {
    selected = id;
    const place = map.places.find(place => place.id === id);
    $('selected-title').textContent = `${map.places.indexOf(place)+1}. ${place.name}`;
    $('selected-note').textContent = notes[id] || 'Explore this part of the crossing.';
    $('selected-actions').replaceChildren(); actionButtons.clear();
    for (const id of place.actions) {
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
      const count = place.actions.filter(id => isVisible(map, state, id)).length;
      if (button) button.lastElementChild.textContent = place.id === 'bridge' ? (state.active.includes('bridge-broken') ? 'Broken' : 'Intact') : place.actions.length ? `${count}/${place.actions.length} revealed` : 'Crossing';
      const node = hotspots.get(place.id);
      if (node) node.querySelector('circle').setAttribute('fill', place.id === selected ? '#e8ba71' : '#172a21');
    }
    for (const [id, button] of actionButtons) {
      const item = map.interactions.find(item => item.id === id);
      const on = state.active.includes(id);
      button.textContent = on ? item.activeLabel : item.label;
      button.setAttribute('aria-pressed', on);
      button.disabled = !on && (item.requires || []).some(dep => !isVisible(map, state, dep));
      button.title = button.disabled ? 'Reveal the surrounding area first.' : '';
    }
    $('undo').disabled = history.length === 0;
    if (selected === 'bridge') $('selected-note').textContent = state.active.includes('bridge-broken') ? 'The bridge has collapsed. The party needs another way across the river; restore it whenever your story calls for a usable crossing.' : notes.bridge;
    const overview = Math.abs(state.camera.zoom-1)<.001 && Math.abs(state.camera.x-.5)<.001 && Math.abs(state.camera.y-.5)<.001;
    $('sidebar-overview').disabled = overview;
    $('fit-map').disabled = overview;
  }
  function render() {
    for (const item of map.interactions) {
      const visible = isVisible(map, state, item.id);
      layerNodes.get(item.id).style.display = (['marker','terrain'].includes(item.type) ? visible : !visible) ? '' : 'none';
    }
    const { x, y, zoom } = state.camera;
    const w = map.width / zoom, h = map.height / zoom;
    $('map').setAttribute('viewBox', `${x * map.width - w / 2} ${y * map.height - h / 2} ${w} ${h}`);
    $('zoom-value').textContent = `${Math.round(zoom * 100)}%`;
    $('zoom-out').disabled = zoom <= 1;
    $('zoom-in').disabled = zoom >= 4;
    $('grid-overlay').style.display = state.grid ? '' : 'none';
    $('show-grid').checked = state.grid;
    const [px, py] = xy(state.party); party.setAttribute('transform', `translate(${px} ${py})`);
    $('party-layer').style.display = state.tokenMode === 'party' ? '' : 'none';
    $('party-hint').textContent = state.tokenMode === 'party' ? 'Drag the party marker to move.' : 'Drag each character to move freely.';
    encounter.render(); renderControls(); renderRuler();
  }
  function renderRuler(broadcast = false) {
    if (broadcast && !player) send({ type: 'ruler', points: ruler });
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
  function snapped(p) { return p.map((n, index) => { const size = index ? map.height : map.width; return clamp((Math.floor(n * size / map.grid.size) + .5) * map.grid.size / size, map.grid.size/size/2, 1-map.grid.size/size/2); }); }
  function zoomBy(factor, anchor) {
    const before = state.camera;
    const zoom = clamp(before.zoom * factor, 1, 4);
    const ratio = before.zoom / zoom;
    const camera = zoom === 1 ? { x: .5, y: .5, zoom } : { x: clamp(anchor ? anchor[0] + (before.x-anchor[0])*ratio : before.x, 0, 1), y: clamp(anchor ? anchor[1] + (before.y-anchor[1])*ratio : before.y, 0, 1), zoom };
    state = { ...state, camera, revision: state.revision+1 }; render();
    clearTimeout(zoomSave); zoomSave = setTimeout(save, 100);
  }

  if (!player) {
    for (const [index, place] of map.places.entries()) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'place-button';
      const title = document.createElement('span');
      const number = document.createElement('b'); number.className='place-number';number.textContent=`${index+1}. `;
      title.append(number,document.createTextNode(place.name));
      button.append(title, document.createElement('span')); button.addEventListener('click', () => selectPlace(place.id));
      $('places').append(button); placeButtons.set(place.id, button);
      const [x, y] = xy(place.point);
      const roof = map.interactions.find(item => item.type === 'roof' && item.placeId === place.id);
      const node = svgNode('g', { class: 'hotspot', role: 'button', tabindex: 0, 'aria-label': roof ? `Toggle ${place.name} roof` : `Inspect ${place.name}` });
      if (roof) node.append(svgNode('polygon', { points: polygon(roof.polygon), fill: 'transparent' }));
      node.append(svgNode('circle', { cx: x, cy: y, r: 22, fill: '#172a21', stroke: '#e8ba71', 'stroke-width': 2 }));
      node.append(svgNode('text', { x, y: y+6, 'text-anchor': 'middle', 'font-size': 17, 'pointer-events': 'none' }, index+1));
      const click = () => { if (measuring) return; selectPlace(place.id); if (roof) activate(roof.id); };
      node.addEventListener('click', event => { if (drag) return; click(); });
      node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); click(); } });
      $('dm-hotspots').append(node); hotspots.set(place.id, node);
    }
    selectPlace(selected);
    $('focus-place').addEventListener('click', () => { const place = map.places.find(place => place.id === selected); commit({ ...state, camera: { x: place.point[0], y: place.point[1], zoom: place.focusZoom } }, `Focused on ${place.name.toLowerCase()}.`, false); });
    $('zoom-in').addEventListener('click', () => zoomBy(1.25));
    $('zoom-out').addEventListener('click', () => zoomBy(.8));
    $('fit-map').addEventListener('click', () => commit({ ...state, camera: initialState(map).camera }, 'Showing the whole crossing.', false));
    $('sidebar-overview').addEventListener('click', () => $('fit-map').click());
    $('show-grid').addEventListener('change', event => commit({ ...state, grid: event.target.checked }, '', false));
    $('measure').addEventListener('click', () => {
      measuring = !measuring; ruler = []; $('measure').setAttribute('aria-pressed', measuring);
      $('map').style.cursor = measuring ? 'crosshair' : '';
      announce(measuring ? 'Click two points to measure a straight-line distance. Press Escape to stop.' : 'Measurement off.'); renderRuler(true);
    });
    $('clear-measurement').addEventListener('click', () => { ruler = []; renderRuler(true); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && measuring) $('measure').click(); });
    $('undo').addEventListener('click', () => { if (history.length) { const previous = history.pop(); commit({ ...previous, camera: state.camera, grid: state.grid }, 'Last encounter change undone.', false); } });
    $('reset-session').addEventListener('click', () => $('reset-dialog').showModal());
    $('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
    $('confirm-reset').addEventListener('click', () => { ruler = []; const fresh = initialState(map); const positions = formation(map, fresh.party, state.roster.length); encounter.clearSelection(); commit({ ...fresh, roster: state.roster.map((p,i) => ({...p,position:positions[i]})) }, 'The encounter is ready to begin again.'); $('reset-dialog').close(); });
    $('open-player').addEventListener('click', () => {
      save(); const url = new URL(location.href); url.search = new URLSearchParams({ view: 'player', session, map: map.id }).toString();
      const opened = window.open(url, `lanternford-player-${session}`, 'popup,width=1280,height=800');
      if (opened) { opened.focus(); announce('Move the player window to your TV/projector using an extended display.'); }
      else announce('Your browser blocked the player window. Allow pop-ups for this page and try again.');
    });
    $('map').addEventListener('wheel', event => { event.preventDefault(); zoomBy(Math.exp(-event.deltaY * .0015), pointAt(event)); }, { passive: false });
    $('map').addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag) return;
      const p = pointAt(event);
      if (measuring) { if (inBounds(p)) { if (ruler.length === 2) ruler = []; ruler.push(p); renderRuler(true); if (ruler.length === 2) announce(`Straight-line distance: ${distanceBetween(map, ...ruler).toFixed(1)} ${map.grid.unit}.`); } return; }
      const token = party.contains(event.target);
      const ctm = $('map').getScreenCTM();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: { ...state.camera }, scale: ctm.a, start: structuredClone(state), token, moved: false, hotspot: !!event.target.closest('.hotspot') };
      if (token) event.preventDefault();
      $('map').setPointerCapture(event.pointerId);
    });
    $('map').addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
      if (Math.hypot(dx, dy) < 4 && !drag.moved) return;
      drag.moved = true;
      if (drag.token) state = moveParty(state, snapped(pointAt(event)));
      else state = { ...state, camera: { x: clamp(drag.camera.x-dx/drag.scale/map.width, 0, 1), y: clamp(drag.camera.y-dy/drag.scale/map.height, 0, 1), zoom: drag.camera.zoom } };
      render();
    });
    const endDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const finished = drag;
      if (finished.moved) {
        if (finished.token) { history.push(finished.start); if (history.length > 40) history.shift(); }
        state.revision += 1; render(); save();
        if (finished.token) announce('Party moved to the selected square.');
      }
      // Pointer capture redirects click; handle a stationary building click explicitly.
      if (!finished.moved && finished.hotspot) {
        const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('.hotspot');
        if (hit) { const placeId = [...hotspots].find(([, node]) => node === hit)?.[0]; if (placeId) { selectPlace(placeId); const roof = map.interactions.find(item => item.type === 'roof' && item.placeId === placeId); if (roof) activate(roof.id); } }
      }
      setTimeout(() => { if (drag === finished) drag = null; }, 0);
    };
    $('map').addEventListener('pointerup', endDrag);
    $('map').addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) { state = drag.start; drag = null; render(); } });
    party.addEventListener('keydown', event => {
      const offset = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[event.key];
      if (!offset) return; event.preventDefault();
      commit(moveParty(state, snapped([state.party[0]+offset[0]*map.grid.size/map.width, state.party[1]+offset[1]*map.grid.size/map.height])), 'Party moved one square.');
    });
  }

  function receive(message) {
    if (!message || typeof message !== 'object') return;
    if (!player && message.type === 'hello') { lastPeer = Date.now(); send({ type: 'map', mapId: map.id }); send({ type: 'state', state: playerProjection(state) }); send({ type: 'ruler', points: ruler }); updateConnection(); }
    if (player && message.type === 'map' && message.mapId !== map.id && catalog.some(item=>item.id===message.mapId)) {
      const url=new URL(location.href);url.searchParams.set('map',message.mapId);location.replace(url);return;
    }
    if (player && message.type === 'ruler' && Array.isArray(message.points) && message.points.length <= 2 && message.points.every(inBounds)) { ruler = message.points; renderRuler(); }
    if (player && message.type === 'state' && message.state?.mapId === map.id && message.state?.mapVersion === map.version) {
      const incoming = playerProjection(sanitizeState(map, message.state));
      if (incoming.revision >= state.revision) { state = incoming; render(); }
      lastPeer = Date.now(); updateConnection();
      announce('Explore the crossing. The DM controls what appears here.');
    }
  }
  if (channel) channel.onmessage = event => receive(event.data);
  window.addEventListener('storage', event => {
    if (event.key !== `${sessionKey}:signal` || !event.newValue) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* Ignore unrelated or invalid storage data. */ }
  });
  function updateConnection() {
    const connected = Date.now()-lastPeer < 15000;
    $('connection-status').textContent = player ? (connected ? 'Following the DM' : 'DM disconnected · last view kept') : (connected ? 'Player display connected' : 'Player display not open');
  }
  setInterval(() => { if (player) send({ type: 'hello' }); updateConnection(); }, 5000);
  window.addEventListener('pagehide', () => { if (!player) save(); });
  $('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { announce('Use your browser’s full-screen command for this display.'); }
  });
  document.addEventListener('fullscreenchange', () => $('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen');
  render(); updateConnection();
  if (!player) save(); else send({ type: 'hello' });
  const loadImage = src => new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error('The map artwork could not load. Reload to try again.')); image.src = src; });
  await Promise.all([...Object.values(map.art).map(loadImage), ...PORTRAIT_ASSETS.map(loadImage)]);
  $('map-loading').hidden = true;

  // Optional browser-native agent tools use the same state transitions as the visible controls.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(error => console.warn('Optional browser tool unavailable:', error)); } catch (error) { console.warn('Optional browser tool unavailable:', error); } };
    register({ name: 'read_map_state', description: 'Read the current Last Lantern encounter state and visible discoveries.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true }, execute: async () => ({ content: [{ type: 'text', text: JSON.stringify({ map: map.title, role: player ? 'player' : 'dm', active: map.interactions.filter(item => isVisible(map,state,item.id)).map(item=>item.id), camera: state.camera, party: state.party, tokenMode: state.tokenMode, roster: state.roster, shapes: state.shapes }) }] }) });
    if (!player) register({ name: 'set_map_reveal', description: 'Reveal or conceal a map interaction in the DM encounter. The player display follows.', annotations: { readOnlyHint: false }, inputSchema: { type: 'object', properties: { id: { type: 'string', enum: map.interactions.map(item=>item.id) }, revealed: { type: 'boolean' } }, required: ['id','revealed'], additionalProperties: false }, execute: async ({ id, revealed }) => {
      if (!map.interactions.some(item => item.id === id) || typeof revealed !== 'boolean') throw new Error('Invalid reveal request.');
      if (state.active.includes(id) !== revealed) commit(toggleInteraction(map,state,id), 'Encounter reveal updated.');
      return { content: [{ type: 'text', text: JSON.stringify({ id, revealed: isVisible(map,state,id) }) }] };
    } });
  }
}
start().catch(error => { $('map-loading').textContent = error.message; $('map-loading').hidden = false; $('live-message').textContent = 'The encounter could not start. Reload this page to try again.'; console.error(error); });
