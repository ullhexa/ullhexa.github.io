import {el,button,label} from './editor-dom.js?v=31';
import {putAssets,assetRecord} from './local-assets.js?v=31';
export function cropTransform(width,height,zoom=1,x=0,y=0,size=512){const scale=Math.max(size/width,size/height)*Math.max(1,zoom);return {scale,x:Math.max(-(width*scale-size)/2,Math.min((width*scale-size)/2,x)),y:Math.max(-(height*scale-size)/2,Math.min((height*scale-size)/2,y))};}
export async function readRasterFile(file){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
  if(file.size>20*1024*1024)throw new Error('Choose an image under 20 MB.');
  const url=URL.createObjectURL(file),image=new Image();try{image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw new Error('This image is empty.');return image;}finally{URL.revokeObjectURL(url);}
}
export async function editTokenImage(input,{square=false,story=false,editing=false,title=''}={}){
  const stored=input?.data?input:null,settings=stored?.imageEdit,source=settings?await assetRecord(settings.source):stored;
  if(settings&&!source)throw new Error('The original image is missing. Restore it from your game save.');
  const image=source?new Image():await readRasterFile(input);if(source){image.src=source.data;await image.decode();}
  const dimensions=story?[1920,1080]:[512,512],dialog=el('dialog',undefined,'token-image-editor'),canvas=el('canvas'),wrap=el('div',undefined,`token-crop-frame${square||story?' square':''}${story?' story-crop-frame':''}`),zoom=el('input'),error=el('p','','save-error'),name=el('input');
  [canvas.width,canvas.height]=dimensions;canvas.setAttribute('aria-label',story?'Position story image':'Position token image');wrap.append(canvas);zoom.type='range';zoom.min=1;zoom.max=5;zoom.step=.01;zoom.value=settings?.zoom||1;zoom.setAttribute('aria-label',story?'Story image zoom':'Token image zoom');name.value=title;name.maxLength=80;name.setAttribute('aria-label','Story title');
  let x=settings?.x||0,y=settings?.y||0,drag=null,frame=0;const c=canvas.getContext('2d');
  function draw(){frame=0;const [w,h]=dimensions,scale=(story?Math.min(w/image.naturalWidth,h/image.naturalHeight):Math.max(w/image.naturalWidth,h/image.naturalHeight))*Number(zoom.value),iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
    x=Math.max(-Math.abs(iw-w)/2,Math.min(Math.abs(iw-w)/2,x));y=Math.max(-Math.abs(ih-h)/2,Math.min(Math.abs(ih-h)/2,y));c.clearRect(0,0,w,h);if(story){c.fillStyle='#080b10';c.fillRect(0,0,w,h);}c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,(w-iw)/2+x,(h-ih)/2+y,iw,ih);
  }
  const queue=()=>{if(!frame)frame=requestAnimationFrame(draw);};zoom.addEventListener('input',queue);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:x,dy:y,scale:canvas.width/canvas.getBoundingClientRect().width};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;x=drag.dx+(e.clientX-drag.x)*drag.scale;y=drag.dy+(e.clientY-drag.y)*drag.scale;queue();});
  const end=e=>{if(drag?.id!==e.pointerId)return;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom.value=Math.max(1,Math.min(5,Number(zoom.value)*Math.exp(-e.deltaY*.0015)));queue();},{passive:false});
  dialog.append(el('h2',story?'Edit story image':editing?'Edit token':'Create token'));if(story)dialog.append(label('Title',name));dialog.append(wrap,label('Zoom',zoom),button('Fit',()=>{zoom.value=1;x=y=0;queue();}),error);
  const footer=el('div',undefined,'dialog-actions');dialog.append(footer);document.body.append(dialog);
  return new Promise(resolve=>{let result=null;const create=button(editing||story?'Apply changes':'Create',async()=>{create.disabled=true;try{draw();let original=source;
      if(!original){const raster=document.createElement('canvas'),ratio=Math.min(1,4096/Math.max(image.naturalWidth,image.naturalHeight));raster.width=Math.round(image.naturalWidth*ratio);raster.height=Math.round(image.naturalHeight*ratio);raster.getContext('2d').drawImage(image,0,0,raster.width,raster.height);original={id:`asset-${crypto.randomUUID()}`,width:raster.width,height:raster.height,data:raster.toDataURL('image/webp',.95)};}
      const record={id:`asset-${crypto.randomUUID()}`,width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.95),imageEdit:{source:original.id,zoom:Number(zoom.value),x,y}};await putAssets(source?[record]:[original,record]);result={...record,...(story?{title:name.value.trim()||'Story image'}:{})};dialog.close();
    }catch(e){error.textContent=e.message;create.disabled=false;}},'primary');footer.append(button('Cancel',()=>dialog.close()),create);dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);dialog.remove();resolve(result);},{once:true});dialog.showModal();draw();});
}
