import { sanitizeState, validPoint, GRID_COLORS } from './state.js?v=6';
import { PORTRAITS, SHAPE_TYPES, SHAPE_COLORS } from './encounter-state.js?v=6';

export const MAX_SAVE_BYTES = 256 * 1024;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = value => typeof value === 'string' && /^[-a-zA-Z0-9]{1,80}$/.test(value);
const unique = values => new Set(values).size === values.length;
const check = (ok, message = 'This save contains incomplete or invalid game data.') => { if (!ok) throw new Error(message); };

export function saveFilename(name) {
  let base=String(name).trim().replace(/(?:\.ullhexa)+$/i,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,100).replace(/[. ]+$/g,'');
  if(!base)base='Game save';
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base))base='_'+base;
  return base+'.ullhexa';
}

export function parseSave(text) {
  check(typeof text==='string'&&new TextEncoder().encode(text).length<=MAX_SAVE_BYTES,'This save is too large. Choose an .ullhexa game save under 256 KB.');
  let data;try{data=JSON.parse(text);}catch{throw new Error('This file is not a readable .ullhexa game save.');}
  check(object(data)&&data.kind==='ullhexa-map-save','This file is not an Ull Hexa map save.');
  check(data.version===1,'This save uses a newer or unsupported save format.');
  check(typeof data.name==='string'&&data.name.trim().length>0&&data.name.length<=120);
  check(typeof data.savedAt==='string'&&Number.isFinite(Date.parse(data.savedAt)));
  check(object(data.state)&&data.state.format===1&&id(data.state.mapId)&&typeof data.state.mapVersion==='string'&&data.state.mapVersion.length<=80);
  return data;
}

export function restoreSave(map,data) {
  const s=data.state;
  check(s.mapId===map.id,'This save belongs to a different map.');
  check(s.mapVersion===map.version||(map.previousVersions||[]).includes(s.mapVersion),'This save needs a map version that is not available here.');
  check(validPoint(s.party)&&typeof s.grid==='boolean'&&['party','players'].includes(s.tokenMode)&&typeof s.regroupPlayers==='boolean');
  check(s.gridColor===undefined||GRID_COLORS.includes(s.gridColor));
  check(object(s.camera)&&validPoint([s.camera.x,s.camera.y])&&Number.isFinite(s.camera.zoom)&&s.camera.zoom>=1&&s.camera.zoom<=4);
  check(Array.isArray(s.active)&&unique(s.active)&&s.active.every(value=>map.interactions.some(item=>item.id===value)));
  check(Array.isArray(s.roster)&&s.roster.length>=1&&s.roster.length<=12);
  check(s.roster.every(p=>object(p)&&id(p.id)&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=32&&Number.isInteger(p.portrait)&&p.portrait>=0&&p.portrait<PORTRAITS.length&&validPoint(p.position))&&unique(s.roster.map(p=>p.id)));
  check(Array.isArray(s.shapes)&&s.shapes.length<=32);
  check(s.shapes.every(area=>object(area)&&id(area.id)&&SHAPE_TYPES.includes(area.type)&&validPoint(area.center)&&[area.width,area.height].every(n=>Number.isInteger(n)&&n>=1&&n<=200)&&Number.isFinite(area.rotation)&&area.rotation>=0&&area.rotation<360&&SHAPE_COLORS.includes(area.color)&&typeof area.visible==='boolean')&&unique(s.shapes.map(area=>area.id)));
  check(object(data.view)&&map.places.some(place=>place.id===data.view.selectedPlace)&&Array.isArray(data.view.ruler)&&data.view.ruler.length<=2&&data.view.ruler.every(validPoint));
  return {state:sanitizeState(map,{...s,revision:0}),view:{selectedPlace:data.view.selectedPlace,ruler:data.view.ruler.map(p=>[...p])},name:data.name};
}

export function serializeSave(map,state,name,view,date=new Date()) {
  check(typeof name==='string'&&name.trim().length>0&&name.trim().length<=120,'Enter a name for your save.');
  const data={kind:'ullhexa-map-save',version:1,name:name.trim(),savedAt:date.toISOString(),state:{...sanitizeState(map,state),revision:0},view};
  // Keep the exported contract identical to the import contract.
  restoreSave(map,data);
  return JSON.stringify(data);
}
