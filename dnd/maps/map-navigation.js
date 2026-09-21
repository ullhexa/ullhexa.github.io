import {cameraGeometry,boundedCamera} from './camera.js?v=57';
import {isTextEntry} from './keyboard.js?v=57';
import {button} from './editor-dom.js?v=57';
import {icon} from './control-icons.js?v=57';
const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
export function gridCameraStep(map,camera,viewport,direction,align=true){
 const c=boundedCamera(map,camera,viewport),geometry=cameraGeometry(map,c,viewport),dimensions=[map.width,map.height],offset=map.grid.offset||[0,0],left=[c.x*map.width-viewport[0]/geometry.scale/2,c.y*map.height-viewport[1]/geometry.scale/2],movable=dimensions.map((n,i)=>viewport[i]/geometry.scale<n-1e-7);
 const aligned=left.map((n,i)=>movable[i]?offset[i]+Math.round((n-offset[i])/map.grid.size)*map.grid.size:n),snap=align&&aligned.some((n,i)=>Math.abs(n-left[i])>1e-6);
 const next=left.map((n,i)=>snap?aligned[i]:n+direction[i]*map.grid.size);
 return boundedCamera(map,{x:(next[0]+viewport[0]/geometry.scale/2)/map.width,y:(next[1]+viewport[1]/geometry.scale/2)/map.height,zoom:c.zoom},viewport);
}
export function joystickVector(delta,radius=56,deadZone=4){const length=Math.hypot(...delta);if(length<=deadZone)return [0,0];const speed=Math.min(1,(length-deadZone)/(radius-deadZone))**1.6;return delta.map(n=>n/length*speed);}
export function createMapNavigation({map,getCamera,viewport,setCamera,prepare}){
 const control=button('',null,'toolbar-icon map-joystick');control.id='map-joystick';control.title='Hold and tilt to navigate · Ctrl/Cmd + arrows for grid steps';control.setAttribute('aria-label','Drag to move map');control.append(icon([{d:'M12 2v5m-3-2 3-3 3 3M12 22v-5m-3 2 3 3 3-3M2 12h5m-2-3-3 3 3 3M22 12h-5m2-3 3 3-3 3',fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linejoin':'round'},{tag:'circle',cx:12,cy:12,r:3,fill:'currentColor',class:'joystick-knob'}]));document.getElementById('open-dice').after(control);let drag=null,lastStep=null;
 const signature=()=>JSON.stringify([getCamera(),viewport()]);
 let animation=0,lastTime=0;
 function tick(now){animation=0;if(!drag)return;const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;const direction=joystickVector(drag.delta);if(direction.some(Boolean)){const camera=getCamera(),size=viewport(),speed=Math.min(...size)*.9/cameraGeometry(map,camera,size).scale,next=boundedCamera(map,{...camera,x:camera.x+direction[0]*speed*dt/map.width,y:camera.y+direction[1]*speed*dt/map.height},size);if(next.x!==camera.x||next.y!==camera.y)setCamera(next);}animation=requestAnimationFrame(tick);}
 control.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();prepare();lastStep=null;drag={id:e.pointerId,origin:[e.clientX,e.clientY],delta:[0,0]};lastTime=performance.now();control.setPointerCapture(e.pointerId);control.classList.add('is-dragging');animation=requestAnimationFrame(tick);});
 control.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;drag.delta=[e.clientX-drag.origin[0],e.clientY-drag.origin[1]];const length=Math.hypot(...drag.delta),ratio=Math.min(1,7/(length||1));control.style.setProperty('--stick-x',`${drag.delta[0]*ratio}px`);control.style.setProperty('--stick-y',`${drag.delta[1]*ratio}px`);});
 const stop=()=>{if(!drag)return;const id=drag.id;drag=null;cancelAnimationFrame(animation);animation=0;control.classList.remove('is-dragging');control.style.removeProperty('--stick-x');control.style.removeProperty('--stick-y');if(control.hasPointerCapture(id))control.releasePointerCapture(id);};const end=e=>{if(drag?.id===e.pointerId)stop();};control.addEventListener('pointerup',end);control.addEventListener('pointercancel',end);control.addEventListener('lostpointercapture',end);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.isComposing||!(e.ctrlKey||e.metaKey)||e.altKey||!directions[e.key]||isTextEntry(e.target)||e.target.closest('.reference-suite')||document.querySelector('dialog[open],.token-status-editor'))return;e.preventDefault();e.stopImmediatePropagation();prepare();const first=lastStep!==signature();setCamera(gridCameraStep(map,getCamera(),viewport(),directions[e.key],first));lastStep=signature();},true);
}
