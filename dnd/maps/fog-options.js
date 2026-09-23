import {button,el,label} from './editor-dom.js?v=62';
import {FOG_TEXTURES,fogSize,fogAssetId,removeFogImage} from './fog-state.js?v=83';
import {IMAGE_ACCEPT,imageTypeNote} from './image-import.js?v=62';
import {prepareFogPreview,uploadFogImage} from './fog-previews.js?v=83';
import {numberStepper} from './number-stepper.js?v=76';
import {consumeMapDismissal} from './map-dismissal.js?v=62';

export function createFogOptions({toggle,stage,getState,commit,announce}){
  let popup=null,grid,tabs=[],sizeInput,status,uploadButton,category='factory',signature='',busy=false;
  const previews=new Map(),pending=new Map(),failed=new Set();let previewQueue=Promise.resolve();
  // Preload only the tiny menu assets; never fetch a full factory texture here.
  for(const entry of FOG_TEXTURES){const image=new Image();image.decoding='async';image.src=entry.preview;previews.set(entry.id,{url:entry.preview,image});}
  function warm(){for(const entry of [...(getState().campaign.fogImages||[])].sort((a,b)=>Number(!!b.preview)-Number(!!a.preview))){if(previews.has(entry.id)||pending.has(entry.id))continue;
    const work=previewQueue.then(()=>prepareFogPreview(entry)).then(preview=>{const image=new Image();image.decoding='async';image.src=preview.url;previews.set(entry.id,{...preview,image});const state=getState(),current=state.campaign.fogImages.find(i=>i.id===entry.id);
      if(current&&current.preview!==preview.id)commit({...state,campaign:{...state.campaign,fogImages:state.campaign.fogImages.map(i=>i.id===entry.id?{...i,preview:preview.id}:i)}},'',false);
      if(popup){const img=grid.querySelector(`[data-fog-texture="${entry.id}"] img`);if(img)img.src=preview.url;}
    }).catch(()=>{failed.add(entry.id);if(popup){const img=grid.querySelector(`[data-fog-texture="${entry.id}"] img`);if(img)img.alt='Image unavailable';}});pending.set(entry.id,work);previewQueue=work;
  }}
  const apply=patch=>commit({...getState(),fogSettings:{...getState().fogSettings,...patch}},'',false);
  function close(){popup?.remove();popup=null;signature='';toggle.setAttribute('aria-expanded','false');}
  function position(){if(!popup)return;const r=toggle.getBoundingClientRect();popup.style.left=`${Math.max(4,Math.min(innerWidth-popup.offsetWidth-4,r.left))}px`;popup.style.top=`${Math.max(4,Math.min(innerHeight-popup.offsetHeight-4,r.bottom+8))}px`;}
  function select(texture){commit({...getState(),fogSettings:{...getState().fogSettings,texture,zoom:1,x:.5,y:.5}},'Fog texture updated.');}
  function tile(entry){
    const wrapper=el('div',undefined,'fog-texture-tile'),b=button('',()=>select(entry.id),'fog-texture');b.dataset.fogTexture=entry.id;b.setAttribute('aria-label',entry.name);
    const img=el('img');img.alt='';img.draggable=false;img.decoding='async';img.width=288;img.height=144;const caption=el('span',entry.name);b.append(img,caption);wrapper.append(b);const preview=previews.get(entry.id);if(preview)img.src=preview.url;
    if(fogAssetId(entry.id)){const remove=button('×',e=>{e.stopPropagation();commit(removeFogImage(getState(),entry.id),'Fog image removed.');},'fog-remove');remove.setAttribute('aria-label',`Remove ${entry.name}`);wrapper.append(remove);}return wrapper;
  }
  async function upload(file){
    if(!file||busy)return;if((getState().campaign.fogImages||[]).length>=40){status.textContent='The fog library is full (40 images).';return;}
    busy=true;uploadButton.disabled=true;status.textContent='Opening image…';
    try{
      const {record,preview}=await uploadFogImage(file),name=file.name.replace(/\.[^.]+$/,'').trim().slice(0,80)||'Fog image',s=getState();
      const image=new Image();image.src=preview.data;previews.set(record.id,{id:preview.id,url:preview.data,image});
      commit({...s,campaign:{...s.campaign,fogImages:[...(s.campaign.fogImages||[]),{id:record.id,name,preview:preview.id}]},fogSettings:{...s.fogSettings,texture:record.id,zoom:1,x:.5,y:.5}},'Fog image fitted to the map.');
      if(popup)status.textContent='';
    }catch(error){if(popup)status.textContent=error.message;announce(error.message);}
    finally{busy=false;if(popup){uploadButton.disabled=false;render();position();}}
  }
  function render(){
    warm();if(!popup)return;const s=getState(),entries=category==='factory'?FOG_TEXTURES:s.campaign.fogImages||[],key=JSON.stringify([category,entries]);
    if(key!==signature){signature=key;grid.replaceChildren(...entries.map(tile));if(category==='user')grid.prepend(uploadButton);popup.querySelector('.image-types').hidden=category!=='user';position();}
    tabs.forEach(([id,b])=>b.setAttribute('aria-pressed',String(id===category)));
    grid.querySelectorAll('[data-fog-texture]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fogTexture===s.fogSettings.texture)));
    if(document.activeElement!==sizeInput)sizeInput.value=s.fogSettings.size;
  }
  function open(){
    for(const id of failed)pending.delete(id);failed.clear();
    document.dispatchEvent(new Event('map-menu-opening'));
    category=fogAssetId(getState().fogSettings.texture)?'user':'factory';popup=el('div',undefined,'fog-options');popup.id='fog-options';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Fog options');
    const heading=el('div',undefined,'fog-options-heading');heading.append(el('strong','Fog'));const exit=button('×',close,'fog-options-close');exit.setAttribute('aria-label','Close fog options');heading.append(exit);
    const tabRow=el('div',undefined,'fog-options-tabs');tabs=['factory','user'].map(id=>{const b=button(id==='factory'?'Factory':'User',()=>{category=id;render();position();});tabRow.append(b);return[id,b];});
    const input=el('input');input.type='file';input.accept=IMAGE_ACCEPT;input.hidden=true;input.addEventListener('change',()=>{upload(input.files[0]);input.value='';});
    uploadButton=button('+ Upload image',()=>input.click(),'fog-texture fog-upload');uploadButton.disabled=busy;
    grid=el('div',undefined,'fog-texture-grid');status=el('p',busy?'Opening image…':'','fog-options-status');status.setAttribute('role','status');
    sizeInput=el('input');sizeInput.type='number';sizeInput.min=5;sizeInput.max=200;sizeInput.step=5;sizeInput.value=getState().fogSettings.size;sizeInput.setAttribute('aria-label','Brush and eraser size in feet');
    sizeInput.addEventListener('input',()=>{if(sizeInput.value)apply({size:fogSize(sizeInput.value)});});sizeInput.addEventListener('change',()=>{sizeInput.value=fogSize(sizeInput.value);apply({size:Number(sizeInput.value)});});
    const size=label('Brush / eraser size (ft)',numberStepper(sizeInput,{name:'fog size',normalize:fogSize}));size.classList.add('fog-size');
    popup.append(heading,tabRow,imageTypeNote(),grid,size,status,input);document.body.append(popup);toggle.setAttribute('aria-expanded','true');render();position();
  }
  toggle.addEventListener('click',()=>popup?close():open());
  document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&!toggle.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
  document.addEventListener('keydown',e=>{if(popup&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();toggle.focus({preventScroll:true});}},true);
  document.addEventListener('library-opening',close);window.addEventListener('resize',position);document.addEventListener('scroll',position,true);
  return {render,close};
}
