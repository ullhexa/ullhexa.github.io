const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
// World bounds of the visible footprint, including rotated squares and 60° cones.
export function shapeBounds(shape,map){
  const x=shape.center[0]*map.width,y=shape.center[1]*map.height,r=shape.size/map.grid.distance*map.grid.size,a=shape.rotation*Math.PI/180;
  if(shape.type==='circle')return {left:x-r,right:x+r,top:y-r,bottom:y+r};
  let points;
  if(shape.type==='square')points=[[-r/2,-r/2],[r/2,-r/2],[r/2,r/2],[-r/2,r/2]].map(([px,py])=>[px*Math.cos(a)-py*Math.sin(a),px*Math.sin(a)+py*Math.cos(a)]);
  else{const start=a-2*Math.PI/3,end=a-Math.PI/3,angles=[start,end];for(let i=Math.ceil(start/(Math.PI/2));i*Math.PI/2<end;i++)angles.push(i*Math.PI/2);points=[[0,0],...angles.map(t=>[r*Math.cos(t),r*Math.sin(t)])];}
  return {left:x+Math.min(...points.map(p=>p[0])),right:x+Math.max(...points.map(p=>p[0])),top:y+Math.min(...points.map(p=>p[1])),bottom:y+Math.max(...points.map(p=>p[1]))};
}
export function placeShapeLabel(bounds,label,viewport){const pad=6;return {left:clamp((bounds.left+bounds.right-label.width)/2,pad,Math.max(pad,viewport.width-label.width-pad)),top:clamp(bounds.top-label.height-6,pad,Math.max(pad,viewport.height-label.height-pad))};}
