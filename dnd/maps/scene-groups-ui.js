import {sceneKeys,updateSceneGroup,activateSceneGroup,deleteSceneGroup,reorder} from './presentation-state.js?v=25';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
export function renderSequence(container,items,catalog,onChange,{locked}={}){
  container.replaceChildren();
  items.forEach((id,index)=>{
    const row=el('div',null,'sequence-row');row.append(el('span',`${index+1}. ${catalog.find(item=>item.id===id)?.title||id}`));
    const actions=el('div',null,'sequence-actions');
    for(const [label,symbol,disabled,action] of [
      ['Move earlier','↑',index===0,()=>onChange(reorder(items,id,-1))],
      ['Move later','↓',index===items.length-1,()=>onChange(reorder(items,id,1))],
      ['Remove','×',id===locked||items.length===1,()=>onChange(items.filter(item=>item!==id))]
    ]){const button=el('button',symbol,'quiet');button.type='button';button.disabled=disabled;button.setAttribute('aria-label',`${label}: ${catalog.find(item=>item.id===id)?.title||id}`);button.addEventListener('click',action);actions.append(button);}
    row.append(actions);container.append(row);
  });
}


export function createSceneGroups({kind,panel,content,getProject,setProject,catalog,onChange}){
  const {key,active}=sceneKeys(kind);let selectedId=null;const frame=el('div',null,'library-layout scene-library'),sidebar=el('section',null,'library-groups'),main=el('section',null,'scene-library-content'),nameLabel=el('label','Session name','field-label'),name=el('input');name.maxLength=48;name.setAttribute('aria-label',`${kind==='maps'?'Map':'Storytelling'} session name`);nameLabel.append(name);content.before(frame);frame.append(sidebar,main);main.append(nameLabel,content);const sequence=el('section',null,'session-sequence'),sequenceList=el('div');sequence.append(el('h3','Session sequence'),sequenceList);main.append(sequence);const footer=panel.querySelector('.dialog-actions'),remove=button('Delete session',()=>{if(!selectedId)return;setProject(deleteSceneGroup(getProject(),kind,selectedId));selectedId=null;render();onChange?.();},'delete-group');remove.setAttribute('aria-label',`Delete ${kind==='maps'?'map':'storytelling'} session`);const activate=button('Activate session',()=>{api.activate();render();onChange?.();},'activate-session');footer.prepend(remove,activate);
  const group=()=>getProject()[key]?.find(g=>g.id===selectedId),entries=()=>group()?.entries||[];
  const refreshLabels=()=>{const p=getProject();for(const b of sidebar.querySelectorAll('[data-scene-group]')){const g=p[key].find(g=>g.id===b.dataset.sceneGroup);if(g)b.textContent=`${g.name}${p[active]===g.id?' · Active':''}`;}};
  name.addEventListener('input',()=>{if(!group())return;setProject(updateSceneGroup(getProject(),kind,selectedId,{name:name.value.trim().slice(0,48)||'Session'}));refreshLabels();});
  function renderSequenceList(){renderSequence(sequenceList,entries(),catalog,next=>{api.update(next);onChange?.();});}
  function render(fresh=false){const p=getProject();if(fresh||!p[key]?.some(g=>g.id===selectedId))selectedId=p[active]||p[key]?.[0]?.id||null;sidebar.replaceChildren(el('h3','Sessions'),button('+ New session',()=>{const p=getProject();if(p[key].length>=20)return;selectedId=crypto.randomUUID();setProject({...p,[key]:[...p[key],{id:selectedId,name:'Session',entries:[]}]});render();onChange?.();}));for(const g of p[key]){const b=button(`${g.name}${p[active]===g.id?' · Active':''}`,()=>{selectedId=g.id;render();onChange?.();},'library-group');b.dataset.sceneGroup=g.id;b.setAttribute('aria-pressed',selectedId===g.id);sidebar.append(b);}name.value=group()?.name||'';name.disabled=!group();remove.disabled=!group();activate.disabled=!group()||!entries().length||p[active]===selectedId;activate.textContent=p[active]===selectedId?'Active session':'Activate session';renderSequenceList();}
  const api={render,renderSequence:renderSequenceList,selected:()=>selectedId,entries,update(next){if(!group())return;setProject(updateSceneGroup(getProject(),kind,selectedId,{entries:next}));render();},activate(){if(group())setProject(activateSceneGroup(getProject(),kind,selectedId));}};render();return api;
}
