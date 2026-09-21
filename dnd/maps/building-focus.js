import {boundedCamera} from './camera.js?v=59';

// Fit the complete footprint into 60% of the stage, leaving context around it.
export function buildingFocusCamera(map,place,viewport){
 const shape=place.footprint||map.interactions.find(i=>i.placeId===place.id&&i.type==='roof')?.polygon||map.interactions.find(i=>i.placeId===place.id&&i.type==='terrain'&&!i.variant)?.polygon;
 if(!shape?.length)return boundedCamera(map,{x:place.point[0],y:place.point[1],zoom:(place.focusZoom||2)*.6},viewport);
 const xs=shape.map(p=>p[0]),ys=shape.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const scale=Math.min(viewport[0]/map.width,viewport[1]/map.height);
 const zoom=.6*Math.min(viewport[0]/((right-left)*map.width*scale),viewport[1]/((bottom-top)*map.height*scale));
 return boundedCamera(map,{x:(left+right)/2,y:(top+bottom)/2,zoom},viewport);
}
