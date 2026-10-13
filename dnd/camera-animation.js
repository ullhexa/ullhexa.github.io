export const focusEase=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
export function focusCameraAt(from,to,progress){const t=focusEase(progress);return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,zoom:Math.exp(Math.log(from.zoom)+(Math.log(to.zoom)-Math.log(from.zoom))*t)};}
export function clickZoomTarget(current,maximum,direction){return Math.max(1,Math.min(maximum,current+Math.sign(direction)*maximum/4));}
export function zoomCurveAt(from,to,velocity,duration,progress){
 const t=Math.max(0,Math.min(1,progress)),distance=to-from;
 // Hermite interpolation carries the current speed into a rapid retarget.
 // Limit only a reversal/overshoot; ordinary same-direction bursts stay smooth.
 const slope=distance?Math.sign(distance)*Math.min(Math.max(0,velocity*Math.sign(distance)),3*Math.abs(distance)/duration):0;
 return {zoom:(2*t*t*t-3*t*t+1)*from+(t*t*t-2*t*t+t)*duration*slope+(-2*t*t*t+3*t*t)*to,
 velocity:((6*t*t-6*t)*from+(3*t*t-4*t+1)*duration*slope+(-6*t*t+6*t)*to)/duration};
}
// Interpolate the screen transform, not a camera center clamped on every frame.
// Letterbox margins then close continuously instead of moving the map out and back.
export function zoomCameraAt(from,to,zoom){
 if(from.zoom===to.zoom)return {...to,zoom};
 const t=Math.max(0,Math.min(1,(zoom-from.zoom)/(to.zoom-from.zoom)));
 return {x:(from.x*from.zoom*(1-t)+to.x*to.zoom*t)/zoom,y:(from.y*from.zoom*(1-t)+to.y*to.zoom*t)/zoom,zoom};
}
export function validZoomPath(path){const camera=c=>c&&[c.x,c.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&Number.isFinite(c.zoom)&&c.zoom>=1&&c.zoom<=20;return !!path&&Number.isSafeInteger(path.id)&&path.id>0&&camera(path.from)&&camera(path.to);}
export function createCameraAnimation({getCamera,update,complete,constrain=camera=>camera}){
 let frame=0,run=null,sequence=0;
 function cancel(){cancelAnimationFrame(frame);frame=0;run=null;}
 function finish(){if(!run)return;const target=run.to;cancel();update(target);complete?.();}
 function tick(now){
  if(!run)return;const progress=Math.min(1,(now-run.start)/run.duration);
  if(run.kind==='zoom'){
   const {zoom}=zoomCurveAt(run.from.zoom,run.to.zoom,run.velocity,run.duration,progress);
   update(progress===1?run.to:zoomCameraAt(run.from,run.to,zoom));
  }else update(focusCameraAt(run.from,run.to,progress));
  if(progress===1){cancel();complete?.();}else frame=requestAnimationFrame(tick);
 }
 function start(to,duration=2000){cancel();run={from:{...getCamera()},to,start:performance.now(),duration};if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  frame=requestAnimationFrame(tick);
 }
 function zoomStep(direction,maximum,anchor){
  const now=performance.now(),previous=run?.kind==='zoom'&&now<run.start+run.duration?run:null;
  // Reversing discards the old queue and starts at the displayed view. It must
  // never keep approaching the old target or inherit seconds of unused travel.
  const continuing=previous&&previous.direction===Math.sign(direction)?previous:null;
  if(continuing?.count>=4)return false;
  const from={...getCamera()},base=continuing?.to.zoom??from.zoom,zoom=clickZoomTarget(base,maximum,direction);
  if(zoom===base)return false;
  const velocity=continuing?zoomCurveAt(continuing.from.zoom,continuing.to.zoom,continuing.velocity,continuing.duration,(now-continuing.start)/continuing.duration).velocity:0;
  const ratio=from.zoom/zoom,to=constrain(zoom===1?{x:.5,y:.5,zoom}:{x:anchor[0]+(from.x-anchor[0])*ratio,y:anchor[1]+(from.y-anchor[1])*ratio,zoom});
  const duration=(continuing?continuing.start+continuing.duration-now:0)+1000,count=(continuing?.count||0)+1;
  cancel();run={kind:'zoom',from,to,velocity,start:now,duration,count,direction:Math.sign(direction),path:{id:++sequence,from,to}};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else frame=requestAnimationFrame(tick);return true;
 }
 return {start,zoomStep,cancel,finish,get active(){return !!run;},get zoomPath(){return run?.path||null;}};
}
