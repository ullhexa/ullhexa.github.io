import { defaultRoster, normalizeEncounter } from './encounter-state.js?v=5';
export function validateMap(map) {
  if (!map || map.schemaVersion !== 1) throw new Error('Unsupported map format.');
  if (![map.id,map.version,map.title,map.grid?.unit].every(s=>typeof s==='string'&&s.length>0)) throw new Error('Missing map identity or units.');
  if (![map.art?.base,map.art?.roofs].every(s=>typeof s==='string'&&s.startsWith('./')&&!s.includes('..'))) throw new Error('Artwork must use relative asset paths.');
  if (![map.width,map.height,map.grid?.size,map.grid?.distance].every(n=>Number.isFinite(n)&&n>0)) throw new Error('Invalid map dimensions or scale.');
  if(!Array.isArray(map.places)||!Array.isArray(map.interactions)) throw new Error('Missing map objects.');
  const ids=new Set();
  for(const item of map.interactions){
    if(typeof item.id!=='string'||!/^[-a-zA-Z0-9]+$/.test(item.id)||ids.has(item.id))throw new Error('Interaction IDs must be unique and contain only letters, numbers, and hyphens.');
    ids.add(item.id);
    if(!['roof','fog','marker','terrain'].includes(item.type))throw new Error('Unsupported interaction type.');
    if(item.type==='terrain'&&(typeof map.art[item.asset]!=='string'||!map.art[item.asset].startsWith('./')||map.art[item.asset].includes('..')))throw new Error('Invalid terrain asset.');
    if(item.type==='marker'&&!validPoint(item.point))throw new Error('Invalid marker point.');
    if(item.type!=='marker'&&(!Array.isArray(item.polygon)||item.polygon.length<3||!item.polygon.every(validPoint)))throw new Error('Invalid polygon.');
  }
  for(const item of map.interactions)if(!Array.isArray(item.requires||[])||(item.requires||[]).some(id=>!ids.has(id)||id===item.id))throw new Error('Invalid interaction dependency.');
  const visit=(id,path=new Set())=>{if(path.has(id))throw new Error('Cyclic interaction dependency.'); for(const dep of map.interactions.find(item=>item.id===id).requires||[])visit(dep,new Set([...path,id]));};
  ids.forEach(id=>visit(id));
  const placeIds=new Set();
  for(const place of map.places){
    if(!place.id||placeIds.has(place.id)||!validPoint(place.point)||!Number.isFinite(place.focusZoom)||place.focusZoom<1||place.focusZoom>4||!Array.isArray(place.actions)||place.actions.some(id=>!ids.has(id)))throw new Error('Invalid place or action reference.');
    placeIds.add(place.id);
  }
  if(map.interactions.some(item=>!placeIds.has(item.placeId)))throw new Error('Unknown interaction place.');
  if(!validPoint(map.partyStart))throw new Error('Invalid party starting point.');
  return map;
}
export function validPoint(point){return Array.isArray(point)&&point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<=1);}
export function initialState(map){return {format:1,mapId:map.id,mapVersion:map.version,active:[],party:[...map.partyStart],grid:true,tokenMode:'party',regroupPlayers:false,roster:defaultRoster(map),shapes:[],camera:{x:0.5,y:0.5,zoom:1},revision:0};}
export function sanitizeState(map,input){
  const fresh=initialState(map);
  if(!input||input.format!==1||input.mapId!==map.id||(input.mapVersion!==map.version&&!(map.previousVersions||[]).includes(input.mapVersion)))return fresh;
  const ids=new Set(map.interactions.map(item=>item.id));
  fresh.active=Array.isArray(input.active)?[...new Set(input.active.filter(id=>ids.has(id)))]:[];
  if(validPoint(input.party))fresh.party=[...input.party];
  Object.assign(fresh,normalizeEncounter(map,input,fresh.party));
  fresh.grid=typeof input.grid==='boolean'?input.grid:true;
  if(input.camera&&validPoint([input.camera.x,input.camera.y])&&Number.isFinite(input.camera.zoom))fresh.camera={x:input.camera.x,y:input.camera.y,zoom:Math.max(1,Math.min(4,input.camera.zoom))};
  fresh.revision=Number.isSafeInteger(input.revision)&&input.revision>=0?input.revision:0;
  return fresh;
}
export function isVisible(map,state,id){
  const visit=(target,seen)=>{
    if(seen.has(target))return false;
    const item=map.interactions.find(i=>i.id===target);
    return !!item&&state.active.includes(target)&&(item.requires||[]).every(dep=>visit(dep,new Set([...seen,target])));
  };
  return visit(id,new Set());
}
export function toggleInteraction(map,state,id){
  const item=map.interactions.find(i=>i.id===id);
  if(!item)throw new Error('Unknown interaction.');
  if(!state.active.includes(id)&&(item.requires||[]).some(dep=>!isVisible(map,state,dep)))throw new Error('Reveal the surrounding area first.');
  return {...state,active:state.active.includes(id)?state.active.filter(value=>value!==id):[...state.active,id],revision:state.revision+1};
}
export function distanceBetween(map,a,b){return Math.hypot((b[0]-a[0])*map.width,(b[1]-a[1])*map.height)/map.grid.size*map.grid.distance;}
