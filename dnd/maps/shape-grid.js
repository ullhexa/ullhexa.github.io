import {shapeBounds} from './shape-label.js?v=62';

const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const area=p=>Math.abs(p.reduce((sum,v,i)=>sum+cross(v,p[(i+1)%p.length]),0))/2;
function clip(p,a,b,c){
  const out=[];
  for(let i=0;i<p.length;i++){
    const v=p[i],w=p[(i+1)%p.length],dv=a*v[0]+b*v[1]-c,dw=a*w[0]+b*w[1]-c;
    if(dv<=0)out.push(v);
    if((dv<0&&dw>0)||(dv>0&&dw<0)){const t=dv/(dv-dw);out.push([v[0]+(w[0]-v[0])*t,v[1]+(w[1]-v[1])*t]);}
  }
  return out;
}
// Exact disk/polygon intersection: split each edge at circle intersections,
// then sum triangle areas inside the disk and circular sectors outside it.
function diskArea(p,r){
  let sum=0;
  for(let i=0;i<p.length;i++){
    const a=p[i],b=p[(i+1)%p.length],d=[b[0]-a[0],b[1]-a[1]],aa=dot(d,d),bb=2*dot(a,d),cc=dot(a,a)-r*r,disc=bb*bb-4*aa*cc,ts=[0,1];
    if(aa>1e-20&&disc>0){const q=Math.sqrt(disc);for(const t of [(-bb-q)/(2*aa),(-bb+q)/(2*aa)])if(t>0&&t<1)ts.push(t);}
    ts.sort((a,b)=>a-b);
    for(let j=1;j<ts.length;j++){
      const u=ts[j-1],v=ts[j],x=[a[0]+d[0]*u,a[1]+d[1]*u],y=[a[0]+d[0]*v,a[1]+d[1]*v],m=[(x[0]+y[0])/2,(x[1]+y[1])/2];
      sum+=dot(m,m)<=r*r+1e-12?cross(x,y)/2:r*r*Math.atan2(cross(x,y),dot(x,y))/2;
    }
  }
  return Math.abs(sum);
}
export function shapeCellCoverage(map,shape,column,row){
  const size=map.grid.size,[ox,oy]=map.grid.offset||[0,0],cx=shape.center[0]*map.width,cy=shape.center[1]*map.height,a=-shape.rotation*Math.PI/180,co=Math.cos(a),si=Math.sin(a),r=shape.size/map.grid.distance;
  let p=[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>{const dx=column+x+(ox-cx)/size,dy=row+y+(oy-cy)/size;return[dx*co-dy*si,dx*si+dy*co];});
  if(shape.type==='square'){for(const [x,y]of [[1,0],[-1,0],[0,1],[0,-1]])p=clip(p,x,y,r/2);return Math.min(1,area(p));}
  if(shape.type==='cone'){p=clip(p,Math.sqrt(3),1,0);p=clip(p,-Math.sqrt(3),1,0);}
  return Math.max(0,Math.min(1,diskArea(p,r)));
}
export function affectedCells(map,shape){
  const b=shapeBounds(shape,map),size=map.grid.size,[ox,oy]=map.grid.offset||[0,0],cells=[];
  const left=Math.floor((Math.max(0,b.left)-ox)/size),right=Math.ceil((Math.min(map.width,b.right)-ox)/size),top=Math.floor((Math.max(0,b.top)-oy)/size),bottom=Math.ceil((Math.min(map.height,b.bottom)-oy)/size);
  for(let row=top;row<bottom;row++)for(let col=left;col<right;col++)if(shapeCellCoverage(map,shape,col,row)>=.5-1e-9)cells.push({column:col,row,x:ox+col*size,y:oy+row*size,size});
  return cells;
}
export function snapShapePoint(map,point){
  return point.map((n,i)=>{const extent=i?map.height:map.width,offset=map.grid.offset?.[i]||0,first=Math.ceil(-offset/map.grid.size),last=Math.floor((extent-offset)/map.grid.size),index=Math.max(first,Math.min(last,Math.round((n*extent-offset)/map.grid.size)));return(offset+index*map.grid.size)/extent;});
}
