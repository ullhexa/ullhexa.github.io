// Screen-pixel placement: avoid token faces without measuring layout during drags.
export function placeRulerLabel(preferred,size,viewport,tokens){
 const [w,h]=size,[width,height]=viewport,gap=7,halfW=w/2,halfH=h/2;
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(Math.max(lo,hi),n));
 const bound=([x,y])=>[clamp(x,halfW+4,width-halfW-4),clamp(y,halfH+4,height-halfH-4)];
 const start=bound(preferred),overlap=([x,y],b)=>x+halfW>b.left-gap&&x-halfW<b.right+gap&&y+halfH>b.top-gap&&y-halfH<b.bottom+gap;
 const obstacles=tokens.filter(b=>b.right>=0&&b.left<=width&&b.bottom>=0&&b.top<=height);
 if(!obstacles.some(b=>overlap(start,b)))return start;
 const candidates=[start];
 for(const b of obstacles)candidates.push(bound([start[0],b.top-gap-halfH]),bound([start[0],b.bottom+gap+halfH]),bound([b.left-gap-halfW,start[1]]),bound([b.right+gap+halfW,start[1]]));
 candidates.sort((a,b)=>Math.hypot(a[0]-start[0],a[1]-start[1])-Math.hypot(b[0]-start[0],b[1]-start[1]));
 return candidates.find(p=>!obstacles.some(b=>overlap(p,b)))||start;
}
