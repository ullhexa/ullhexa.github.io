import {FOG_SIZES,FOG_FEATHER} from './fog-state.js?v=55';
export function createFogTools({map,player,getState,preview,finishDrag,pointAt,setTool,sendPreview,announce}){
  const stage=document.getElementById('map-stage'),svg=document.getElementById('map'),canvas=document.createElement('canvas');canvas.id='painted-fog';stage.append(canvas);
  const ratio=Math.min(1,2048/map.width,2048/map.height);canvas.width=Math.round(map.width*ratio);canvas.height=Math.round(map.height*ratio);
  const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const c=canvas.getContext('2d'),m=mask.getContext('2d');
  const base=document.createElement('canvas');base.width=canvas.width;base.height=canvas.height;const baseline=base.getContext('2d');let baseSignature='',drawnSignature='';
  const strokeCanvas=document.createElement('canvas');strokeCanvas.width=canvas.width;strokeCanvas.height=canvas.height;const brush=strokeCanvas.getContext('2d');
  const texture=new Image();texture.onload=()=>{lastFog=null;draw();};texture.src='./assets/fog-of-war.png';let tool=null,size=15,drag=null,frame=0,lastFog=null,lastSignal=0;
  function stroke(s){brush.clearRect(0,0,canvas.width,canvas.height);const pixels=map.grid.size/map.grid.distance*ratio;brush.strokeStyle='#fff';brush.fillStyle='#fff';brush.lineCap=brush.lineJoin='round';
    // Nested strokes form a 2.5-foot feather outside the opaque brush core.
    for(let i=10;i>=0;i--){brush.globalAlpha=i===0?1:(11-i)/11;brush.lineWidth=(s.size+2*FOG_FEATHER*i/10)*pixels;brush.beginPath();s.points.forEach((p,j)=>{const x=p[0]*canvas.width,y=p[1]*canvas.height;j?brush.lineTo(x,y):brush.moveTo(x,y);});if(s.points.length===1){const p=s.points[0];brush.lineTo(p[0]*canvas.width+.01,p[1]*canvas.height);}brush.stroke();}
    m.globalCompositeOperation=s.tool==='erase'?'destination-out':'source-over';m.drawImage(strokeCanvas,0,0);m.globalCompositeOperation='source-over';
  }
  function draw(){const fog=getState().fog||[];canvas.hidden=!fog.length;if(!fog.length){lastFog=fog;drawnSignature='';baseSignature='';m.clearRect(0,0,canvas.width,canvas.height);return;}if(fog===lastFog){position();return;}
    const signature=JSON.stringify(fog),prefix=JSON.stringify(fog.slice(0,-1));
    if(signature!==drawnSignature){
      if(prefix!==baseSignature){
        if(prefix!==drawnSignature){m.clearRect(0,0,canvas.width,canvas.height);for(const s of fog.slice(0,-1))stroke(s);}
        baseline.clearRect(0,0,canvas.width,canvas.height);baseline.drawImage(mask,0,0);baseSignature=prefix;
      }
      m.clearRect(0,0,canvas.width,canvas.height);m.drawImage(base,0,0);if(fog.length)stroke(fog.at(-1));drawnSignature=signature;
    }
    lastFog=fog;c.clearRect(0,0,canvas.width,canvas.height);c.globalCompositeOperation='source-over';if(texture.complete&&texture.naturalWidth)c.drawImage(texture,0,0,canvas.width,canvas.height);else{c.fillStyle='#38443f';c.fillRect(0,0,canvas.width,canvas.height);}c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';position();
  }
  function position(view){if(canvas.hidden)return;if(view?.scale){canvas.style.transform=`translate3d(${view.x}px,${view.y}px,0) scale(${view.scale/ratio})`;return;}const matrix=svg.getScreenCTM(),r=stage.getBoundingClientRect();if(!matrix)return;canvas.style.transform=`translate3d(${matrix.e-r.left-stage.clientLeft}px,${matrix.f-r.top-stage.clientTop}px,0) scale(${matrix.a/ratio})`;}
  new ResizeObserver(position).observe(stage);
  function flush(){cancelAnimationFrame(frame);frame=0;if(!drag)return;preview({...getState(),fog:[...drag.start.fog,drag.stroke]},'fog');draw();if(performance.now()-lastSignal>65){lastSignal=performance.now();sendPreview(getState().fog);}}
  if(!player){const controls=document.createElement('div');controls.className='fog-controls';controls.setAttribute('aria-label','Fog of war');const caption=document.createElement('span');caption.textContent='Fog:';controls.append(caption);
    const buttons=[];for(const [id,label]of [['paint','Brush'],['erase','Eraser']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setTool(tool===id?null:id));controls.append(b);buttons.push([id,b]);}
    for(const n of FOG_SIZES){const b=document.createElement('button');b.textContent=`${n} ft`;b.dataset.fogSize=n;b.setAttribute('aria-pressed',n===size);b.addEventListener('click',()=>{size=n;controls.querySelectorAll('[data-fog-size]').forEach(v=>v.setAttribute('aria-pressed',Number(v.dataset.fogSize)===size));});controls.append(b);}document.querySelector('.map-controls').append(controls);
    stage.addEventListener('pointerdown',e=>{if(!tool||e.button!==0||e.target.closest('#initiative-overlay,.dice-panel,.reference-suite'))return;const p=pointAt(e);if(!p||p.some(n=>n<0||n>1))return;e.preventDefault();e.stopImmediatePropagation();if(getState().fog.length>=1500){announce('Fog stroke limit reached. Undo or erase existing strokes before continuing.');return;}drag={pointer:e.pointerId,start:structuredClone(getState()),stroke:{tool,size,points:[p]}};stage.setPointerCapture(e.pointerId);flush();},true);
    stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();e.stopImmediatePropagation();const p=pointAt(e)?.map(n=>Math.max(0,Math.min(1,n)));if(!p)return;const last=drag.stroke.points.at(-1);if(Math.hypot((p[0]-last[0])*map.width,(p[1]-last[1])*map.height)<map.grid.size*.05)return;if(drag.stroke.points.length<4000)drag.stroke={...drag.stroke,points:[...drag.stroke.points,p]};if(!frame)frame=requestAnimationFrame(flush);},true);
    stage.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.stopImmediatePropagation();flush();const before=drag.start;drag=null;finishDrag(before,'Fog updated.');},true);
    stage.addEventListener('pointercancel',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.stopImmediatePropagation();const before=drag.start;drag=null;cancelAnimationFrame(frame);frame=0;preview(before,'fog');sendPreview(before.fog);draw();},true);
    return {render:draw,position,setMode:value=>{tool=['paint','erase'].includes(value)?value:null;buttons.forEach(([id,b])=>b.setAttribute('aria-pressed',tool===id));stage.classList.toggle('is-fogging',!!tool);stage.dataset.fogTool=tool||'';},isDrawing:()=>!!drag};
  }return {render:draw,position};
}
