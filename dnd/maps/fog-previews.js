import {readRaster,rasterRecord} from './image-import.js?v=62';
import {assetURL,putAssets} from './local-assets.js?v=83';
import {paintFogTexture,defaultFogSettings} from './fog-state.js?v=83';
import {loadRaster} from './resource-loading.js?v=84';
export const FOG_PREVIEW_WIDTH=288,FOG_PREVIEW_HEIGHT=144;
export function fogPreviewRecord(image){
 const canvas=document.createElement('canvas');canvas.width=FOG_PREVIEW_WIDTH;canvas.height=FOG_PREVIEW_HEIGHT;const c=canvas.getContext('2d');c.imageSmoothingQuality='high';paintFogTexture(c,image,canvas.width,canvas.height,defaultFogSettings());
 return {id:`asset-${crypto.randomUUID()}`,width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.76)};
}
export async function uploadFogImage(file){
 const raster=await readRaster(file);try{const record=rasterRecord(raster),preview=fogPreviewRecord(raster.bitmap||raster.image);await putAssets([record,preview]);return {record,preview};}finally{raster.dispose();}
}
// Existing saved clouds gain a small, portable asset on their first visit.
export async function prepareFogPreview(entry){
 if(entry.preview){try{return {id:entry.preview,url:await assetURL(entry.preview)};}catch{/* Rebuild missing previews from the retained original. */}}
 const image=await loadRaster(await assetURL(entry.id)),preview=fogPreviewRecord(image);await putAssets([preview]);return {id:preview.id,url:preview.data};
}
