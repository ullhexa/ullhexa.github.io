import {exportAssets,referencedAssets,validAsset,putAssets} from './local-assets.js?v=23';
import {validCustomEntry,customCatalog,saveCustomCatalog} from './custom-maps.js?v=23';
import {restoreSave,MAX_SAVE_BYTES} from './save-file.js?v=23';
import {validateMap} from './state.js?v=23';
export function createSessionBundle({sessionKey,catalog,loadMap,getState,readMapState,saveCurrent}){
  const session=sessionKey.split(':').at(-1);
  return {
    async export(data){saveCurrent();const customMaps=customCatalog(sessionKey),mapStates=[];for(const id of data.project?.maps||[data.state.mapId]){const entry=catalog.find(e=>e.id===id);if(!entry)throw new Error('A prepared map is missing.');const map=await loadMap(entry),state=id===data.state.mapId?data.state:readMapState(map);mapStates.push(state);}const result={...data,customMaps,mapStates};result.assets=await exportAssets(result);const text=JSON.stringify(result);if(new TextEncoder().encode(text).length>MAX_SAVE_BYTES)throw new Error('This session exceeds the 64 MB portable-save limit. Use smaller image assets.');return text;},
    async validate(data){
      if(data.version===1)return {catalog,states:[],assets:[],customMaps:[]};
      const customMaps=data.customMaps||[],assets=data.assets||[],states=data.mapStates||[];
      if(!Array.isArray(customMaps)||customMaps.length>40||!customMaps.every(validCustomEntry)||new Set(customMaps.map(m=>m.id)).size!==customMaps.length)throw new Error('This save contains invalid custom maps.');
      if(!Array.isArray(assets)||assets.length>1000||!assets.every(validAsset)||new Set(assets.map(a=>a.id)).size!==assets.length)throw new Error('This save contains invalid image assets.');
      if(!Array.isArray(states)||states.length>100||new Set(states.map(s=>s.mapId)).size!==states.length)throw new Error('This save contains invalid map states.');
      const combined=[...catalog.filter(e=>!customMaps.some(m=>m.id===e.id)),...customMaps],validated=[];
      for(const state of states){const entry=combined.find(e=>e.id===state.mapId);if(!entry)throw new Error('A saved map is unavailable.');const map=entry.map?validateMap(entry.map):await loadMap(entry);restoreSave(map,{...data,state,view:{selectedPlace:map.places[0]?.id||null,ruler:[]}});validated.push({map,state});}
      const refs=referencedAssets({...data,assets:undefined});if([...refs].some(id=>!assets.some(a=>a.id===id)))throw new Error('This save is missing an uploaded image.');
      // Decode all uploaded raster data before any encounter or library is changed.
      for(const a of assets){const image=new Image();image.src=a.data;try{await image.decode();}catch{throw new Error('An image in this save is damaged.');}if(image.naturalWidth!==a.width||image.naturalHeight!==a.height)throw new Error('An image has invalid dimensions.');}
      return {catalog:combined,states:validated,assets,customMaps};
    },
    async apply(prepared,data){if(data.version===1)return;await putAssets(prepared.assets);saveCustomCatalog(sessionKey,prepared.customMaps);catalog.splice(0,catalog.length,...prepared.catalog);for(const{map,state}of prepared.states)localStorage.setItem(`lanternford:${map.id}:${map.version}:${session}`,JSON.stringify(state));localStorage.setItem(`${sessionKey}:campaign`,JSON.stringify(data.state.campaign));}
  };
}
