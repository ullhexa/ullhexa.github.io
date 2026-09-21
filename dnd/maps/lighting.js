import {isVisible} from './state.js?v=41';

const NS='http://www.w3.org/2000/svg';
const node=(tag,attrs={})=>{
  const result=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attrs))result.setAttribute(key,value);
  return result;
};

export function lightIsVisible(map,state,light){
  return (!light.floor||state.floors?.[light.floor.placeId]===light.floor.floorId) && (light.requires||[]).every(id=>isVisible(map,state,id)) && !(light.excludes||[]).some(id=>isVisible(map,state,id));
}

// Prepared light fields stay in map coordinates; only visibility and darkness change.
export function createLighting(map,defs,layer){
  const bounds={x:0,y:0,width:map.width,height:map.height};
  const points=polygon=>polygon.map(([x,y])=>`${x*map.width},${y*map.height}`).join(' ');
  const outdoorMask=node('mask',{id:'night-outdoors',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',...bounds,'mask-type':'luminance'});
  outdoorMask.append(node('rect',{...bounds,fill:'white'}));
  for(const polygon of map.lighting?.occluders||[])outdoorMask.append(node('polygon',{points:points(polygon),fill:'black'}));
  const darknessMask=node('mask',{id:'night-darkness-mask',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',...bounds,'mask-type':'luminance'});
  darknessMask.append(node('rect',{...bounds,fill:'white'}));
  const falloff=node('radialGradient',{id:'night-light-falloff'});
  for(const [offset,opacity] of [['0%',.98],['20%',.93],['48%',.65],['75%',.23],['100%',0]])falloff.append(node('stop',{offset,'stop-color':'black','stop-opacity':opacity}));
  const warmth=node('radialGradient',{id:'night-light-warmth'});
  for(const [offset,color,opacity] of [['0%','#ffe3a0',.28],['24%','#ffc470',.21],['58%','#ec9548',.10],['100%','#ec9548',0]])warmth.append(node('stop',{offset,'stop-color':color,'stop-opacity':opacity}));
  defs.append(outdoorMask,darknessMask,falloff,warmth);
  const darkness=node('rect',{id:'night-darkness',...bounds,fill:'#071329',mask:'url(#night-darkness-mask)',opacity:1});
  const glows=node('g',{id:'night-lights'});
  layer.append(darkness,glows);
  const lights=(map.lighting?.lights||[]).map(light=>{
    const attrs=light.clip?{'clip-path':`url(#night-clip-${light.id})`}:{mask:'url(#night-outdoors)'};
    if(light.clip){
      const clip=node('clipPath',{id:`night-clip-${light.id}`,clipPathUnits:'userSpaceOnUse'});
      clip.append(node('polygon',{points:points(light.clip)}));defs.append(clip);
    }
    const cutout=node('g',attrs),glow=node('g',{'data-light-id':light.id,...attrs});
    const circle={cx:light.point[0]*map.width,cy:light.point[1]*map.height,r:light.radius*map.grid.size/map.grid.distance};
    cutout.append(node('circle',{...circle,fill:'url(#night-light-falloff)'}));
    glow.append(node('circle',{...circle,fill:'url(#night-light-warmth)'}));
    darknessMask.append(cutout);glows.append(glow);
    return {light,cutout,glow};
  });
  let firstRender=true;
  return state=>{
    // Fade the prepared darkness and warmth together, retaining the light cutouts.
    if(firstRender)layer.style.transition='none';
    layer.style.opacity=state.environment.darkness/100;
    for(const {light,cutout,glow} of lights){
      const display=lightIsVisible(map,state,light)?'':'none';
      cutout.style.display=display;glow.style.display=display;
    }
    if(firstRender){layer.getBoundingClientRect();layer.style.removeProperty('transition');firstRender=false;}
  };
}
