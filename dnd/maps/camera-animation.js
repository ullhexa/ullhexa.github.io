export const focusEase=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
export function focusCameraAt(from,to,progress){const t=focusEase(progress);return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,zoom:Math.exp(Math.log(from.zoom)+(Math.log(to.zoom)-Math.log(from.zoom))*t)};}
export function createCameraAnimation({getCamera,update,complete}){
 let frame=0,run=null;
 function cancel(){cancelAnimationFrame(frame);frame=0;run=null;}
 function finish(){if(!run)return;const target=run.to;cancel();update(target);complete?.();}
 function start(to,duration=2000){cancel();run={from:{...getCamera()},to,start:performance.now(),duration};if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  const tick=now=>{if(!run)return;const progress=Math.min(1,(now-run.start)/run.duration);update(focusCameraAt(run.from,run.to,progress));if(progress===1){cancel();complete?.();}else frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
 }
 return {start,cancel,finish,get active(){return !!run;}};
}
