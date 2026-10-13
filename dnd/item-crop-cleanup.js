// An atlas neighbour can enter a crop as a detached fragment. Remove only
// small disconnected components that touch its cut edge; keep the main art.
export function cleanCropEdges(pixels,width,height){
  const seen=new Uint8Array(width*height),parts=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||pixels[start*4+3]<3)continue;
    const cells=[start];seen[start]=1;let edge=false;
    for(let n=0;n<cells.length;n++){
      const cell=cells[n],x=cell%width,y=Math.floor(cell/width);
      if(x<3||y<3||x>=width-3||y>=height-3)edge=true;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy,next=yy*width+xx;
        if(xx<0||yy<0||xx>=width||yy>=height||seen[next]||pixels[next*4+3]<3)continue;
        seen[next]=1;cells.push(next);
      }
    }
    parts.push({cells,edge});
  }
  const largest=Math.max(0,...parts.map(p=>p.cells.length));
  for(const part of parts)if(part.edge&&part.cells.length<largest*.45)for(const cell of part.cells)pixels[cell*4+3]=0;
  return pixels;
}
