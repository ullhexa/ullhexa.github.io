// Measure at the normal font size, then shrink only labels that need it.
// One observer per grid; no card-image or gameplay rendering work is involved.
export function fitSpellTitles(grid){
 const context=document.createElement('canvas').getContext('2d');let frame=0,closed=false;
 function fit(){
  frame=0;if(closed||!grid.isConnected)return;
  const titles=[...grid.querySelectorAll('.spell-card-title')];if(!titles.length)return;
  const widths=titles.map(title=>title.getBoundingClientRect().width);
  context.font=`600 12px ${getComputedStyle(titles[0]).fontFamily}`;
  const sizes=titles.map((title,i)=>Math.max(8,Math.min(12,12*(widths[i]-1)/Math.max(1,context.measureText(title.textContent).width))));
  titles.forEach((title,i)=>{if(widths[i]>0)title.style.fontSize=`${Math.floor(sizes[i]*10)/10}px`;});
 }
 function update(){if(!closed&&!frame)frame=requestAnimationFrame(fit);}
 const observer=new ResizeObserver(update);observer.observe(grid);document.fonts.ready.then(update);update();
 return {update,destroy(){closed=true;observer.disconnect();cancelAnimationFrame(frame);}};
}
