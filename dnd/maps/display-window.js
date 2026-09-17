export function playerWindowGeometry({availWidth=1280,availHeight=800,availLeft=0,availTop=0,screenX=0,screenY=0,outerWidth=1280}={}){
  const width=Math.round(Math.min(1000,Math.max(320,availWidth*.68),Math.max(320,availWidth-80)));
  const height=Math.round(Math.min(700,Math.max(240,availHeight*.64),Math.max(240,availHeight-100)));
  const left=Math.round(Math.max(availLeft,Math.min(screenX+(outerWidth-width)/2,availLeft+availWidth-width)));
  const top=Math.round(Math.max(availTop,Math.min(screenY+64,availTop+availHeight-height)));
  return {width,height,left,top};
}
export function openPlayerWindow(url,owner=window){
  const geometry=playerWindowGeometry({...Object.fromEntries(['availWidth','availHeight','availLeft','availTop'].map(key=>[key,owner.screen[key]]).filter(([,value])=>Number.isFinite(value))),screenX:owner.screenX,screenY:owner.screenY,outerWidth:owner.outerWidth});
  // A new browsing context cannot inherit a previous player window's fullscreen.
  const features=['popup=yes','resizable=yes','scrollbars=yes',...Object.entries(geometry).map(([key,value])=>`${key}=${value}`)].join(',');
  const popup=owner.open(url,`ullhexa-player-${crypto.randomUUID()}`,features);
  return popup&&popup!==owner&&popup!==owner.top?popup:null;
}
