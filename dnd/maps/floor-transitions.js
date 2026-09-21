// A clipped copy of the currently painted building fades through black while
// the new floor is painted underneath. Only opacity animates, never map pixels.
export function createFloorTransitions(map,plane,art,light){
 const active=new Map(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let previous=new Map();
 function remove(entry){for(const animation of entry.animations||[])animation.cancel();entry.root.remove();if(active.get(entry.id)===entry)active.delete(entry.id);}
 function clear(){for(const entry of [...active.values()])remove(entry);}
 function update(floors={},animate=true){
  const next=new Map(map.places.filter(p=>p.floors?.length>1).map(p=>[p.id,p.floors.find(f=>f.id===floors[p.id])||p.floors[0]]));
  const changes=map.places.filter(p=>previous.has(p.id)&&next.get(p.id)?.id!==previous.get(p.id).id);
  const before=previous;previous=next;
  if(!animate||reducedMotion.matches){clear();return;}
  const pending=[];
  for(const place of changes){
   const polygons=place.footprint?[place.footprint]:[before.get(place.id).polygon,next.get(place.id).polygon].filter(Boolean);
   if(!polygons.length){const roof=map.interactions.find(i=>i.placeId===place.id&&i.type==='roof');if(roof?.polygon)polygons.push(roof.polygon);}
   if(!polygons.length)continue;
   const points=polygons.flat(),x=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0]))*art.width)),y=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1]))*art.height));
   const width=Math.min(art.width,Math.ceil(Math.max(...points.map(p=>p[0]))*art.width))-x,height=Math.min(art.height,Math.ceil(Math.max(...points.map(p=>p[1]))*art.height))-y;
   if(width<=0||height<=0)continue;
   const root=document.createElement('div');root.className='floor-transition';root.dataset.place=place.id;root.dataset.floor=next.get(place.id).id;
   Object.assign(root.style,{left:`${x*map.width/art.width}px`,top:`${y*map.height/art.height}px`,width:`${width*map.width/art.width}px`,height:`${height*map.height/art.height}px`});
   const old=document.createElement('canvas'),black=document.createElement('canvas');old.className='floor-transition-old';black.className='floor-transition-black';
   for(const canvas of [old,black]){
    canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.beginPath();
    for(const polygon of polygons){
     // Give overlapping floor outlines the same winding so the mask is a union.
     const area=polygon.reduce((sum,p,i)=>{const q=polygon[(i+1)%polygon.length];return sum+p[0]*q[1]-q[0]*p[1];},0),ordered=area<0?[...polygon].reverse():polygon;
     ordered.forEach(([px,py],i)=>i?c.lineTo(px*art.width-x,py*art.height-y):c.moveTo(px*art.width-x,py*art.height-y));c.closePath();
    }
    c.clip();
    if(canvas===black){c.fillStyle='#000';c.fillRect(0,0,width,height);continue;}
    c.drawImage(art,-x,-y);c.globalAlpha=Number(getComputedStyle(light).opacity);c.drawImage(light,-x,-y);
    // Rapid floor changes continue from exactly what is currently visible.
    for(const entry of active.values())for(const layer of [entry.old,entry.black]){c.globalAlpha=Number(getComputedStyle(layer).opacity);c.drawImage(layer,entry.x-x,entry.y-y);}
    c.globalAlpha=1;
   }
   root.append(old,black);pending.push({id:place.id,root,old,black,x,y});
  }
  for(const entry of pending){
   if(active.has(entry.id))remove(active.get(entry.id));plane.append(entry.root);active.set(entry.id,entry);
   const oldAnimation=entry.old.animate([{opacity:1},{opacity:0}],{duration:1500,easing:'steps(1, end)',fill:'forwards'});
   const blackAnimation=entry.black.animate([{opacity:0,easing:'ease-in-out'},{opacity:1,offset:.5,easing:'ease-in-out'},{opacity:0}],{duration:3000,fill:'forwards'});
   entry.animations=[oldAnimation,blackAnimation];blackAnimation.finished.then(()=>remove(entry),()=>{});
  }
 }
 return {update,clear};
}
