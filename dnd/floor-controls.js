// Elevator labels are one above the authored ground-relative level. Saved IDs stay unchanged.
export function numberedFloors(place){
  return (place.floors||[]).map((floor,index)=>({floor,level:1+(Number.isSafeInteger(floor.level)?floor.level:floor.id==='ground'?0:floor.id==='upper'?1:floor.id==='basement'?-1:index)})).sort((a,b)=>a.level-b.level);
}
export function createFloorControl(place,{getFloor,onSelect}){
  const entries=numberedFloors(place),root=document.createElement('div');root.className='place-floors';
  const range=document.createElement('span');range.className='floor-range';range.textContent=`Floors: ${entries[0].level} to ${entries.at(-1).level}`;
  const control=document.createElement('div');control.className='number-stepper floor-stepper';
  const input=document.createElement('input');input.type='number';input.step='1';input.min=entries[0].level;input.max=entries.at(-1).level;input.setAttribute('aria-label',`${place.name} floor`);
  function current(){return entries.findIndex(entry=>entry.floor.id===getFloor()?.id);}
  function apply(entry){if(entry&&entry.floor.id!==getFloor()?.id)onSelect(entry.floor,entry.level);render();}
  function step(delta){apply(entries[Math.max(0,Math.min(entries.length-1,current()+delta))]);}
  function applyInput(){const value=input.value.trim()===''?NaN:Number(input.value);if(Number.isFinite(value)){const rounded=Math.round(value);apply(entries.reduce((a,b)=>Math.abs(b.level-rounded)<Math.abs(a.level-rounded)?b:a));}else render();}
  const buttons=[[-1,'↓','Lower'],[1,'↑','Higher']].map(([delta,glyph,name])=>{const button=document.createElement('button');button.type='button';button.textContent=glyph;button.setAttribute('aria-label',`${name} ${place.name} floor`);button.addEventListener('click',()=>{step(delta);input.focus({preventScroll:true});});return button;});
  input.addEventListener('change',applyInput);
  input.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;if(['ArrowUp','ArrowDown','Enter','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Enter'){applyInput();input.blur();}else if(e.key==='Escape'){render();input.blur();}else step(e.key==='ArrowUp'?1:-1);}});
  input.addEventListener('wheel',e=>{if(document.activeElement!==input||e.ctrlKey||e.metaKey||!e.deltaY)return;e.preventDefault();step(e.deltaY<0?1:-1);},{passive:false});
  control.append(input,...buttons);root.append(range,control);
  function render(){const index=current();input.value=entries[index]?.level??entries[0].level;buttons[0].disabled=index<=0;buttons[1].disabled=index>=entries.length-1;}
  render();return {root,render};
}
