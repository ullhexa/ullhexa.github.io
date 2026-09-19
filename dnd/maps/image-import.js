// Only verified raster bytes enter the image pipeline; extensions/MIME labels are hints.
export const IMAGE_ACCEPT='.png,.apng,.jpg,.jpeg,.jfif,.pjpeg,.pjp,.webp,.avif,.gif,.bmp,image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp';
export const IMAGE_TYPES='PNG · JPG / JPEG / JFIF · WebP · AVIF · GIF · BMP';
export const MAX_IMAGE_BYTES=20*1024*1024,MAX_IMAGE_SIDE=16384,MAX_IMAGE_PIXELS=64*1024*1024;
export const TOKEN_SIZE=256,TOKEN_SOURCE_SIZE=1024;
export function rasterType(bytes){const b=new Uint8Array(bytes),text=(a,n)=>String.fromCharCode(...b.slice(a,a+n));if(b[0]===255&&b[1]===216&&b[2]===255)return'image/jpeg';if(text(1,3)==='PNG'&&b[0]===137&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)return'image/png';if(text(0,4)==='RIFF'&&text(8,4)==='WEBP')return'image/webp';if(['GIF87a','GIF89a'].includes(text(0,6)))return'image/gif';if(text(0,2)==='BM')return'image/bmp';if(text(4,4)==='ftyp'&&['avif','avis'].some(t=>{for(let i=8;i<Math.min(b.length,64);i+=4)if(text(i,4)===t)return true;return false;}))return'image/avif';return null;}
export function validImageDimensions(w,h){return Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&w<=MAX_IMAGE_SIDE&&h<=MAX_IMAGE_SIDE&&w*h<=MAX_IMAGE_PIXELS;}
export function imageTypeNote(){const p=document.createElement('p');p.className='image-types';p.textContent=`${IMAGE_TYPES} · Up to 20 MB · Animated images use their first frame`;return p;}
export async function readRaster(file){
 if(!file||!file.size)throw new Error('Choose an image file.');if(file.size>MAX_IMAGE_BYTES)throw new Error('Choose an image under 20 MB.');
 const bytes=await file.arrayBuffer(),mime=rasterType(bytes);if(!mime)throw new Error(`Unsupported image. Choose ${IMAGE_TYPES}.`);
 const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),image=new Image();
 try{image.src=url;await image.decode();if(!validImageDimensions(image.naturalWidth,image.naturalHeight))throw new Error('Image exceeds 16,384 pixels per side or 64 megapixels. Choose a smaller image.');
  const b=new Uint8Array(bytes),text=String.fromCharCode(...b.slice(0,64));let animated=mime==='image/gif'||mime==='image/avif'&&text.includes('avis');
  if(mime==='image/png'){const v=new DataView(bytes);for(let i=8;i+12<=b.length;){const n=v.getUint32(i);if(String.fromCharCode(...b.slice(i+4,i+8))==='acTL'){animated=true;break;}if(n>b.length-i-12)break;i+=n+12;}}
  if(mime==='image/webp')animated=!!(text.includes('VP8X')&&(b[20]&2));
  let bitmap=null;if(animated){if(!globalThis.createImageBitmap)throw new Error('This browser cannot import animated images as stills. Use PNG or JPEG.');bitmap=await createImageBitmap(blob);}
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  return {image,bitmap,data,mime,animated,dispose(){bitmap?.close();URL.revokeObjectURL(url);}};
 }catch(error){URL.revokeObjectURL(url);throw error.message.startsWith('Image exceeds')||error.message.startsWith('This browser')?error:new Error('This image could not be decoded. Try exporting it as PNG or JPEG.');}
}
export function rasterRecord(raster,{maxSide=Infinity}={}){
 const image=raster.bitmap||raster.image,w=raster.image.naturalWidth,h=raster.image.naturalHeight,ratio=Math.min(1,maxSide/Math.max(w,h));
 if(ratio===1&&!raster.animated&&['image/png','image/jpeg','image/webp','image/avif'].includes(raster.mime))return{id:`asset-${crypto.randomUUID()}`,width:w,height:h,data:raster.data};
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));const c=canvas.getContext('2d');c.imageSmoothingQuality='high';c.drawImage(image,0,0,canvas.width,canvas.height);
 return{id:`asset-${crypto.randomUUID()}`,width:canvas.width,height:canvas.height,data:canvas.toDataURL(ratio<1?'image/webp':'image/png',.9)};
}
