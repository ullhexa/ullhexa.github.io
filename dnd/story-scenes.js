export const STORY_SCENES = [
  {id:'embers',title:'Emberlight',description:'A breathing hearth glow and a few soft, rising embers. Warmth, refuge, and fireside tales.',colors:['#100c12','#80351c','#e59d48'],motion:'embers'},
  {id:'mist',title:'Mist & whispers',description:'Overlapping banks of pale fog, slowly gathering and parting. An uncertain path through the unknown.',colors:['#071315','#24514d','#a4c3ad'],motion:'mist'},
  {id:'astral',title:'Astral veil',description:'Luminous veils folding through blue and violet, with distant dreamlike stars. Wonder and ancient magic.',colors:['#090d21','#493e91','#75b4d2'],motion:'veil'},
  {id:'storm',title:'Gathering storm',description:'Soft curtains of rain beneath rolling clouds, with occasional distant lightning. Quiet, gathering tension.',colors:['#090e17','#283e60','#9aaec4'],motion:'storm'},
  {id:'depths',title:'Still depths',description:'Submerged light slowly bending into ripples and shafts. Quiet secrets beneath the surface.',colors:['#041419','#12525d','#54b4b4'],motion:'water'},
  {id:'blight',title:'Violet blight',description:'Faint branching threads breathe beneath violet haze. A few drifting spores hint at something taking hold.',colors:['#110c1c','#512a68','#b37ebd'],motion:'blight'}
];

const TAU=Math.PI*2;
const seed=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
const smooth=x=>x*x*(3-2*x);
const wrap=x=>((x%1)+1)%1;
const textures=new Map();
function surface(width,height=width){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
function noise(x,y,salt){
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  const a=seed(ix+iy*157+salt),b=seed(ix+1+iy*157+salt),c=seed(ix+(iy+1)*157+salt),d=seed(ix+1+(iy+1)*157+salt);
  return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
function glow(color){
  const key=`glow:${color}`;if(textures.has(key))return textures.get(key);
  const canvas=surface(128),c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,color+'cc');g.addColorStop(.18,color+'80');g.addColorStop(.45,color+'28');g.addColorStop(.75,color+'08');g.addColorStop(1,color+'00');
  c.fillStyle=g;c.fillRect(0,0,128,128);textures.set(key,canvas);return canvas;
}
function cloud(color,variant=0){
  const key=`cloud:${color}:${variant}`;if(textures.has(key))return textures.get(key);
  const size=256,canvas=surface(size),c=canvas.getContext('2d'),pixels=c.createImageData(size,size);
  const rgb=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
  // Smooth noise is baked once. Enlarging these soft fields reveals no hard cells or edges.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/(size-1),v=y/(size-1),edge=Math.max(0,1-((u-.5)**2+(v-.5)**2)*4);
    const field=noise(u*4,v*4,variant*37)*.58+noise(u*9,v*9,variant*37+91)*.29+noise(u*19,v*19,variant*37+183)*.13;
    const index=(y*size+x)*4;
    pixels.data[index]=rgb[0];pixels.data[index+1]=rgb[1];pixels.data[index+2]=rgb[2];
    pixels.data[index+3]=Math.round(255*edge*edge*smooth(Math.max(0,Math.min(1,(field-.18)*1.5))));
  }
  c.putImageData(pixels,0,0);textures.set(key,canvas);return canvas;
}
function rainTexture(){
  const key='rain';if(textures.has(key))return textures.get(key);
  const canvas=surface(384,512),c=canvas.getContext('2d'),sprite=glow('#b8c8de');
  for(let i=0;i<64;i++){
    const x=seed(i+500)*384,y=seed(i+700)*512,width=1.8+seed(i+900)*3.5,height=28+seed(i+1100)*80;
    c.globalAlpha=.13+seed(i+1300)*.25;
    for(const offset of [-512,0,512])c.drawImage(sprite,x-width/2,y+offset-height/2,width,height);
  }
  textures.set(key,canvas);return canvas;
}

