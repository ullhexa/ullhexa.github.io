import {el} from './editor-dom.js?v=60';
import {featureEnabled,normalizeFeatures} from './board-state.js?v=60';
export function featureHeading({kind,title,groups,main,footer,getState,commit,render}){
  const heading=el('h3',undefined,'feature-heading'),label=el('label'),check=el('input');check.type='checkbox';check.checked=featureEnabled(getState(),kind);check.setAttribute('aria-label',`Enable ${kind==='encounter'?'encounters':kind}`);label.append(document.createTextNode(title),check);heading.append(label);
  check.addEventListener('change',()=>{document.dispatchEvent(new Event('features-changing'));const s=getState();commit({...s,campaign:{...s.campaign,features:{...normalizeFeatures(s.campaign.features),[kind]:check.checked}}},'Gameplay tools updated.');render();});
  const enabled=check.checked;groups.classList.toggle('feature-disabled',!enabled);main.classList.toggle('feature-disabled',!enabled);main.inert=!enabled;footer.inert=!enabled;footer.classList.toggle('feature-disabled',!enabled);
  queueMicrotask(()=>{for(const child of groups.children)if(!child.classList.contains('feature-heading'))child.inert=!enabled;});return heading;
}
