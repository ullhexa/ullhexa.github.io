import {showDialog} from './dialogs.js?v=62';
import {readRaster,rasterRecord,imageTypeNote,TOKEN_SIZE,TOKEN_SOURCE_SIZE} from './image-import.js?v=62';
import {el,button,label} from './editor-dom.js?v=62';
import {putAssets,assetRecord} from './local-assets.js?v=83';
export function cropTransform(width,height,zoom=1,x=0,y=0,size=512){const scale=Math.max(size/width,size/height)*Math.max(1,zoom);return {scale,x:Math.max(-(width*scale-size)/2,Math.min((width*scale-size)/2,x)),y:Math.max(-(height*scale-size)/2,Math.min((height*scale-size)/2,y))};}
export async function editTokenImage(input,{square=false,story=false,editing=false,title=''}={}){
  const stored=input?.data?input:null,settings=stored?.imageEdit,source=settings?await assetRecord(settings.source):stored;
  if(settings&&!source)throw new Error('The original image is missing. Restore it from your game save.');
  const raster=source?null:await readRaster(input),image=source?new Image():raster.image;if(source){image.src=source.data;await image.decode();}
  const dimensions=story?[1920,1080]:[TOKEN_SIZE,TOKEN_SIZE],dialog=el('dialog',undefined,'token-image-editor'),canvas=el('canvas'),wrap=el('div',undefined,`token-crop-frame${square||story?' square':''}${story?' story-crop-frame':''}`),zoom=el('input'),error=el('p','','save-error'),name=el('input');
  if(story)dialog.classList.add('story-image-editor');
  [canvas.width,canvas.height]=dimensions;canvas.setAttribute('aria-label',story?'Position story image':'Position token image');wrap.append(canvas);zoom.type='range';zoom.min=1;zoom.max=5;zoom.step=.01;zoom.value=settings?.zoom||1;zoom.setAttribute('aria-label',story?'Story image zoom':'Token image zoom');name.value=title;name.maxLength=80;name.setAttribute('aria-label','Story title');
  let x=(settings?.x||0)*(story?1:TOKEN_SIZE/(stored?.width||TOKEN_SIZE)),y=(settings?.y||0)*(story?1:TOKEN_SIZE/(stored?.height||TOKEN_SIZE)),drag=null,frame=0;const c=canvas.getContext('2d');
  function draw(){frame=0;const [w,h]=dimensions,scale=(story?Math.min(w/image.naturalWidth,h/image.naturalHeight):Math.max(w/image.naturalWidth,h/image.naturalHeight))*Number(zoom.value),iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
    x=Math.max(-Math.abs(iw-w)/2,Math.min(Math.abs(iw-w)/2,x));y=Math.max(-Math.abs(ih-h)/2,Math.min(Math.abs(ih-h)/2,y));c.clearRect(0,0,w,h);if(story){c.fillStyle='#080b10';c.fillRect(0,0,w,h);}c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(raster?.bitmap||image,(w-iw)/2+x,(h-ih)/2+y,iw,ih);
  }
  const queue=()=>{if(!frame)frame=requestAnimationFrame(draw);};zoom.addEventListener('input',queue);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:x,dy:y,scale:canvas.width/canvas.getBoundingClientRect().width};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;x=drag.dx+(e.clientX-drag.x)*drag.scale;y=drag.dy+(e.clientY-drag.y)*drag.scale;queue();});
  const end=e=>{if(drag?.id!==e.pointerId)return;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom.value=Math.max(1,Math.min(5,Number(zoom.value)*Math.exp(-e.deltaY*.0015)));queue();},{passive:false});
  const fit=()=>{zoom.value=1;x=y=0;queue();};
  dialog.append(el('h2',story?'Edit story image':editing?'Edit token':'Create token'));if(story)dialog.append(label('Title',name));dialog.append(imageTypeNote(),wrap);
  if(story){const field=el('div',undefined,'field-label'),reset=button('Zoom',fit,'zoom-fit');reset.setAttribute('aria-label','Fit story image');field.append(reset,zoom);dialog.append(field);}else dialog.append(label('Zoom',zoom),button('Fit',fit));dialog.append(error);
  const footer=el('div',undefined,'dialog-actions');dialog.append(footer);document.body.append(dialog);
  return new Promise(resolve=>{let result=null;const create=button(editing||story?'Apply changes':'Create',async()=>{create.disabled=true;try{draw();let original=source;
      if(!original)original=rasterRecord(raster,{maxSide:story?Infinity:TOKEN_SOURCE_SIZE});
      const record=story?{id:`asset-${crypto.randomUUID()}`,width:original.width,height:original.height,data:original.data,imageEdit:{source:original.id,zoom:Number(zoom.value),x,y},framing:{zoom:Number(zoom.value),x:x/1920,y:y/1080}}:{id:`asset-${crypto.randomUUID()}`,width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/webp',.9),imageEdit:{source:original.id,zoom:Number(zoom.value),x,y}};
      await putAssets(source?[record]:[original,record]);result={...record,...(story?{title:name.value.trim()||'Story image'}:{})};dialog.close();
    }catch(e){error.textContent=e.message;create.disabled=false;}},'primary');footer.append(button('Cancel',()=>dialog.close()),create);dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);raster?.dispose();dialog.remove();resolve(result);},{once:true});showDialog(dialog);draw();});
}
