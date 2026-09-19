import {el,button,label} from './editor-dom.js?v=28';
import {putAssets} from './local-assets.js?v=28';
export function cropTransform(width,height,zoom=1,x=0,y=0,size=512){const scale=Math.max(size/width,size/height)*Math.max(1,zoom);return {scale,x:Math.max(-(width*scale-size)/2,Math.min((width*scale-size)/2,x)),y:Math.max(-(height*scale-size)/2,Math.min((height*scale-size)/2,y))};}
export async function readRasterFile(file){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
  if(file.size>20*1024*1024)throw new Error('Choose an image under 20 MB.');
  const url=URL.createObjectURL(file),image=new Image();try{image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw new Error('This image is empty.');return image;}finally{URL.revokeObjectURL(url);}
}
export async function editTokenImage(file,{square=false}={}){
  const image=await readRasterFile(file),dialog=el('dialog',undefined,'token-image-editor'),canvas=el('canvas'),wrap=el('div',undefined,`token-crop-frame${square?' square':''}`),zoom=el('input'),error=el('p','','save-error');canvas.width=canvas.height=512;canvas.setAttribute('aria-label','Position token image');wrap.append(canvas);zoom.type='range';zoom.min=1;zoom.max=5;zoom.step=.01;zoom.value=1;zoom.setAttribute('aria-label','Token image zoom');let x=0,y=0,drag=null,frame=0;
  const c=canvas.getContext('2d');function draw(){frame=0;const t=cropTransform(image.naturalWidth,image.naturalHeight,Number(zoom.value),x,y);x=t.x;y=t.y;c.clearRect(0,0,512,512);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,256-image.naturalWidth*t.scale/2+x,256-image.naturalHeight*t.scale/2+y,image.naturalWidth*t.scale,image.naturalHeight*t.scale);}
  const queue=()=>{if(!frame)frame=requestAnimationFrame(draw);};zoom.addEventListener('input',queue);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:x,dy:y,scale:512/canvas.getBoundingClientRect().width};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;x=drag.dx+(e.clientX-drag.x)*drag.scale;y=drag.dy+(e.clientY-drag.y)*drag.scale;queue();});canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom.value=Math.max(1,Math.min(5,Number(zoom.value)*Math.exp(-e.deltaY*.0015)));queue();},{passive:false});
  dialog.append(el('h2','Create token'),wrap,label('Zoom',zoom),error);const footer=el('div',undefined,'dialog-actions');dialog.append(footer);document.body.append(dialog);
  return new Promise(resolve=>{let result=null;const create=button('Create',async()=>{create.disabled=true;try{draw();const record={id:`asset-${crypto.randomUUID()}`,width:512,height:512,data:canvas.toDataURL('image/webp',.92)};await putAssets([record]);result=record;dialog.close();}catch(e){error.textContent=e.message;create.disabled=false;}},'primary');footer.append(button('Cancel',()=>dialog.close()),create);dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);dialog.remove();resolve(result);},{once:true});dialog.showModal();draw();});
}
