import {mapTokens} from './combat-state.js?v=97';

const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1);
// Transient geometry only: never send member records, private drafts or hidden areas.
export function publicAreaPreview(state,gesture){
  const area=state.shapes.find(s=>s.id===gesture?.shape&&s.visible!==false);
  const member=mapTokens(state).find(m=>m.id===gesture?.character&&!m.item&&m.aura&&(m.monster?m.visible:state.tokenMode==='players'));
  return {shape:area?{id:area.id,center:[...area.center],size:area.size,rotation:area.rotation}:null,auraId:member?.id||null};
}
export function applyAreaPreview(state,value){
  const shape=value?.shape,existing=state.shapes.find(s=>s.id===shape?.id&&s.visible!==false);
  const valid=existing&&point(shape.center)&&Number.isInteger(shape.size)&&shape.size>=5&&shape.size<=200&&shape.size%5===0&&Number.isFinite(shape.rotation)&&shape.rotation>=0&&shape.rotation<360;
  const auraId=typeof value?.auraId==='string'?publicAreaPreview(state,{character:value.auraId}).auraId:null;
  if(!valid)return {state,shapeId:null,auraId};
  const length=shape.size*(existing.type==='circle'?2:1);
  return {state:{...state,shapes:state.shapes.map(s=>s.id===existing.id?{...s,center:[...shape.center],size:shape.size,rotation:shape.rotation,width:length,height:length}:s)},shapeId:existing.id,auraId};
}
