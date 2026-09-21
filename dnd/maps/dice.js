import {consumeMapDismissal} from './map-dismissal.js?v=60';
import {diceFaceBank,faceReveal,blendDieFace} from './dice-faces.js?v=60';
import {drawDie,landingMesh,percentileFaces,rollDuration} from './dice-geometry.js?v=60';
import {boardIcon} from './control-icons.js?v=60';
import {el,button} from './editor-dom.js?v=60';
import {isTextEntry} from './keyboard.js?v=60';
export const DICE=[4,6,8,10,12,20,100];
export function dieValue(sides,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]){
  if(!DICE.includes(sides))throw new Error('Unsupported die.');
  const limit=2**32-(2**32%sides);let n;do{n=random();}while(n>=limit);return n%sides+1;
}
export function rollDice(counts,random){return DICE.flatMap(sides=>Array.from({length:Math.max(0,Math.min(20,Math.floor(counts[sides]||0)))},()=>({sides,value:dieValue(sides,random)})));}
export function createDiceTools(){
  const stage=document.getElementById('map-stage'),toggle=button('',()=>panel.hidden?open():close(),'toolbar-icon dice-toggle');toggle.id='open-dice';toggle.title='Dice';toggle.setAttribute('aria-label','Dice');toggle.setAttribute('aria-pressed','false');toggle.append(boardIcon('dice'));document.querySelector('.fog-controls').after(toggle);
  const panel=el('section',undefined,'dice-panel instant-dice'),controls=el('div',undefined,'dice-controls'),display=el('div',undefined,'dice-display'),tray=el('div',undefined,'dice-results'),total=el('output','0','dice-total');panel.hidden=true;panel.setAttribute('aria-label','Dice throw');panel.setAttribute('role','dialog');total.setAttribute('aria-label','Dice total');total.setAttribute('aria-live','polite');display.append(tray,total);panel.append(controls,display);stage.append(panel);
  const buttons=new Map();let pool=[],animation=0,sequence=0,choice=null,choiceTimer=0;
  function position(){if(panel.hidden)return;const r=toggle.getBoundingClientRect(),s=stage.getBoundingClientRect();panel.style.left=`${Math.max(0,Math.min(stage.clientWidth-panel.offsetWidth,r.left+r.width/2-s.left-panel.offsetWidth/2))}px`;panel.style.top='0px';}
  function selectChoice(sides){clearTimeout(choiceTimer);choice=sides;for(const[value,b]of buttons)b.classList.toggle('keyboard-selected',value===choice);if(choice!==null)choiceTimer=setTimeout(()=>selectChoice(null),5000);}
  function refresh(){
    for(const[sides,b]of buttons){const dice=pool.filter(d=>d.sides===sides),moving=dice.some(d=>d.parts.some(p=>!p.settled)),sum=dice.reduce((s,d)=>s+d.value,0);b.querySelector('.die-count').textContent=dice.length||'';b.querySelector('output').textContent=moving?'…':String(sum);b.setAttribute('aria-label',`Roll D${sides}, ${dice.length} dice, total ${moving?'rolling':sum}`);b.disabled=dice.length>=20;}
    const moving=pool.some(d=>d.parts.some(p=>!p.settled));panel.classList.toggle('rolling',moving);total.textContent=moving?'…':String(pool.reduce((s,d)=>s+d.value,0));
  }
  function reset(){cancelAnimationFrame(animation);animation=0;pool=[];tray.replaceChildren();selectChoice(null);refresh();}
  function remove(die){pool=pool.filter(d=>d!==die);die.group.remove();refresh();if(!pool.some(d=>d.parts.some(p=>!p.settled))){cancelAnimationFrame(animation);animation=0;}}
  function frame(now){animation=0;let moving=false,changed=false;for(const die of pool)for(const part of die.parts){if(part.settled)continue;const elapsed=now-part.start,progress=part.duration?Math.min(1,elapsed/part.duration):1,remaining=(1-progress)**3,axes=[[4,1,.5],[3,3,1.5],[.7,4,2]][part.index%3],angles=axes.map(turns=>remaining*(turns+(part.index%5)*.17)*Math.PI*2);drawDie(part.canvas,part.shape,part.value,angles,false,part.color);blendDieFace(part.canvas,part.plate,faceReveal(elapsed,part.duration));if(progress===1){part.settled=true;part.canvas.dataset.settled='true';changed=true;if(die.parts.every(p=>p.settled))die.group.setAttribute('aria-label',`Remove D${die.sides}: ${die.value}`);}else moving=true;}if(changed)refresh();if(moving)animation=requestAnimationFrame(frame);}
  function add(sides){
    if(pool.filter(d=>d.sides===sides).length>=20)return;const value=dieValue(sides),bank=diceFaceBank(sides),die={sides,value,parts:[]},group=button('',()=>remove(die),`dice-result${sides===100?' percentile-pair':''}`);die.group=group;group.dataset.sides=sides;group.dataset.value=value;group.setAttribute('aria-label',`Remove D${sides}: rolling`);group.title='Remove die';
    const values=sides===100?percentileFaces(value):[value],reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    for(const v of values){const canvas=el('canvas',undefined,'rolled-die');canvas.width=canvas.height=104*bank.ratio;canvas.style.marginTop=`${bank.offsetY}px`;canvas.setAttribute('aria-hidden','true');const part={canvas,shape:bank.shape,plate:bank.faces.get(String(v)),value:v,index:sequence++,color:bank.color,duration:reduced?0:rollDuration(),start:performance.now(),settled:false};canvas.dataset.duration=part.duration;die.parts.push(part);group.append(canvas);}
    pool.push(die);pool.sort((a,b)=>DICE.indexOf(a.sides)-DICE.indexOf(b.sides));const next=pool[pool.indexOf(die)+1];tray.insertBefore(group,next?.group||null);refresh();if(!animation)animation=requestAnimationFrame(frame);
  }
  for(const sides of DICE){const b=button('',()=>{selectChoice(sides);add(sides);},'die-choice');b.dataset.die=sides;const canvas=el('canvas',undefined,'die-choice-face');canvas.width=canvas.height=208;canvas.setAttribute('aria-hidden','true');drawDie(canvas,landingMesh(sides===100?10:sides),sides,[0,0,0],true,[0,0]);b.append(el('span','','die-count'),canvas,el('output','0'));controls.append(b);buttons.set(sides,b);}
  display.addEventListener('click',e=>{if(!e.target.closest('.dice-result'))reset();});panel.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();reset();});
  function open(){reset();panel.hidden=false;toggle.setAttribute('aria-pressed','true');position();}function close(){reset();panel.hidden=true;toggle.setAttribute('aria-pressed','false');}
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target)){close();consumeMapDismissal(e,stage);}},true);
  document.addEventListener('library-opening',close);new ResizeObserver(position).observe(stage);window.addEventListener('resize',position);document.addEventListener('scroll',position,true);
  document.addEventListener('keydown',e=>{
    if(panel.hidden||e.defaultPrevented||e.isComposing||e.metaKey||e.ctrlKey||e.altKey||isTextEntry(e.target)||e.target.closest('select,.reference-suite')||document.querySelector('dialog[open],.token-status-editor,.item-comment'))return;
    if(![' ','Backspace','Delete','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Delete'||e.key==='Escape'){close();return;}if(e.key==='Backspace'){reset();return;}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const delta=e.key==='ArrowRight'?1:-1,index=choice===null?(delta===1?-1:0):DICE.indexOf(choice);selectChoice(DICE[(index+delta+DICE.length)%DICE.length]);return;}
    if(e.key===' '){if(!e.repeat){const sides=choice??20;selectChoice(sides);add(sides);}return;}
    if(choice!==null){selectChoice(choice);if(e.key==='ArrowUp')add(choice);else{const die=pool.findLast(d=>d.sides===choice);if(die)remove(die);}}
  },true);
  refresh();return{close};
}
