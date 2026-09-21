import {el,button} from './editor-dom.js?v=45';

export function numberStepper(input,{name,normalize}){
  const control=el('div',undefined,'number-stepper');control.append(input);
  function step(delta){
    if(input.disabled||input.readOnly)return;
    input.value=normalize(normalize(input.value)+delta*Number(input.step||1));
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  for(const [delta,arrow,action]of [[-1,'↓','Decrease'],[1,'↑','Increase']]){
    const b=button(arrow,()=>{step(delta);input.focus({preventScroll:true});});
    b.setAttribute('aria-label',`${action} ${name}`);b.title=`${action} ${name}`;
    b.disabled=input.disabled||input.readOnly;control.append(b);
  }
  input.addEventListener('wheel',e=>{
    if(document.activeElement!==input||input.disabled||input.readOnly||e.ctrlKey||e.metaKey||!e.deltaY)return;
    e.preventDefault();step(e.deltaY<0?1:-1);
  },{passive:false});
  return control;
}
