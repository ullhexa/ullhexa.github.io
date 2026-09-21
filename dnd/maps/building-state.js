import {numberedFloors} from './floor-controls.js?v=54';

export const isBuildingGlobal=item=>item?.type==='roof'||item?.variant==='collapsed';
export function buildingParts(map,place){
 const actions=map.interactions.filter(item=>place.actions.includes(item.id));
 return {roof:actions.find(item=>item.type==='roof'),collapsed:actions.find(item=>item.variant==='collapsed'),effects:actions.filter(item=>!isBuildingGlobal(item))};
}
export function effectLevels(place,item){
 const floors=numberedFloors(place).filter(({floor})=>floor.actions.includes(item.id));
 return floors.length?floors.map(({level})=>level):[1];
}
export function buildingCollapsed(map,state,placeId){return map.interactions.some(item=>item.placeId===placeId&&item.variant==='collapsed'&&state.active.includes(item.id));}
