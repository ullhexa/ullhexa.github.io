import {consumeMapDismissal} from './map-dismissal.js?v=55';
import {diceFaceBank,faceReveal,blendDieFace} from './dice-faces.js?v=55';
import {drawDie,percentileFaces,rollDuration} from './dice-geometry.js?v=55';
import {el,button} from './editor-dom.js?v=55';
import {isTextEntry} from './keyboard.js?v=55';
export const DICE=[4,6,8,10,20,100];
export function dieValue(sides,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]){
  if(!DICE.includes(sides))throw new Error('Unsupported die.');
  const limit=2**32-(2**32%sides);let n;do{n=random();}while(n>=limit);return n%sides+1;
}
export function rollDice(counts,random){return DICE.flatMap(sides=>Array.from({length:Math.max(0,Math.min(20,Math.floor(counts[sides]||0)))},()=>({sides,value:dieValue(sides,random)})));}
export function createDiceTools(){
  const stage=document.getElementById('map-stage'),toggle=button('',()=>panel.hidden?open():close(),'toolbar-icon dice-toggle');toggle.id='open-dice';toggle.title='Dice';toggle.setAttribute('aria-label','Dice');toggle.setAttribute('aria-pressed','false');toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><g fill="currentColor" stroke="none"><circle cx="8" cy="8" r="1.4"/><circle cx="16" cy="8" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/></g></svg>';document.querySelector('.fog-controls').after(toggle);
  const panel=el('section',null,'dice-panel'),display=el('div',null,'dice-display'),tray=el('div',null,'dice-results'),total=el('output','0','dice-total'),controls=el('div',null,'dice-controls');panel.hidden=true;panel.setAttribute('aria-label','Dice throw');panel.setAttribute('role','dialog');total.setAttribute('aria-label','Dice total');total.setAttribute('aria-live','polite');display.append(tray,total);panel.append(display,controls);stage.append(panel);
  let counts={},animation=null,rolling=false,choice=null,choiceTimer=null;const buttons=new Map();
  function selectChoice(sides){clearTimeout(choiceTimer);choice=sides;for(const [value,b]of buttons)b.classList.toggle('keyboard-selected',value===choice);if(choice!==null)choiceTimer=setTimeout(()=>selectChoice(null),5000);}
  function changeCount(sides,delta){if(rolling)return;diceFaceBank(sides);counts[sides]=Math.max(0,Math.min(20,(counts[sides]||0)+delta));refresh();}
  function refresh(){for(const [sides,b]of buttons){b.querySelector('output').textContent=counts[sides]||'';b.setAttribute('aria-label',`D${sides}: ${counts[sides]||0} selected`);b.disabled=rolling||(counts[sides]||0)>=20;}throwButton.disabled=rolling||!Object.values(counts).some(Boolean);}
  function reset(){cancelAnimationFrame(animation);rolling=false;counts={};tray.replaceChildren();total.textContent='0';panel.classList.remove('rolling');selectChoice(null);refresh();}
  controls.append(button('Reset',reset));for(const sides of DICE){const b=button('',()=>{selectChoice(sides);changeCount(sides,1);},'die-choice');b.append(el('output',''),el('span',`D${sides}`));controls.append(b);buttons.set(sides,b);}
  const throwButton=button('Throw',()=>{
    const result=rollDice(counts);if(!result.length)return;rolling=true;panel.classList.add('rolling');tray.replaceChildren();total.textContent='…';refresh();const rendered=[],reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    for(const [index,die]of result.entries()){
      const group=el('div',null,`dice-result${die.sides===100?' percentile-pair':''}`);group.setAttribute('role','img');group.dataset.sides=die.sides;group.dataset.value=die.value;group.setAttribute('aria-label',`D${die.sides}: rolling`);
      const values=die.sides===100?percentileFaces(die.value):[die.value],bank=diceFaceBank(die.sides);
      for(const [part,value]of values.entries()){const canvas=el('canvas',null,'rolled-die');canvas.width=canvas.height=104*bank.ratio;canvas.style.marginTop=`${bank.offsetY}px`;canvas.setAttribute('aria-hidden','true');group.append(canvas);rendered.push({canvas,shape:bank.shape,plate:bank.faces.get(String(value)),value,index:index*2+part,color:bank.color,duration:reduced?0:rollDuration(),settled:false});}
      tray.append(group);
    }
    const start=performance.now();
    for(const die of rendered)die.canvas.dataset.duration=String(die.duration);
    function frame(now){let moving=false;for(const die of rendered){if(die.settled)continue;const progress=die.duration?Math.min(1,(now-start)/die.duration):1,remaining=(1-progress)**3,axes=[[4,1,.5],[3,3,1.5],[.7,4,2]][die.index%3],angles=axes.map(turns=>remaining*(turns+(die.index%5)*.17)*Math.PI*2);drawDie(die.canvas,die.shape,die.value,angles,false,die.color);blendDieFace(die.canvas,die.plate,faceReveal(now-start,die.duration));die.settled=progress===1;if(die.settled)die.canvas.dataset.settled='true';else moving=true;}if(moving){animation=requestAnimationFrame(frame);return;}[...tray.children].forEach((group,i)=>group.setAttribute('aria-label',`D${result[i].sides}: ${result[i].value}`));total.textContent=String(result.reduce((sum,d)=>sum+d.value,0));rolling=false;panel.classList.remove('rolling');refresh();}
    animation=requestAnimationFrame(frame);
  },'primary');controls.append(throwButton);refresh();
  function open(){selectChoice(null);panel.hidden=false;toggle.setAttribute('aria-pressed','true');}function close(){selectChoice(null);panel.hidden=true;toggle.setAttribute('aria-pressed','false');}
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&stage.contains(e.target)&&!panel.contains(e.target)&&!toggle.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
  document.addEventListener('library-opening',close);
  panel.addEventListener('pointerdown',()=>{if(choice!==null)selectChoice(choice);});
  document.addEventListener('keydown',e=>{
    if(panel.hidden||e.defaultPrevented||e.isComposing||e.metaKey||e.ctrlKey||e.altKey||isTextEntry(e.target)||e.target.closest('select,.reference-suite')||document.querySelector('dialog[open],.token-status-editor,.item-comment'))return;
    if(![' ','Backspace','Delete','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Delete'||e.key==='Escape'){close();return;}
    if(e.key==='Backspace'){reset();return;}
    if(e.key===' '){if(choice!==null)selectChoice(choice);if(!e.repeat)throwButton.click();return;}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const delta=e.key==='ArrowRight'?1:-1,index=choice===null?(delta===1?-1:0):DICE.indexOf(choice);selectChoice(DICE[(index+delta+DICE.length)%DICE.length]);return;}
    if(choice!==null){selectChoice(choice);changeCount(choice,e.key==='ArrowUp'?1:-1);}
  },true);
  return {close};
}
