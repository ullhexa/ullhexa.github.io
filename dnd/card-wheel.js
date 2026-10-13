// Treat a trackpad's momentum events as one gesture, with immediate reversal.
// Leave browser zoom, horizontal scrolling and single-page cards untouched.
export function installCardWheel(surface,count,step){
 let last=-Infinity,direction=0;
 surface.addEventListener('wheel',event=>{
  if(!event.target.closest('img'))return;
  if(count<2||event.ctrlKey||event.metaKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  event.preventDefault();event.stopPropagation();
  const now=performance.now(),next=Math.sign(event.deltaY),advance=now-last>=160||next!==direction;
  last=now;direction=next;if(advance)step(next);
 },{passive:false});
}