// Procedural, silent atmosphere. All expensive textures are shared and cached;
// only soft image layers and a few curves move at runtime.
export function createStoryAnimation(canvas) {
  const context=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let scene=STORY_SCENES[0],running=false,frame=0,last=0,time=0;
  function draw(now=0){
    if(!context)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const scale=Math.min(devicePixelRatio||1,1.5,1600/rect.width,1000/rect.height);
    const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const t=now/1000,c=context;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle=scene.colors[0];c.fillRect(0,0,w,h);
    c.globalCompositeOperation='screen';
    function light(x,y,rx,ry,color,alpha){c.globalAlpha=alpha;c.drawImage(glow(color),(x-rx)*w,(y-ry)*h,rx*2*w,ry*2*h);}
    function banks(count,alpha,speed,spread=.7,color=scene.colors[2]){
      for(let i=0;i<count;i++){
        const x=.08+seed(i+20)*.84+Math.sin(t*speed+i*2.3)*.22;
        const y=.12+seed(i+70)*.76+Math.cos(t*speed*.73+i)*.10;
        const width=spread*(.8+seed(i+140)*.6),height=width*(.46+seed(i+170)*.3);
        c.globalAlpha=alpha*(.8+Math.sin(t*.045+i)*.16);
        c.drawImage(cloud(color,i%3),(x-width/2)*w,(y-height/2)*h,width*w,height*h);
      }
    }
    // Nested translucent strokes create soft ribbons without an expensive full-frame blur.
    function ribbon(path,color,thickness,alpha){
      c.strokeStyle=color;c.lineCap='round';
      for(let layer=7;layer>=1;layer--){c.globalAlpha=alpha*(1-layer/10);c.lineWidth=h*thickness*layer/4;c.beginPath();path(c);c.stroke();}
    }
    function motes(count,color,speed,alpha,size){
      for(let i=0;i<count;i++){
        const phase=wrap(seed(i+200)-t*speed*(.6+seed(i+60)));
        const x=seed(i+1)+Math.sin(t*.055+seed(i+2)*8)*.04;
        const envelope=Math.sin(Math.PI*phase)**2;
        const radius=size*(.65+seed(i+90));
        light(x,phase,radius*h/w,radius,color,alpha*envelope*(.7+Math.sin(t*.16+i)*.25));
      }
    }
    if(scene.motion==='embers'){
      light(.48,1.06,.72,.64,'#b7461e',.55+Math.sin(t*.19)*.06);
      light(.57,1.02,.35,.36,'#e5a04a',.35+Math.sin(t*.27+1)*.04);
      banks(5,.12,.018,.95,scene.colors[1]);
      motes(26,'#edb76f',.011,.50,.006);
      // A slow warm plume gives the fire presence without rendering literal flames.
      ribbon(c=>{c.moveTo(w*.35,h*1.12);c.bezierCurveTo(w*(.30+Math.sin(t*.06)*.08),h*.70,w*(.65+Math.cos(t*.07)*.08),h*.52,w*.5,h*.22);},'#b86836',.11,.008);
    }else if(scene.motion==='mist'){
      light(.43,.52,.9,.72,scene.colors[1],.55);
      banks(11,.60,.018,1.12);
      banks(5,.28,.011,1.5,'#678d91');
      // Low banks read as ground fog; no particles or sharp contour lines.
      for(let i=0;i<3;i++){
        const x=.22+i*.31+Math.sin(t*.013+i)*.18;
        c.globalAlpha=.24;c.drawImage(cloud('#bbcdc0',i),(x-.65)*w,(.61+Math.sin(t*.02+i)*.08)*h,w*1.3,h*.43);
      }
    }else if(scene.motion==='veil'){
      light(.3,.32,.7,.8,scene.colors[1],.55);light(.79,.64,.48,.65,scene.colors[2],.18);
      banks(5,.18,.012,1.15,scene.colors[1]);
      for(let i=0;i<5;i++){
        const offset=i*.062,drift=Math.sin(t*.045+i*.7)*.065;
        ribbon(c=>{c.moveTo(-w*.15,h*(.7+offset));c.bezierCurveTo(w*.28,h*(.95-offset+drift),w*.28,h*(-.13+offset+drift),w*1.15,h*(.25+offset));},i%2?'#86b8d2':'#9a81cf',.030+i*.008,.012);
      }
      motes(17,'#c2cbe6',.0008,.27,.0038);
    }else if(scene.motion==='storm'){
      light(.52,.21,.85,.7,scene.colors[1],.43);
      banks(9,.42,.023,1.2);
      const texture=rainTexture();
      c.save();c.translate(w*.5,h*.5);c.transform(1,0,-.14,1,0,0);
      for(let layer=0;layer<2;layer++){
        const tileW=w*(.44+layer*.18),tileH=h*(1.1+layer*.2),fall=wrap(t*(.035+layer*.016))*tileH;
        c.globalAlpha=layer?.16:.28;
        for(let x=-2;x<=2;x++)for(let y=-2;y<=1;y++)c.drawImage(texture,x*tileW-w*.18,y*tileH+fall,tileW,tileH);
      }
      c.restore();
      // One distant, diffuse illumination every 22–36 seconds. No strobe or bolt.
      // Time is scene-local, so arriving in Storm never drops into a flash.
      let cycleStart=0,cycle=0,duration=0;
      while(cycleStart+(duration=22+seed(cycle+2100)*14)<=t){cycleStart+=duration;cycle++;}
      const age=t-cycleStart,flashAt=duration-6,phase=(age-flashAt)/3.6;
      if(!reduced.matches&&phase>0&&phase<1){
        const pulse=Math.sin(Math.PI*phase)**2;
        light(.22+seed(cycle+2200)*.56,.13,.95,.85,'#c8d5e5',pulse*.31);
        c.globalAlpha=pulse*.15;c.drawImage(cloud('#d3dfec',cycle%3),-w*.12,-h*.33,w*1.3,h*1.05);
      }
      banks(3,.15,.019,1.3,scene.colors[1]);
    }else if(scene.motion==='water'){
      light(.49,-.08,.78,.97,scene.colors[1],.65);
      banks(6,.16,.009,1.35);
      for(let i=0;i<5;i++){
        c.save();c.translate(w*(.12+i*.19+Math.sin(t*.018+i)*.035),-h*.1);c.rotate(-.17+Math.sin(t*.024+i)*.09);
        c.globalAlpha=.13;c.drawImage(glow('#66aeb5'),-w*.10,-h*.25,w*.20,h*1.5);c.restore();
      }
      for(let i=0;i<6;i++){
        const y=.29+i*.115,drift=Math.sin(t*.05+i)*.045;
        ribbon(c=>{c.moveTo(-w*.1,h*(y+drift));c.bezierCurveTo(w*.20,h*(y-.18-drift),w*.55,h*(y+.2+drift),w*1.1,h*(y-.08));},'#70bdc4',.018,.012);
      }
      motes(12,'#81bdc1',.0017,.16,.0045);
    }else if(scene.motion==='blight'){
      light(.55,.61,.8,.8,scene.colors[1],.52+Math.sin(t*.095)*.035);
      banks(8,.26,.012,1.13);
      for(let i=0;i<7;i++){
        const x=.10+i*.14,sway=Math.sin(t*.035+i)*.045,alpha=.012*(.68+Math.sin(t*.08+i)*.25);
        ribbon(c=>{c.moveTo(w*x,h*1.15);c.bezierCurveTo(w*(x-.18+sway),h*.69,w*(x+.19+sway),h*.55,w*(x-.07),h*(.13+seed(i+44)*.35));},'#ae72b6',.014,alpha);
        ribbon(c=>{c.moveTo(w*(x-.03+sway),h*.70);c.bezierCurveTo(w*(x+.09+sway),h*.55,w*(x+.18),h*.64,w*(x+.24),h*.40);},'#9b70a8',.011,alpha*.6);
      }
      motes(23,'#c192cb',.0028,.28,.008);
    }
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
    const vignette=c.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.15,w*.5,h*.5,Math.max(w,h)*.66);
    vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#00000095');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    canvas.dataset.scene=scene.id;
  }
  function tick(stamp){
    if(!running||reduced.matches||document.hidden)return;
    if(stamp-last>=33){time+=Math.min(100,stamp-last);last=stamp;draw(time);}
    frame=requestAnimationFrame(tick);
  }
  function refresh(){cancelAnimationFrame(frame);draw(time);last=performance.now();if(running&&!reduced.matches&&!document.hidden)frame=requestAnimationFrame(tick);}
  const observer=new ResizeObserver(()=>draw(time));observer.observe(canvas);
  reduced.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh);
  return {
    set(id){const next=STORY_SCENES.find(item=>item.id===id)||STORY_SCENES[0];if(next===scene&&canvas.dataset.scene===next.id)return;scene=next;time=0;draw(time);},
    start(){if(running)return;running=true;refresh();},
    stop(){running=false;cancelAnimationFrame(frame);},
    destroy(){running=false;cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh);}
  };
}
