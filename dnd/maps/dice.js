import {consumeMapDismissal} from './map-dismissal.js?v=32';
import {el,button} from './editor-dom.js?v=32';
export const DICE=[4,6,8,10,20,100];
export function dieValue(sides,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]){
  if(!DICE.includes(sides))throw new Error('Unsupported die.');
  const limit=2**32-(2**32%sides);let n;do{n=random();}while(n>=limit);return n%sides+1;
}
export function rollDice(counts,random){return DICE.flatMap(sides=>Array.from({length:Math.max(0,Math.min(20,Math.floor(counts[sides]||0)))},()=>({sides,value:dieValue(sides,random)})));}
export function createDiceTools(){
  const stage=document.getElementById('map-stage'),toggle=button('',()=>panel.hidden?open():close(),'toolbar-icon dice-toggle');toggle.id='open-dice';toggle.title='Dice';toggle.setAttribute('aria-label','Dice');toggle.setAttribute('aria-pressed','false');toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><g fill="currentColor" stroke="none"><circle cx="8" cy="8" r="1.4"/><circle cx="16" cy="8" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/></g></svg>';document.querySelector('.fog-controls').after(toggle);
  const panel=el('section',null,'dice-panel'),display=el('div',null,'dice-display'),tray=el('div',null,'dice-results'),total=el('output','0','dice-total'),controls=el('div',null,'dice-controls');panel.hidden=true;panel.setAttribute('aria-label','Dice throw');panel.setAttribute('role','dialog');total.setAttribute('aria-label','Dice total');total.setAttribute('aria-live','polite');display.append(tray,total);panel.append(display,controls);stage.append(panel);
  let counts={},timer=null,rolling=false;const buttons=new Map();
  function refresh(){for(const [sides,b]of buttons){b.querySelector('output').textContent=counts[sides]||'';b.setAttribute('aria-label',`D${sides}: ${counts[sides]||0} selected`);b.disabled=rolling||(counts[sides]||0)>=20;}throwButton.disabled=rolling||!Object.values(counts).some(Boolean);}
  function reset(){clearTimeout(timer);rolling=false;counts={};tray.replaceChildren();total.textContent='0';panel.classList.remove('rolling');refresh();}
  controls.append(button('Reset',reset));for(const sides of DICE){const b=button('',()=>{counts[sides]=Math.min(20,(counts[sides]||0)+1);refresh();},'die-choice');b.append(el('output',''),el('span',`D${sides}`));controls.append(b);buttons.set(sides,b);}
  const throwButton=button('Throw',()=>{const result=rollDice(counts);if(!result.length)return;rolling=true;panel.classList.add('rolling');tray.replaceChildren();total.textContent='…';refresh();for(const [index,die]of result.entries()){const face=el('div','',`rolled-die die-${die.sides}`);face.style.setProperty('--i',index%9);face.append(el('small',`D${die.sides}`),el('strong','?'));tray.append(face);}timer=setTimeout(()=>{[...tray.children].forEach((face,i)=>face.querySelector('strong').textContent=result[i].value);total.textContent=String(result.reduce((sum,d)=>sum+d.value,0));rolling=false;panel.classList.remove('rolling');refresh();},matchMedia('(prefers-reduced-motion:reduce)').matches?0:950);},'primary');controls.append(throwButton);refresh();
  function open(){panel.hidden=false;toggle.setAttribute('aria-pressed','true');}function close(){panel.hidden=true;toggle.setAttribute('aria-pressed','false');}
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&stage.contains(e.target)&&!panel.contains(e.target)&&!toggle.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
  document.addEventListener('keydown',e=>{if(!panel.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
  return {close};
}
