export const STORY_SCENES = [
  {id:'embers',title:'Emberlight',description:'Warm drifting sparks. A fireside tale, a refuge, a moment to breathe.',colors:['#100c12','#80351c','#e59d48'],motion:'embers'},
  {id:'mist',title:'Mist & whispers',description:'Pale currents in deep green. An uncertain path through the unknown.',colors:['#071315','#24514d','#a4c3ad'],motion:'mist'},
  {id:'astral',title:'Astral veil',description:'Slow ribbons of blue and violet. Wonder, dreams, and ancient magic.',colors:['#090d21','#493e91','#75b4d2'],motion:'veil'},
  {id:'storm',title:'Gathering storm',description:'Restless silver-blue clouds. A looming threat, without flashing lightning.',colors:['#090e17','#283e60','#9aaec4'],motion:'storm'},
  {id:'depths',title:'Still depths',description:'Dark turquoise with rippling light. Secrets beneath the surface.',colors:['#041419','#12525d','#54b4b4'],motion:'water'},
  {id:'blight',title:'Violet blight',description:'Purple tendrils and suspended spores. Something quietly taking hold.',colors:['#110c1c','#512a68','#b37ebd'],motion:'blight'}
];

// A small procedural canvas: no video downloads, audio, AI generation or flashing.
export function createStoryAnimation(canvas) {
  const context=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let scene=STORY_SCENES[0],running=false,frame=0,last=0,time=0;
  const seed=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  function draw(now=0){
    if(!context)return;
    const rect=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.5,1600/Math.max(1,rect.width),1000/Math.max(1,rect.height));
    const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const t=now*.00008,c=context;
    c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle=scene.colors[0];c.fillRect(0,0,w,h);
    c.globalCompositeOperation='screen';
    for(let i=0;i<5;i++){
      const x=w*(.15+i*.18+Math.sin(t*.7+i*2)*.15),y=h*(.5+Math.cos(t*.5+i*1.7)*.28);
      const radius=Math.max(w,h)*(.3+seed(i)*.2),g=c.createRadialGradient(x,y,0,x,y,radius);
      g.addColorStop(0,scene.colors[i%2+1]+'70');g.addColorStop(.5,scene.colors[1]+'24');g.addColorStop(1,scene.colors[0]+'00');
      c.fillStyle=g;c.fillRect(0,0,w,h);
    }
    // Flowing gauze uses layered curves with no per-frame blur filters.
    for(let band=0;band<10;band++){
      c.beginPath();
      for(let j=0;j<=48;j++){
        const x=j/48*w,phase=j*.12+band*.23;
        const wave=Math.sin(phase+t*(scene.motion==='storm'?1.8:.65)+band)*.10+Math.cos(j*.06-t*.5+band)*.055;
        const y=h*(.35+band*.035+wave);
        if(!j)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.strokeStyle=scene.colors[2];c.globalAlpha=scene.motion==='embers'?.028:.045;
      c.lineWidth=h*(.016+band*.004);c.stroke();
      c.globalAlpha=.035;c.lineWidth=Math.max(1,h*.001);c.stroke();
    }
    const count=scene.motion==='embers'?90:55;
    for(let i=0;i<count;i++){
      const speed=.015+seed(i+60)*.035;
      const x=(seed(i+1)+Math.sin(t+seed(i+2)*8)*.025)*w;
      const y=((seed(i+200)-t*speed)%1+1)%1*h;
      const radius=(.5+seed(i+90)*1.7)*scale;
      c.globalAlpha=(.1+seed(i+300)*.4)*(.65+Math.sin(t*2+i)*.25);
      c.fillStyle=scene.colors[2];c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
    const vignette=c.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.15,w*.5,h*.5,Math.max(w,h)*.65);
    vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000a0');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    canvas.dataset.scene=scene.id;
  }
  function tick(stamp){
    if(!running||reduced.matches)return;
    if(stamp-last>=33){time+=Math.min(60,stamp-last||33);last=stamp;draw(time);}
    frame=requestAnimationFrame(tick);
  }
  function refresh(){cancelAnimationFrame(frame);draw(time);last=performance.now();if(running&&!reduced.matches)frame=requestAnimationFrame(tick);}
  const observer=new ResizeObserver(()=>draw(time));observer.observe(canvas);
  reduced.addEventListener('change',refresh);
  return {set(id){scene=STORY_SCENES.find(item=>item.id===id)||STORY_SCENES[0];draw(time);},start(){if(running)return;running=true;refresh();},stop(){running=false;cancelAnimationFrame(frame);},destroy(){running=false;cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',refresh);}};
}
