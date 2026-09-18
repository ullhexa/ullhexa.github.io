import {assetId} from './combat-state.js?v=26';
let dbPromise;const urls=new Map();
function database(){return dbPromise??=new Promise((resolve,reject)=>{const request=indexedDB.open('ullhexa-local-assets',1);request.onupgradeneeded=()=>request.result.createObjectStore('assets',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('Local image storage is unavailable.'));});}
export async function assetRecord(id){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('assets').objectStore('assets').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export function validAsset(a){return a&&assetId(a.id)&&typeof a.data==='string'&&a.data.length<=20*1024*1024&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(a.data)&&Number.isFinite(a.width)&&a.width>0&&a.width<=8192&&Number.isFinite(a.height)&&a.height>0&&a.height<=8192;}
export async function putAssets(records){if(!records.every(validAsset))throw new Error('Invalid image in this save.');const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');records.forEach(a=>tx.objectStore('assets').put(a));tx.oncomplete=resolve;tx.onerror=()=>reject(new Error('There is not enough browser storage for these images.'));tx.onabort=tx.onerror;});for(const a of records)urls.delete(a.id);}
export async function assetURL(id){if(!assetId(id))throw new Error('Invalid image reference.');if(!urls.has(id)){const a=await assetRecord(id);if(!a)throw new Error('A local image is missing. Load the original .ullhexa save to restore it.');urls.set(id,a.data);}return urls.get(id);}
export async function uploadImage(file,kind='portrait'){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
  if(file.size>20*1024*1024)throw new Error('Choose an image under 20 MB.');
  const url=URL.createObjectURL(file),image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This image could not be read.'));image.src=url;});
    const limit=kind==='portrait'?512:kind==='stat'?2400:4096,ratio=Math.min(1,limit/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    const record={id:`asset-${crypto.randomUUID()}`,width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.9)};await putAssets([record]);return record;
  }finally{URL.revokeObjectURL(url);}
}
export function referencedAssets(value,found=new Set()){if(assetId(value))found.add(value);else if(Array.isArray(value))value.forEach(v=>referencedAssets(v,found));else if(value&&typeof value==='object')Object.values(value).forEach(v=>referencedAssets(v,found));return found;}
export async function exportAssets(value){const all=await Promise.all([...referencedAssets(value)].map(assetRecord));if(all.some(a=>!a))throw new Error('A local image is missing. Restore it before saving.');return all;}
