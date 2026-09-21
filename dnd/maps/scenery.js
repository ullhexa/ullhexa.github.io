import {loadRaster} from './resource-loading.js?v=44';
const NS='http://www.w3.org/2000/svg';
// Cache static art/light masks once per scene change at the source art resolution.
// Pan/zoom move the cached plane; they never rebuild clips or light masks.
export function createScenery(map,svg){
 const scene=document.createElementNS(NS,'svg');scene.id='map-scenery';scene.setAttribute('aria-hidden','true');scene.setAttribute('viewBox',`0 0 ${map.width} ${map.height}`);scene.setAttribute('width',map.width);scene.setAttribute('height',map.height);
 const defs=svg.querySelector('defs'),overlayDefs=document.createElementNS(NS,'defs');overlayDefs.append(document.getElementById('map-grid'));svg.prepend(overlayDefs);scene.append(defs);
 for(const id of ['artwork','floor-layers','terrain-layers','roof-layers','lighting-layer'])scene.append(document.getElementById(id));svg.before(scene);
 const plane=document.createElement('div');plane.id='scenery-cache';plane.setAttribute('aria-hidden','true');plane.style.width=`${map.width}px`;plane.style.height=`${map.height}px`;plane.hidden=true;scene.before(plane);
 if(map.userMap){
  const image=document.createElement('img');image.className='scenery-original';image.alt='';image.src=map.art.base.startsWith('asset-')?scene.querySelector('#artwork image').getAttribute('href'):map.art.base;const darkness=document.createElement('div');darkness.className='scenery-darkness';plane.append(image,darkness);plane.hidden=false;scene.style.visibility='hidden';let transform='';
  return {render(level){darkness.style.opacity=level/100;},position({scale,x,y}){const next=`translate3d(${x}px,${y}px,0) scale(${scale})`;if(next!==transform){plane.style.transform=next;transform=next;}}};
 }
 const art=document.createElement('canvas'),light=document.createElement('canvas');art.className='scenery-art';light.className='scenery-light';plane.append(art,light);
 const images=[...scene.querySelectorAll('image')],sources=new Map();let transform='',artKey='',lightKey='',request=0,ready=false;
 const load=url=>{if(!sources.has(url))sources.set(url,loadRaster(url).catch(e=>{sources.delete(url);throw e;}));return sources.get(url);};
 const painted=node=>node.style.display!=='none'&&node.parentElement.style.display!=='none'&&node.style.opacity!=='0';
 async function render(darkness){
  light.style.opacity=darkness/100;
  const visible=images.filter(painted),nextArt=visible.map(n=>`${n.getAttribute('href')}:${n.getAttribute('clip-path')||''}`).join('|'),nextLight=[...scene.querySelectorAll('#night-darkness-mask>g,#night-lights>g')].map(n=>n.style.display).join('|');
  if(ready&&nextArt===artKey&&nextLight===lightKey)return;const ticket=++request;
  try{
   const rasters=await Promise.all(visible.map(n=>load(n.getAttribute('href'))));if(ticket!==request)return;
   if(!ready){const base=rasters[0],ratio=Math.min(1,4096/base.naturalWidth,4096/base.naturalHeight);art.width=light.width=Math.round(base.naturalWidth*ratio);art.height=light.height=Math.round(art.width*map.height/map.width);}
   let lightImage=null;
   if(!ready||nextLight!==lightKey){const raster=document.createElementNS(NS,'svg');raster.setAttribute('width',light.width);raster.setAttribute('height',light.height);raster.setAttribute('viewBox',`0 0 ${map.width} ${map.height}`);const lights=document.getElementById('lighting-layer').cloneNode(true);lights.style.opacity=1;lights.style.transition='none';raster.append(defs.cloneNode(true),lights);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(raster)],{type:'image/svg+xml'}));try{lightImage=await loadRaster(url);}finally{URL.revokeObjectURL(url);}if(ticket!==request)return;}
   if(!ready||nextArt!==artKey){const c=art.getContext('2d');c.clearRect(0,0,art.width,art.height);c.save();c.scale(art.width/map.width,art.height/map.height);visible.forEach((node,i)=>{c.save();const clip=node.getAttribute('clip-path')?.match(/#([^)]*)/)?.[1],polygon=clip&&document.getElementById(clip)?.querySelector('polygon');if(polygon){const points=polygon.points;c.beginPath();for(let j=0;j<points.numberOfItems;j++){const p=points.getItem(j);j?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);}c.closePath();c.clip();}c.drawImage(rasters[i],0,0,map.width,map.height);c.restore();});c.restore();artKey=nextArt;}
   if(lightImage){const c=light.getContext('2d');c.clearRect(0,0,light.width,light.height);c.drawImage(lightImage,0,0);lightKey=nextLight;}
   ready=true;plane.hidden=false;scene.style.visibility='hidden';
  }catch{if(ticket===request){ready=false;plane.hidden=true;scene.style.visibility='';}}
 }
 return {render,position({scale,x,y}){const next=`translate3d(${x}px,${y}px,0) scale(${scale})`;if(next!==transform){scene.style.transform=plane.style.transform=next;transform=next;}}};
}
