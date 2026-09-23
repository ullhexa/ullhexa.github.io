import {FOG_FEATHER,FOG_TEXTURES,fogAssetId,paintFogTexture} from './fog-state.js?v=83';
import {fogIcon} from './control-icons.js?v=81';
import {createFogOptions} from './fog-options.js?v=83';
import {assetURL} from './local-assets.js?v=83';
import {loadRaster} from './resource-loading.js?v=62';
export function createFogTools({map,player,getState,commit,preview,finishDrag,pointAt,setTool,sendPreview,announce}){
  const stage=document.getElementById('map-stage'),svg=document.getElementById('map'),canvas=document.createElement('canvas');canvas.id='painted-fog';stage.append(canvas);
  const ratio=Math.min(1,2048/map.width,2048/map.height);canvas.width=Math.round(map.width*ratio);canvas.height=Math.round(map.height*ratio);
  const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const c=canvas.getContext('2d'),m=mask.getContext('2d');
  const base=document.createElement('canvas');base.width=canvas.width;base.height=canvas.height;const baseline=base.getContext('2d');let baseSignature='',drawnSignature='';
  const strokeCanvas=document.createElement('canvas');strokeCanvas.width=canvas.width;strokeCanvas.height=canvas.height;const brush=strokeCanvas.getContext('2d');
  const textureCanvas=document.createElement('canvas');textureCanvas.width=canvas.width;textureCanvas.height=canvas.height;const tc=textureCanvas.getContext('2d');
  let texture=null,textureKey='',textureSignature='',textureDirty=true,loadId=0,options=null,tool=null,drag=null,frame=0,lastFog=null,lastSignal=0;
  function prepareTexture(settings){
    if(settings.texture!==textureKey){
      textureKey=settings.texture;texture=null;textureDirty=true;const id=++loadId;
      const url=fogAssetId(textureKey)?assetURL(textureKey):Promise.resolve(FOG_TEXTURES.find(t=>t.id===textureKey)?.url||FOG_TEXTURES[0].url);
      url.then(loadRaster).then(image=>{if(id!==loadId)return;texture=image;textureDirty=true;draw();}).catch(()=>{if(id===loadId&&!player)announce('The fog image could not load. Restore its saved image or choose another texture.');});
    }
    const signature=JSON.stringify([settings.texture,settings.zoom,settings.x,settings.y]);
    if(!textureDirty&&signature===textureSignature)return false;
    paintFogTexture(tc,texture,canvas.width,canvas.height,settings);textureDirty=false;textureSignature=signature;return true;
  }
  function stroke(s){brush.clearRect(0,0,canvas.width,canvas.height);const pixels=map.grid.size/map.grid.distance*ratio;brush.strokeStyle='#fff';brush.fillStyle='#fff';brush.lineCap=brush.lineJoin='round';
    // Nested strokes form a 2.5-foot feather outside the opaque brush core.
    for(let i=10;i>=0;i--){brush.globalAlpha=i===0?1:(11-i)/11;brush.lineWidth=(s.size+2*FOG_FEATHER*i/10)*pixels;brush.beginPath();s.points.forEach((p,j)=>{const x=p[0]*canvas.width,y=p[1]*canvas.height;j?brush.lineTo(x,y):brush.moveTo(x,y);});if(s.points.length===1){const p=s.points[0];brush.lineTo(p[0]*canvas.width+.01,p[1]*canvas.height);}brush.stroke();}
    m.globalCompositeOperation=s.tool==='erase'?'destination-out':'source-over';m.drawImage(strokeCanvas,0,0);m.globalCompositeOperation='source-over';
  }
  function draw(){
    const state=getState(),fog=state.fog||[],changedTexture=prepareTexture(state.fogSettings);options?.render();canvas.hidden=!fog.length;
    if(!fog.length){if(lastFog!==fog){drawnSignature='';baseSignature='';m.clearRect(0,0,canvas.width,canvas.height);}lastFog=fog;return;}
    if(fog===lastFog&&!changedTexture){position();return;}
    if(fog!==lastFog){
      const signature=JSON.stringify(fog),prefix=JSON.stringify(fog.slice(0,-1));
      if(signature!==drawnSignature){
        if(prefix!==baseSignature){
          if(prefix!==drawnSignature){m.clearRect(0,0,canvas.width,canvas.height);for(const s of fog.slice(0,-1))stroke(s);}
          baseline.clearRect(0,0,canvas.width,canvas.height);baseline.drawImage(mask,0,0);baseSignature=prefix;
        }
        m.clearRect(0,0,canvas.width,canvas.height);m.drawImage(base,0,0);stroke(fog.at(-1));drawnSignature=signature;
      }
    }
    lastFog=fog;c.clearRect(0,0,canvas.width,canvas.height);c.globalCompositeOperation='source-over';c.drawImage(textureCanvas,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';position();
  }
  function position(view){if(canvas.hidden)return;if(view?.scale){canvas.style.transform=`translate3d(${view.x}px,${view.y}px,0) scale(${view.scale/ratio})`;return;}const matrix=svg.getScreenCTM(),r=stage.getBoundingClientRect();if(!matrix)return;canvas.style.transform=`translate3d(${matrix.e-r.left-stage.clientLeft}px,${matrix.f-r.top-stage.clientTop}px,0) scale(${matrix.a/ratio})`;}
  new ResizeObserver(position).observe(stage);
  function flush(){cancelAnimationFrame(frame);frame=0;if(!drag)return;preview({...getState(),fog:[...drag.start.fog,drag.stroke]},'fog');draw();if(performance.now()-lastSignal>65){lastSignal=performance.now();sendPreview(getState().fog);}}
  if(!player){
    const controls=document.createElement('div');controls.className='fog-controls';controls.setAttribute('aria-label','Fog of war');
    const cloud=document.createElement('button');cloud.id='open-fog-options';cloud.append(fogIcon());cloud.setAttribute('aria-label','Fog options');cloud.setAttribute('aria-expanded','false');cloud.setAttribute('aria-haspopup','dialog');controls.append(cloud);
    const buttons=[];for(const [id,label]of [['paint','Brush'],['erase','Eraser']]){const b=document.createElement('button');b.append(fogIcon(id));b.setAttribute('aria-label',label);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setTool(tool===id?null:id));controls.append(b);buttons.push([id,b]);}
    document.querySelector('.map-controls').append(controls);options=createFogOptions({toggle:cloud,stage,getState,commit,announce});
    stage.addEventListener('pointerdown',e=>{if(!tool||e.button!==0||e.target.closest('#initiative-overlay,.dice-panel,.reference-suite'))return;const p=pointAt(e);if(!p||p.some(n=>n<0||n>1))return;e.preventDefault();e.stopImmediatePropagation();if(getState().fog.length>=1500){announce('Fog stroke limit reached. Undo or erase existing strokes before continuing.');return;}drag={pointer:e.pointerId,start:structuredClone(getState()),stroke:{tool,size:getState().fogSettings.size,points:[p]}};stage.setPointerCapture(e.pointerId);flush();},true);
    stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();e.stopImmediatePropagation();const p=pointAt(e)?.map(n=>Math.max(0,Math.min(1,n)));if(!p)return;const last=drag.stroke.points.at(-1);if(Math.hypot((p[0]-last[0])*map.width,(p[1]-last[1])*map.height)<map.grid.size*.05)return;if(drag.stroke.points.length<4000)drag.stroke={...drag.stroke,points:[...drag.stroke.points,p]};if(!frame)frame=requestAnimationFrame(flush);},true);
    stage.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.stopImmediatePropagation();flush();const before=drag.start;drag=null;finishDrag(before,'Fog updated.');},true);
    stage.addEventListener('pointercancel',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.stopImmediatePropagation();const before=drag.start;drag=null;cancelAnimationFrame(frame);frame=0;preview(before,'fog');sendPreview(before.fog);draw();},true);
    function cancel(){if(!drag)return;const before=drag.start,id=drag.pointer;drag=null;cancelAnimationFrame(frame);frame=0;if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);preview(before,'fog');sendPreview(before.fog);draw();}
    return {cancel,render:draw,position,setMode:value=>{tool=['paint','erase'].includes(value)?value:null;buttons.forEach(([id,b])=>b.setAttribute('aria-pressed',tool===id));stage.classList.toggle('is-fogging',!!tool);stage.dataset.fogTool=tool||'';},isDrawing:()=>!!drag};
  }return {render:draw,position};
}
