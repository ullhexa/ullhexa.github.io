import {orientationIcon} from './control-icons.js?v=33';
import {showDialog} from './dialogs.js?v=33';
import {imageTypeNote} from './image-import.js?v=33';
import {identityTransform,transformPoint,composeTransform,imageOperation} from './map-orientation.js?v=33';
import {el,button,label} from './editor-dom.js?v=33';
export const gridOrigin=(value,size)=>((value%size)+size)%size;
export function zoomAt(view,point,next,frame=[960,540]){
  const zoom=Math.max(1,Math.min(20,next)),factor=view.fit*view.zoom,scale=view.fit*zoom;
  const center=zoom===1&&view.dimensions?view.dimensions.map(n=>n/2):view.center.map((n,i)=>n+(point[i]-frame[i]/2)/factor-(point[i]-frame[i]/2)/scale);
  return {...view,zoom,center};
}
export function panEditorImage(view,origin,delta){const shift=delta.map(n=>n/(view.fit*view.zoom));return {view:{...view,center:view.center.map((n,i)=>n-shift[i])},origin:origin.map((n,i)=>n-shift[i])};}
export async function editMapGrid(asset,title,grid=null){
  const image=new Image();image.src=asset.data;await image.decode();
  return new Promise(resolve=>{
    const dialog=el('dialog',null,'grid-editor-dialog');dialog.setAttribute('aria-label','Map grid editor');
    const name=el('input');name.value=title;name.maxLength=80;name.setAttribute('aria-label','Map title');
    const counts=[el('input'),el('input')],mapZoom=el('input'),gridZoom=el('input');
    counts.forEach((input,i)=>{input.type='number';input.min=1;input.max=512;input.step='any';input.setAttribute('aria-label',`Grid count ${i?'Y':'X'}`);});
    mapZoom.type=gridZoom.type='range';mapZoom.min=1;mapZoom.max=20;mapZoom.step=.01;mapZoom.value=1;mapZoom.setAttribute('aria-label','Map zoom');gridZoom.min=-100;gridZoom.max=100;gridZoom.step=.1;gridZoom.value=0;gridZoom.setAttribute('aria-label','Grid zoom');
    const visibility={map:true,grid:true};function zoomControl(text,input,key){const wrap=el('div',null,'field-label'),title=el('label',null,'grid-layer-toggle'),check=el('input');check.type='checkbox';check.checked=true;check.setAttribute('aria-label',`Show ${key} in editor`);check.addEventListener('change',()=>{visibility[key]=check.checked;queue();});title.append(check,document.createTextNode(text));wrap.append(title,input);return wrap;}const controls=el('div',null,'grid-editor-controls');controls.append(label('Grid X',counts[0]),label('Grid Y',counts[1]),zoomControl('Map zoom',mapZoom,'map'),zoomControl('Grid zoom − / +',gridZoom,'grid'));
    const canvas=el('canvas',null,'grid-editor-canvas');canvas.width=960;canvas.height=540;canvas.setAttribute('aria-label','Drag grid to align; drag corner handles to scale');
    const c=canvas.getContext('2d');let dimensions=[asset.width,asset.height],matrix=identityTransform(),art=image;
    let size=grid?.size||asset.width/32,origin=[...(grid?.offset||[0,0])],baseSize=size,view={fit:Math.min(960/asset.width,540/asset.height),zoom:1,center:dimensions.map(n=>n/2),dimensions},drag=null,frame=0,result=null;
    const scale=()=>view.fit*view.zoom,screen=p=>p.map((n,i)=>(n-view.center[i])*scale()+[480,270][i]);
    const corners=()=>[[8,8],[952,8],[952,532],[8,532]];
    const point=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*960/r.width,(e.clientY-r.top)*540/r.height];};
    function draw(){frame=0;c.fillStyle='#090c10';c.fillRect(0,0,960,540);const p=screen([0,0]),s=scale();if(visibility.map)c.drawImage(art,p[0],p[1],dimensions[0]*s,dimensions[1]*s);
      if(visibility.grid){const step=size*s,start=screen(origin);c.beginPath();for(let x=gridOrigin(start[0],step);x<960;x+=step){c.moveTo(x,0);c.lineTo(x,540);}for(let y=gridOrigin(start[1],step);y<540;y+=step){c.moveTo(0,y);c.lineTo(960,y);}c.strokeStyle='#000b';c.lineWidth=2.5;c.stroke();c.strokeStyle='#fffd';c.lineWidth=1;c.stroke();}
      c.strokeStyle='#eec68c';c.lineWidth=2;c.strokeRect(p[0],p[1],dimensions[0]*s,dimensions[1]*s);if(visibility.grid)for(const [x,y] of corners()){c.fillStyle='#15191e';c.fillRect(x-6,y-6,12,12);c.strokeStyle='#f4d09c';c.strokeRect(x-6,y-6,12,12);}
    }
    const queue=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const sync=(except=-1)=>{counts.forEach((input,i)=>{if(i!==except)input.value=Number((dimensions[i]/size).toFixed(4));});mapZoom.value=view.zoom;queue();};
    const resetScale=()=>{baseSize=size;gridZoom.value=0;};
    function orient(kind){const op=imageOperation(kind,dimensions);matrix=composeTransform(op.matrix,matrix);origin=transformPoint(op.matrix,origin).map(n=>gridOrigin(n,size));dimensions=op.dimensions;const raster=document.createElement('canvas');[raster.width,raster.height]=dimensions;const ctx=raster.getContext('2d');ctx.setTransform(...matrix);ctx.drawImage(image,0,0);art=raster;view={fit:Math.min(960/dimensions[0],540/dimensions[1]),zoom:1,center:dimensions.map(n=>n/2),dimensions};sync();}
    const orientation=el('div',null,'grid-orientation-controls');orientation.setAttribute('role','group');orientation.setAttribute('aria-label','Map orientation');
    for(const [kind,text,name]of [['left','↶ 90°','Rotate map left 90 degrees'],['right','↷ 90°','Rotate map right 90 degrees'],['x','Mirror X','Mirror map horizontally'],['y','Mirror Y','Mirror map vertically']]){const b=button('',()=>orient(kind));b.append(orientationIcon(kind));b.setAttribute('aria-label',name);b.title=name;orientation.append(b);}
    counts.forEach((input,i)=>input.addEventListener('input',()=>{const n=Number(input.value);if(n>=1&&n<=512){size=Math.max(1,dimensions[i]/n);resetScale();sync(i);}}));
    mapZoom.addEventListener('input',()=>{view={...view,zoom:Number(mapZoom.value)};if(view.zoom===1)view.center=dimensions.map(n=>n/2);queue();});
    gridZoom.addEventListener('input',()=>{size=Math.max(1,Math.min(Math.max(...dimensions),baseSize*2**(Number(gridZoom.value)/100)));sync();});
    canvas.addEventListener('wheel',e=>{e.preventDefault();view=zoomAt(view,point(e),view.zoom*Math.exp(-e.deltaY*.0015));sync();},{passive:false});
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=point(e),cs=corners(),index=cs.findIndex(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<16);drag={id:e.pointerId,p,last:p,size,scale:scale(),index,mode:e.ctrlKey||e.metaKey?'image':index<0?'grid':'scale',anchor:index<0?null:cs[(index+2)%4]};canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');e.preventDefault();});
    canvas.addEventListener('pointermove',e=>{const p=point(e);if(!drag){const index=corners().findIndex(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<16);canvas.style.cursor=e.ctrlKey||e.metaKey||index<0?'grab':index%2?'nesw-resize':'nwse-resize';return;}if(e.pointerId!==drag.id)return;
      const mode=e.ctrlKey||e.metaKey?'image':drag.index<0?'grid':'scale';if(mode!==drag.mode){drag.mode=mode;drag.p=p;drag.last=p;drag.size=size;return;}
      if(mode==='image'){const next=panEditorImage(view,origin,p.map((n,i)=>n-drag.last[i]));view=next.view;origin=next.origin;}
      else if(mode==='grid')origin=origin.map((n,i)=>n+(p[i]-drag.last[i])/drag.scale);
      else {const before=drag.p.map((n,i)=>n-drag.anchor[i]),after=p.map((n,i)=>n-drag.anchor[i]),ratio=Math.max(.05,after.reduce((sum,n,i)=>sum+n*before[i],0)/before.reduce((sum,n)=>sum+n*n,0));size=Math.max(1,Math.min(Math.max(...dimensions),drag.size*ratio));resetScale();}drag.last=p;sync();
    });
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    const end=e=>{if(drag?.id!==e.pointerId)return;drag=null;canvas.classList.remove('is-dragging');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    const actions=el('div',null,'dialog-actions');actions.append(button('Cancel',()=>dialog.close()),button('Apply grid',()=>{const changed=matrix.some((n,i)=>n!==identityTransform()[i]);let data=changed?art.toDataURL('image/png'):null;result={...(changed?{asset:{id:`asset-${crypto.randomUUID()}`,width:dimensions[0],height:dimensions[1],data}}:{}),title:name.value.trim()||'Custom map',grid:{size,distance:5,unit:'ft',color:'#ffffff',offset:origin.map(n=>gridOrigin(n,size))}};dialog.close();},'primary'));
    dialog.append(el('h2','Align map grid'),imageTypeNote(),label('Map title',name),controls,orientation,canvas,actions);document.body.append(dialog);dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);dialog.remove();resolve(result);},{once:true});showDialog(dialog);sync();
  });
}
