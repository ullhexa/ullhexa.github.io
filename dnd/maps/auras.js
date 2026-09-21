import {mapTokens,patchToken,fiveFeet} from './combat-state.js?v=62';
import {auraRadius} from './board-state.js?v=62';
const NS='http://www.w3.org/2000/svg';
function node(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
export function createAuras({map,player,getState,getDraft,getTool,preview,finishDrag,prepare}){
  const stage=document.getElementById('map-stage'),svg=document.getElementById('map'),layer=node('g',{id:'aura-layer'}),handles=node('svg',{id:'aura-handles',preserveAspectRatio:'xMidYMid meet'}),label=document.createElement('span');label.className='aura-size-label';label.hidden=true;svg.querySelector('#dm-hotspots').before(layer);if(!player)stage.append(handles,label);
  const circles=new Map();let selected=null,drag=null,frame=0,pending=null;
  const members=()=>mapTokens(getState()).filter(m=>!m.item&&(m.monster||getState().tokenMode==='players')).map(getDraft);
  function clear(){selected=null;handles.replaceChildren();label.hidden=true;}
  function positionHandles(){
    if(player)return;handles.setAttribute('viewBox',svg.getAttribute('viewBox'));const m=members().find(m=>m.id===selected&&m.aura);handles.replaceChildren();label.hidden=!m;if(!m){selected=null;return;}
    const matrix=svg.getScreenCTM();if(!matrix)return;const scale=matrix.a,r=auraRadius(m)/map.grid.distance*map.grid.size,x=m.position[0]*map.width,y=m.position[1]*map.height;
    for(const[dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])handles.append(node('rect',{x:x+dx*r-6/scale,y:y+dy*r-6/scale,width:12/scale,height:12/scale,rx:2/scale,fill:'#fff3ce',stroke:'#17251d','stroke-width':2/scale,'data-aura-handle':m.id,role:'button','aria-label':`Resize ${m.name} aura`,class:'aura-handle'}));
    label.textContent=`${m.aura.range} ft aura`;const bounds=stage.getBoundingClientRect(),px=matrix.a*x+matrix.e-bounds.left,py=matrix.d*(y-r)+matrix.f-bounds.top;
    label.style.left=`${Math.max(4,Math.min(stage.clientWidth-label.offsetWidth-4,px-label.offsetWidth/2))}px`;label.style.top=`${Math.max(4,Math.min(stage.clientHeight-label.offsetHeight-4,py-label.offsetHeight-6))}px`;
  }
  function render(){const list=members().filter(m=>m.aura);for(const[id,c]of circles)if(!list.some(m=>m.id===id)){c.remove();circles.delete(id);}for(const m of list){let c=circles.get(m.id);if(!c){c=node('circle',{'data-aura':m.id,class:'token-aura','fill-opacity':.18,...(player?{'pointer-events':'none'}:{role:'button','aria-label':`${m.name} aura`})});layer.append(c);circles.set(m.id,c);}c.setAttribute('cx',m.position[0]*map.width);c.setAttribute('cy',m.position[1]*map.height);c.setAttribute('r',auraRadius(m)/map.grid.distance*map.grid.size);c.setAttribute('fill',m.aura.color);c.setAttribute('stroke',m.aura.color);c.setAttribute('stroke-width',3*5/map.grid.distance*map.grid.size/50);}positionHandles();}
  function flush(){cancelAnimationFrame(frame);frame=0;if(pending){preview(pending,'aura');pending=null;}}
  if(!player){
    stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.ctrlKey||e.metaKey||getTool())return;const handle=e.target.closest('[data-aura-handle]'),circle=e.target.closest('[data-aura]');if(!handle&&!circle){if(!e.target.closest('.token-status-editor'))clear();return;}e.preventDefault();e.stopImmediatePropagation();prepare();selected=handle?.dataset.auraHandle||circle.dataset.aura;positionHandles();if(handle){drag={id:e.pointerId,token:selected,start:structuredClone(getState()),inverse:svg.getScreenCTM().inverse()};stage.setPointerCapture(e.pointerId);}},true);
    stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopImmediatePropagation();const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(drag.inverse),m=mapTokens(getState()).find(m=>m.id===drag.token),distance=Math.hypot(point.x-m.position[0]*map.width,point.y-m.position[1]*map.height)/map.grid.size*map.grid.distance,range=fiveFeet(distance-(m.size||5)/2);pending=patchToken(getState(),m.id,{aura:{...m.aura,range}});if(!frame)frame=requestAnimationFrame(flush);},true);
    stage.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;e.stopImmediatePropagation();flush();const before=drag.start;drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);finishDrag(before,'Aura resized.');},true);
    stage.addEventListener('pointercancel',e=>{if(drag?.id!==e.pointerId)return;e.stopImmediatePropagation();const before=drag.start;drag=null;pending=null;cancelAnimationFrame(frame);frame=0;preview(before,'aura');},true);
  }
  return{render,position:positionHandles,clear,isDragging:()=>!!drag};
}
