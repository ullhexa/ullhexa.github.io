// Convex polyhedra, centered on the origin. The D10 is the polar dual of a
// pentagonal antiprism: ten kite faces, rather than a pentagonal prism.
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{const l=Math.hypot(...a);return a.map(n=>n/l);};
export function convexFaces(vertices){
 const faces=new Map();
 for(let a=0;a<vertices.length;a++)for(let b=a+1;b<vertices.length;b++)for(let c=b+1;c<vertices.length;c++){
  let n=cross(sub(vertices[b],vertices[a]),sub(vertices[c],vertices[a]));if(Math.hypot(...n)<1e-7)continue;n=unit(n);let d=dot(n,vertices[a]);const distances=vertices.map(v=>dot(n,v)-d);if(distances.some(x=>x>1e-6)&&distances.some(x=>x< -1e-6))continue;if(d<0){n=n.map(x=>-x);d=-d;}
  const ids=vertices.map((v,i)=>Math.abs(dot(n,v)-d)<1e-6?i:-1).filter(i=>i>=0),key=ids.join(',');if(faces.has(key))continue;
  const center=ids.reduce((s,i)=>s.map((v,j)=>v+vertices[i][j]/ids.length),[0,0,0]),x=unit(sub(vertices[ids[0]],center)),y=cross(n,x);ids.sort((i,j)=>Math.atan2(dot(sub(vertices[i],center),y),dot(sub(vertices[i],center),x))-Math.atan2(dot(sub(vertices[j],center),y),dot(sub(vertices[j],center),x)));faces.set(key,{indices:ids,normal:n,center,distance:d});
 }
 return [...faces.values()];
}
function mesh(vertices){const radius=Math.max(...vertices.map(v=>Math.hypot(...v))),points=vertices.map(v=>v.map(n=>n/radius));return {vertices:points,faces:convexFaces(points)};}
const phi=(1+Math.sqrt(5))/2,ico=[];for(const a of [-1,1])for(const b of [-phi,phi])ico.push([0,a,b],[a,b,0],[b,0,a]);
const anti=Array.from({length:10},(_,i)=>{const theta=i*Math.PI/5;return [Math.cos(theta),Math.sin(theta),i%2?.85:-.85];});
const ten=convexFaces(anti).map(f=>f.normal.map(n=>n/f.distance));
export const DICE_MESHES={4:mesh([[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]),6:mesh([-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>[x,y,z])))),8:mesh([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]),10:mesh(ten),20:mesh(ico)};
export function percentileFaces(value){if(!Number.isInteger(value)||value<1||value>100)throw new Error('Invalid percentile result.');const n=value%100;return [String(Math.floor(n/10)*10).padStart(2,'0'),String(n%10)];}
export function facingMesh(sides){const source=DICE_MESHES[sides],face=source.faces[0],z=face.normal,y=unit(sub(source.vertices[face.indices[0]],face.center)),x=cross(y,z);return {vertices:source.vertices.map(v=>{const p=[dot(v,x),dot(v,y),dot(v,z)];return sides===6?rotateVertex(p,[0,0,Math.PI/4]):p;}),faces:source.faces.map(f=>f.indices)};}
export function rotateVertex(v,[rx,ry,rz]){let [x,y,z]=v;[y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];[x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];return [x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),z];}
export const DICE_COLORS={4:[18,49],6:[235,36],8:[164,35],10:[42,53],20:[344,39],100:[278,31]};
export function landingMesh(sides){if(sides===8){const m=DICE_MESHES[8];return {vertices:m.vertices.map(v=>rotateVertex(rotateVertex(v,[0,Math.PI/4,0]),[.32,0,0])),faces:m.faces.map(f=>f.indices)};}if(sides===10){const m=DICE_MESHES[10];return {vertices:m.vertices.map(v=>rotateVertex(rotateVertex(v,[0,0,Math.PI/10]),[-Math.PI/2+.36,0,0])),faces:m.faces.map(f=>f.indices)};}return facingMesh(sides);}
export function rollDuration(random=Math.random){return 2100+(Math.max(0,Math.min(1,random()))*2-1)*1000;}
export function drawDie(canvas,shape,value,angles,settled,color=DICE_COLORS[4],numberOnly=false){
 const size=104,dpr=canvas.width/size,ctx=canvas.getContext('2d'),vertices=shape.vertices.map(v=>rotateVertex(v,angles)),project=v=>[size/2+v[0]*40*4/(4-v[2]),size/2-v[1]*40*4/(4-v[2])];ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
 const faces=shape.faces.map((ids,index)=>{const points=ids.map(i=>vertices[i]),normal=unit(cross(sub(points[1],points[0]),sub(points[2],points[0]))),center=points.reduce((s,v)=>s.map((n,j)=>n+v[j]/points.length),[0,0,0]);return {points,normal,center,index};}).filter(f=>dot(f.normal,sub([0,0,4],f.center))>0).sort((a,b)=>a.center[2]-b.center[2]);
 if(!numberOnly)for(const f of faces){const points=f.points.map(project),light=Math.round(27+Math.max(0,dot(f.normal,unit([-.5,1,2])))*29);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=`hsl(${color[0]} ${color[1]}% ${light}% / .7)`;ctx.fill();ctx.strokeStyle=`hsl(${color[0]} ${color[1]}% 74%)`;ctx.lineWidth=1.4;ctx.lineJoin='round';ctx.stroke();}
 if(settled){const front=faces.reduce((best,f)=>!best||f.normal[2]>best.normal[2]?f:best,null),p=project(front.center);ctx.fillStyle='#fff8e9';ctx.strokeStyle='#14241c';ctx.lineWidth=2;ctx.font=`700 ${String(value).length>1?29:34}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.translate(p[0],p[1]+1);ctx.scale(.85,1);ctx.strokeText(String(value),0,0);ctx.fillText(String(value),0,0);return [p[0],p[1]+1];}
}
