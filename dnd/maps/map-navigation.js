import {cameraGeometry,boundedCamera} from './camera.js?v=33';
import {isTextEntry} from './keyboard.js?v=33';
import {button} from './editor-dom.js?v=33';
import {icon} from './control-icons.js?v=33';
const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
export function gridCameraStep(map,camera,viewport,direction,align=true){
 const c=boundedCamera(map,camera,viewport),geometry=cameraGeometry(map,c,viewport),dimensions=[map.width,map.height],offset=map.grid.offset||[0,0],left=[c.x*map.width-viewport[0]/geometry.scale/2,c.y*map.height-viewport[1]/geometry.scale/2],movable=dimensions.map((n,i)=>viewport[i]/geometry.scale<n-1e-7);
 const aligned=left.map((n,i)=>movable[i]?offset[i]+Math.round((n-offset[i])/map.grid.size)*map.grid.size:n),snap=align&&aligned.some((n,i)=>Math.abs(n-left[i])>1e-6);
 const next=left.map((n,i)=>snap?aligned[i]:n+direction[i]*map.grid.size);
 return boundedCamera(map,{x:(next[0]+viewport[0]/geometry.scale/2)/map.width,y:(next[1]+viewport[1]/geometry.scale/2)/map.height,zoom:c.zoom},viewport);
}
export function createMapNavigation({map,getCamera,viewport,setCamera,prepare}){
 const control=button('',null,'toolbar-icon map-joystick');control.id='map-joystick';control.title='Drag to pan · Ctrl/Cmd + arrows for grid steps';control.setAttribute('aria-label','Drag to move map');control.append(icon([{d:'M12 2v5m-3-2 3-3 3 3M12 22v-5m-3 2 3 3 3-3M2 12h5m-2-3-3 3 3 3M22 12h-5m2-3 3 3-3 3',fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linejoin':'round'},{tag:'circle',cx:12,cy:12,r:3,fill:'currentColor',class:'joystick-knob'}]));document.getElementById('open-dice').after(control);let drag=null,lastStep=null;
 const signature=()=>JSON.stringify([getCamera(),viewport()]);
 control.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();prepare();lastStep=null;drag={id:e.pointerId,x:e.clientX,y:e.clientY,origin:[e.clientX,e.clientY]};control.setPointerCapture(e.pointerId);control.classList.add('is-dragging');});
 control.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const camera=getCamera(),scale=cameraGeometry(map,camera,viewport()).scale;setCamera(boundedCamera(map,{...camera,x:camera.x-(e.clientX-drag.x)/scale/map.width,y:camera.y-(e.clientY-drag.y)/scale/map.height},viewport()));drag.x=e.clientX;drag.y=e.clientY;const delta=[e.clientX-drag.origin[0],e.clientY-drag.origin[1]],length=Math.hypot(...delta),ratio=Math.min(1,6/(length||1));control.style.setProperty('--stick-x',`${delta[0]*ratio}px`);control.style.setProperty('--stick-y',`${delta[1]*ratio}px`);});
 const end=e=>{if(drag?.id!==e.pointerId)return;drag=null;control.classList.remove('is-dragging');control.style.removeProperty('--stick-x');control.style.removeProperty('--stick-y');if(control.hasPointerCapture(e.pointerId))control.releasePointerCapture(e.pointerId);};control.addEventListener('pointerup',end);control.addEventListener('pointercancel',end);
 document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.isComposing||!(e.ctrlKey||e.metaKey)||e.altKey||!directions[e.key]||isTextEntry(e.target)||e.target.closest('.reference-suite')||document.querySelector('dialog[open],.token-status-editor'))return;e.preventDefault();e.stopImmediatePropagation();prepare();const first=lastStep!==signature();setCamera(gridCameraStep(map,getCamera(),viewport(),directions[e.key],first));lastStep=signature();},true);
}
