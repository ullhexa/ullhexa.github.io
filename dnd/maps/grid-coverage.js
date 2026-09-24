import {affectedCells} from './shape-grid.js?v=81';
const NS='http://www.w3.org/2000/svg';
const node=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};

export function shapeFootprint(map,s,thumb=false){
  const size=thumb?s.size:s.size/map.grid.distance*map.grid.size,attrs={fill:s.color,'fill-opacity':.28,stroke:s.color,'stroke-width':2,'vector-effect':'non-scaling-stroke'};
  if(s.type==='circle')return node('circle',{...attrs,r:size});
  if(s.type==='square')return node('rect',{...attrs,x:-size/2,y:-size/2,width:size,height:size});
  return node('path',{...attrs,d:`M0 0 L${-size*.5} ${-size*Math.sqrt(3)/2} A${size} ${size} 0 0 1 ${size*.5} ${-size*Math.sqrt(3)/2} Z`});
}

// Cached world-coordinate cells, masked out inside the colored footprint.
// Aura callers transform this group into the token's local SVG coordinates.
export function createGridCoverage(map,id){
  const root=node('g',{id,'pointer-events':'none','aria-hidden':'true'}),defs=node('defs');
  const mask=node('mask',{id:`${id}-mask`,'mask-type':'luminance',maskUnits:'userSpaceOnUse',x:0,y:0,width:map.width,height:map.height});
  const path=node('path',{'fill-opacity':.3,'vector-effect':'non-scaling-stroke',mask:`url(#${id}-mask)`});
  defs.append(mask);root.append(defs,path);let key;
  function render(shape,thickness=1){
    const next=shape?JSON.stringify([shape.type,shape.center,shape.size,shape.rotation,shape.color,thickness]):'';
    if(key===next)return;key=next;root.dataset.cells='0';path.setAttribute('d','');
    if(!shape)return;
    const cells=affectedCells(map,shape),cutout=shapeFootprint(map,shape);
    cutout.setAttribute('fill','black');cutout.setAttribute('fill-opacity',1);cutout.setAttribute('stroke','none');
    cutout.setAttribute('transform',`translate(${shape.center[0]*map.width} ${shape.center[1]*map.height}) rotate(${shape.rotation})`);
    mask.replaceChildren(node('rect',{width:map.width,height:map.height,fill:'white'}),cutout);
    path.setAttribute('fill',shape.color);path.setAttribute('stroke',shape.color);path.setAttribute('stroke-width',thickness);path.setAttribute('d',cells.map(c=>`M${c.x} ${c.y}h${c.size}v${c.size}h${-c.size}Z`).join(''));
    root.dataset.cells=String(cells.length);
  }
  return {root,render};
}
