import {cleanCropEdges} from './item-crop-cleanup.js?v=29';
import {loadRaster} from './resource-loading.js?v=29';
import {itemAsset} from './items-catalog.js?v=29';
import {portraitAsset} from './encounter-state.js?v=29';
import {assetURL} from './local-assets.js?v=29';
export const TOKEN_FACE_SIZE=96;
const sources=new Map(),faces=new Map();
function load(url){if(!sources.has(url))sources.set(url,loadRaster(url).catch(error=>{sources.delete(url);throw error;}));return sources.get(url);}
export function tokenPortrait(member){if(typeof member==='number')member={portrait:member};const key=member.avatar||`${member.item?'item':member.monster?'monster':'player'}:${member.portrait}`;
  if(!faces.has(key))faces.set(key,(async()=>{const a=member.avatar?null:member.item?itemAsset(member.portrait):portraitAsset(member.portrait,member.monster),image=await load(a?a.url:await assetURL(member.avatar));
    const crop=a?.crop,w=crop?crop[2]*image.naturalWidth:a?image.naturalWidth/a.columns:image.naturalWidth,h=crop?crop[3]*image.naturalHeight:a?image.naturalHeight/a.rows:image.naturalHeight,size=Math.min(w,h),x=(crop?crop[0]*image.naturalWidth:a?a.column*w:0)+(w-size)/2,y=(crop?crop[1]*image.naturalHeight:a?a.row*h:0)+(h-size)/2;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=TOKEN_FACE_SIZE;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(member.item){const tile=document.createElement('canvas');tile.width=Math.round(w);tile.height=Math.round(h);const tc=tile.getContext('2d');tc.drawImage(image,crop?crop[0]*image.naturalWidth:0,crop?crop[1]*image.naturalHeight:0,w,h,0,0,tile.width,tile.height);if(crop){const pixels=tc.getImageData(0,0,tile.width,tile.height);cleanCropEdges(pixels.data,tile.width,tile.height);tc.putImageData(pixels,0,0);}const ratio=(TOKEN_FACE_SIZE-8)/Math.max(w,h);c.drawImage(tile,(TOKEN_FACE_SIZE-w*ratio)/2,(TOKEN_FACE_SIZE-h*ratio)/2,w*ratio,h*ratio);}else c.drawImage(image,x,y,size,size,0,0,TOKEN_FACE_SIZE,TOKEN_FACE_SIZE);return canvas.toDataURL('image/png');})().catch(error=>{faces.delete(key);throw error;}));return faces.get(key);
}
export function portraitStyle(el,index,monster=false){const {url,columns,rows,column,row,crop}=portraitAsset(index,monster);const[x,y,w,h]=crop||[column/columns,row/rows,1/columns,1/rows];el.style.backgroundImage=`url('${url}')`;el.style.backgroundSize=`${100/w}% ${100/h}%`;el.style.backgroundPosition=`${x/(1-w)*100}% ${y/(1-h)*100}%`;}
export function setFace(img,member){const key=member.avatar||`${member.item?'item':member.monster?'monster':'player'}:${member.portrait}`;if(img.dataset.face===key)return;img.dataset.face=key;tokenPortrait(member).then(url=>{if(img.dataset.face===key)img.src=url;}).catch(()=>{if(img.dataset.face===key){img.removeAttribute('src');delete img.dataset.face;}});}
