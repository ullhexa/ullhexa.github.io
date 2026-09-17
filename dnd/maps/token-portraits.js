import { portraitAsset } from './encounter-state.js?v=15';

export const TOKEN_FACE_SIZE=96;
const atlases=new Map(),faces=new Map();
function atlas(url){
  if(!atlases.has(url))atlases.set(url,new Promise((resolve,reject)=>{
    const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Character portrait could not load.'));image.src=url;
  }));
  return atlases.get(url);
}
// Flatten each chosen face once. The moving token never carries a full portrait
// atlas, nested SVG viewport, or live clip path, even at maximum map zoom.
export function tokenPortrait(index){
  if(!faces.has(index))faces.set(index,(async()=>{
    const {url,columns,column,row}=portraitAsset(index),image=await atlas(url);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=TOKEN_FACE_SIZE;
    const c=canvas.getContext('2d'),width=image.naturalWidth/columns,height=image.naturalHeight/columns;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.beginPath();c.arc(TOKEN_FACE_SIZE/2,TOKEN_FACE_SIZE/2,TOKEN_FACE_SIZE/2,0,Math.PI*2);c.clip();
    c.drawImage(image,column*width,row*height,width,height,0,0,TOKEN_FACE_SIZE,TOKEN_FACE_SIZE);
    return canvas.toDataURL('image/png');
  })());
  return faces.get(index);
}
