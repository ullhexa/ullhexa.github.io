const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
// SVG meet-fit can expose more world area than its nominal viewBox on one axis.
// Bound that actual visible area, independently for each display's aspect ratio.
export function boundedCamera(map,camera,viewport=[map.width,map.height]){
  const zoom=clamp(camera.zoom,1,3),[width,height]=viewport;
  if(zoom===1)return {x:.5,y:.5,zoom};
  const scale=Math.min(Math.max(1,width)/map.width,Math.max(1,height)/map.height)*zoom;
  const half=[width/(scale*map.width*2),height/(scale*map.height*2)];
  return {x:half[0]>=.5?.5:clamp(camera.x,half[0],1-half[0]),y:half[1]>=.5?.5:clamp(camera.y,half[1],1-half[1]),zoom};
}
export function cameraViewBox(map,camera,viewport){const c=boundedCamera(map,camera,viewport),w=map.width/c.zoom,h=map.height/c.zoom;return {camera:c,viewBox:[c.x*map.width-w/2,c.y*map.height-h/2,w,h]};}

export function cameraGeometry(map,camera,viewport){const c=boundedCamera(map,camera,viewport),scale=Math.min(viewport[0]/map.width,viewport[1]/map.height)*c.zoom;return {camera:c,scale,x:viewport[0]/2-c.x*map.width*scale,y:viewport[1]/2-c.y*map.height*scale,width:viewport[0],height:viewport[1]};}
