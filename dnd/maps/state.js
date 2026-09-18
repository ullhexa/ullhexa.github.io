import {normalizeFog} from './fog-state.js?v=20';
import {assetId} from './combat-state.js?v=20';
import { defaultRoster, normalizeEncounter } from './encounter-state.js?v=20';
export const GRID_COLORS = ['map','black','white'];
export const defaultEnvironment = () => ({darkness:0});
export const validEnvironment = value => {
  if(!value || !Number.isInteger(value.darkness))return false;
  const legacy=value.timeOfDay!==undefined;
  return (!legacy || ['day','night'].includes(value.timeOfDay)) && value.darkness>=(legacy?40:0) && value.darkness<=95;
};
export function sanitizeEnvironment(value){
  // Legacy daytime saves kept an unused night strength; their visible state was fully light.
  if(value?.timeOfDay==='day')return defaultEnvironment();
  if(value?.timeOfDay!==undefined && value.timeOfDay!=='night')return defaultEnvironment();
  const legacy=value?.timeOfDay==='night';
  const darkness=Number.isFinite(value?.darkness)?Math.round(value.darkness):(legacy?78:0);
  return {darkness:Math.max(legacy?40:0,Math.min(95,darkness))};
}
export function validateMap(map) {
  if (!map || map.schemaVersion !== 1) throw new Error('Unsupported map format.');
  if (![map.id,map.version,map.title,map.grid?.unit].every(s=>typeof s==='string'&&s.length>0)) throw new Error('Missing map identity or units.');
  if (![map.art?.base,map.art?.roofs].every(s=>typeof s==='string'&&((s.startsWith('./')&&!s.includes('..'))||(map.userMap===true&&assetId(s))))) throw new Error('Artwork must use relative asset paths.');
  if (![map.width,map.height,map.grid?.size,map.grid?.distance].every(n=>Number.isFinite(n)&&n>0)) throw new Error('Invalid map dimensions or scale.');
  if (map.grid.color !== undefined && (typeof map.grid.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(map.grid.color))) throw new Error('Invalid map grid color.');
  if(!Array.isArray(map.places)||!Array.isArray(map.interactions)) throw new Error('Missing map objects.');
  const ids=new Set();
  for(const item of map.interactions){
    if(typeof item.id!=='string'||!/^[-a-zA-Z0-9]+$/.test(item.id)||ids.has(item.id))throw new Error('Interaction IDs must be unique and contain only letters, numbers, and hyphens.');
    ids.add(item.id);
    if(!['roof','fog','marker','terrain'].includes(item.type))throw new Error('Unsupported interaction type.');
    if(item.type==='terrain'&&(typeof map.art[item.asset]!=='string'||!map.art[item.asset].startsWith('./')||map.art[item.asset].includes('..')))throw new Error('Invalid terrain asset.');
    if(item.type==='marker'&&!validPoint(item.point))throw new Error('Invalid marker point.');
    if(item.cover!==undefined){
      const cover=item.cover,asset=map.art[cover?.asset];
      if(item.type!=='marker'||!cover||typeof asset!=='string'||!asset.startsWith('./')||asset.includes('..')||!Array.isArray(cover.polygon)||cover.polygon.length<3||!cover.polygon.every(validPoint))throw new Error('Invalid discovery cover.');
    }
    if(item.type!=='marker'&&(!Array.isArray(item.polygon)||item.polygon.length<3||!item.polygon.every(validPoint)))throw new Error('Invalid polygon.');
  }
  for(const item of map.interactions)if(!Array.isArray(item.requires||[])||(item.requires||[]).some(id=>!ids.has(id)||id===item.id))throw new Error('Invalid interaction dependency.');
  const visit=(id,path=new Set())=>{if(path.has(id))throw new Error('Cyclic interaction dependency.'); for(const dep of map.interactions.find(item=>item.id===id).requires||[])visit(dep,new Set([...path,id]));};
  ids.forEach(id=>visit(id));
  const placeIds=new Set();
  for(const place of map.places){
    if(!place.id||placeIds.has(place.id)||!validPoint(place.point)||!Number.isFinite(place.focusZoom)||place.focusZoom<1||place.focusZoom>4||!Array.isArray(place.actions)||place.actions.some(id=>!ids.has(id)))throw new Error('Invalid place or action reference.');
    if(place.sequence!==undefined&&(!Array.isArray(place.sequence)||place.sequence.length<2||place.sequence.length>8||place.sequence.some(step=>!step||typeof step.label!=='string'||!step.label||!Array.isArray(step.active)||new Set(step.active).size!==step.active.length||step.active.some(id=>!place.actions.includes(id)))))throw new Error('Invalid place sequence.');
    placeIds.add(place.id);
  }
  if(map.interactions.some(item=>!placeIds.has(item.placeId)))throw new Error('Unknown interaction place.');
  if(!validPoint(map.partyStart))throw new Error('Invalid party starting point.');
  if(map.lighting!==undefined){
    const polygon=value=>Array.isArray(value)&&value.length>=3&&value.every(validPoint);
    const lighting=map.lighting,lightIds=new Set();
    if(!lighting||!Array.isArray(lighting.occluders)||!lighting.occluders.every(polygon)||!Array.isArray(lighting.lights)||lighting.lights.length>64)throw new Error('Invalid map lighting.');
    for(const light of lighting.lights){
      if(!light||typeof light.id!=='string'||!/^[-a-zA-Z0-9]+$/.test(light.id)||lightIds.has(light.id)||!validPoint(light.point)||!Number.isFinite(light.radius)||light.radius<=0||light.radius>100||(light.clip!==undefined&&!polygon(light.clip))||!Array.isArray(light.requires||[])||(light.requires||[]).some(id=>!ids.has(id)))throw new Error('Invalid map light.');
      lightIds.add(light.id);
      if(!Array.isArray(light.excludes||[])||(light.excludes||[]).some(id=>!ids.has(id)))throw new Error('Invalid light exclusion.');
    }
  }
  return map;
}
export function validPoint(point){return Array.isArray(point)&&point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<=1);}
export function initialState(map){return {format:1,mapId:map.id,mapVersion:map.version,active:[],party:[...map.partyStart],grid:true,snap:false,fog:[],monsters:[],turnId:null,initiativeOverlay:{x:.02,y:.08,visible:true},gridColor:'map',environment:defaultEnvironment(),tokenMode:'party',regroupPlayers:false,roster:defaultRoster(map),shapes:[],camera:{x:0.5,y:0.5,zoom:1},revision:0};}
export function sanitizeState(map,input){
  const fresh=initialState(map);
  if(!input||input.format!==1||input.mapId!==map.id||(input.mapVersion!==map.version&&!(map.previousVersions||[]).includes(input.mapVersion)))return fresh;
  const ids=new Set(map.interactions.map(item=>item.id));
  fresh.active=Array.isArray(input.active)?[...new Set(input.active.filter(id=>ids.has(id)))]:[];
  if(validPoint(input.party))fresh.party=[...input.party];
  Object.assign(fresh,normalizeEncounter(map,input,fresh.party));
  fresh.snap=input.snap===true;fresh.fog=normalizeFog(input.fog);fresh.turnId=typeof input.turnId==='string'?input.turnId:null;
  if(input.initiativeOverlay&&validPoint([input.initiativeOverlay.x,input.initiativeOverlay.y]))fresh.initiativeOverlay={x:input.initiativeOverlay.x,y:input.initiativeOverlay.y,visible:input.initiativeOverlay.visible!==false};
  fresh.grid=typeof input.grid==='boolean'?input.grid:true;
  fresh.gridColor=GRID_COLORS.includes(input.gridColor)?input.gridColor:'map';
  fresh.environment=sanitizeEnvironment(input.environment);
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
