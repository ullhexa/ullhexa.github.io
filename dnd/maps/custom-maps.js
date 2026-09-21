import {IMAGE_ACCEPT,imageTypeNote,validImageDimensions} from './image-import.js?v=54';
import {readSessionValue,writeSessionValue} from './session-storage.js?v=54';
import {uploadImage,assetURL,assetRecord,putAssets} from './local-assets.js?v=54';
import {el} from './editor-dom.js?v=54';
import {editMapGrid} from './grid-editor.js?v=54';
import {assetId,safeId} from './combat-state.js?v=54';
export function customCatalog(sessionKey){try{const entries=readSessionValue(`${sessionKey}:custom-maps`)||[];return entries.filter(validCustomEntry);}catch{return [];}}
export function validCustomEntry(e){const m=e?.map;return !!(e&&safeId(e.id)&&e.id.startsWith('custom-')&&m&&m.id===e.id&&m.schemaVersion===1&&m.version==='1'&&e.thumbnail===m.art?.base&&e.title===m.title&&Object.keys(m.art||{}).every(k=>['base','roofs'].includes(k))&&m.lighting===undefined&&m.userMap===true&&typeof m.title==='string'&&m.title.length<=80&&m.width>=100&&m.height>=100&&validImageDimensions(m.width,m.height)&&Number.isFinite(m.grid?.size)&&m.grid.size>=1&&Number.isInteger(m.grid.distance)&&m.grid.distance>=1&&m.grid.distance<=1000&&m.grid.unit==='ft'&&(m.grid.offset===undefined||(Array.isArray(m.grid.offset)&&m.grid.offset.length===2&&m.grid.offset.every(n=>Number.isFinite(n)&&n>=0&&n<m.grid.size)))&&assetId(m.art?.base)&&m.art.base===m.art.roofs&&Array.isArray(m.places)&&m.places.length===0&&Array.isArray(m.interactions)&&m.interactions.length===0);}
export function saveCustomCatalog(sessionKey,entries){if(!entries.every(validCustomEntry)||entries.length>40)throw new Error('Invalid custom map library.');if(!writeSessionValue(`${sessionKey}:custom-maps`,entries))throw new Error('Browser storage is full. Disable Auto save to keep using this session.');}
export function createMapUpload({sessionKey,catalog,onAdded,announce}){
  const upload=el('input');upload.type='file';upload.accept=IMAGE_ACCEPT;upload.hidden=true;upload.setAttribute('aria-label','Upload battle map');const panel=document.getElementById('map-dialog'),error=el('p','','save-error');error.setAttribute('role','alert');panel.querySelector('.source-tabs').after(imageTypeNote(),error);panel.append(upload);
  let busy=false;
  upload.addEventListener('input',async()=>{const file=upload.files?.[0];if(!file||busy)return;busy=true;error.textContent='';try{
    if(customCatalog(sessionKey).length>=40)throw new Error('Up to 40 custom maps per game.');
    const asset=await uploadImage(file,'map'),edit=await editMapGrid(asset,file.name.replace(/\.[^.]+$/,'').slice(0,80));if(!edit)return;
    const prepared=edit.asset||asset;if(edit.asset)await putAssets([prepared]);
    const id=`custom-${crypto.randomUUID()}`,map={schemaVersion:1,userMap:true,id,version:'1',title:edit.title,width:prepared.width,height:prepared.height,grid:edit.grid,art:{base:prepared.id,roofs:prepared.id},partyStart:[.5,.5],places:[],interactions:[]};
    const entry={id,title:edit.title,identity:edit.title,edition:'CUSTOM MAP',category:'User maps',subtitle:'Uploaded image',thumbnail:prepared.id,map};
    saveCustomCatalog(sessionKey,[...customCatalog(sessionKey),entry]);catalog.push(entry);onAdded(entry);announce('Map added.');
  }catch(e){error.textContent=e.message;announce(e.message);}finally{busy=false;}});
  return ()=>{if(!busy){upload.value='';upload.click();}};
}
export async function resolveMapArt(map){const entries=await Promise.all(Object.entries(map.art).map(async([key,value])=>[key,assetId(value)?await assetURL(value):value]));return Object.fromEntries(entries);}

export async function editCustomMap(entry){
  if(!entry?.map?.userMap)return null;const asset=await assetRecord(entry.map.art.base);if(!asset)throw new Error('The uploaded map image is missing.');
  const edit=await editMapGrid(asset,entry.title,entry.map.grid);if(!edit)return null;
  const prepared=edit.asset||asset;if(edit.asset)await putAssets([prepared]);
  return {...entry,title:edit.title,identity:edit.title,thumbnail:prepared.id,map:{...entry.map,title:edit.title,width:prepared.width,height:prepared.height,grid:edit.grid,art:{base:prepared.id,roofs:prepared.id}}};
}
export const mapContentKey=map=>map.userMap?JSON.stringify([map.art.base,map.width,map.height,map.grid]):'';
