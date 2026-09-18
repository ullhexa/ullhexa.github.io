import { STORY_SCENES, createStoryAnimation } from './story-scenes.js?v=18';
import { reorder } from './presentation-state.js?v=18';
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};

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

export function createDirector({catalog,mapId,getProject,setProject,prepareMap,announce}){
  const menuButton=el('button','Storytelling','map-picker');menuButton.id='open-stories';menuButton.setAttribute('aria-haspopup','dialog');menuButton.setAttribute('aria-controls','story-dialog');
  menuButton.append(el('span','⌄'));$('open-maps').after(menuButton);
  const modes=el('div',null,'presentation-modes');modes.id='presentation-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Player display mode');
  for(const [id,label] of [['battle','Battle map'],['story','Storytelling']]){
    const button=el('button',label);button.id=`show-${id}`;button.type='button';button.addEventListener('click',()=>{setProject({...getProject(),mode:id});announce(id==='story'?'Storytelling is on the player display. Prepare the next map below.':'Your prepared battle map is on the player display.');});modes.append(button);
  }
  document.querySelector('.site-identity').after(modes);
  const quick=el('div',null,'quick-selections');quick.setAttribute('aria-label','Prepared scenes');
  const mapSelect=el('select'),storySelect=el('select');mapSelect.id='quick-maps';storySelect.id='quick-stories';
  mapSelect.setAttribute('aria-label','Prepared maps');storySelect.setAttribute('aria-label','Prepared storytelling');
  quick.append(mapSelect,storySelect);document.querySelector('.lighting-control').after(quick);
  const status=el('span',null,'presentation-status');status.id='presentation-status';document.querySelector('.map-topline>div').append(status);
  const dialog=el('dialog');dialog.id='story-dialog';dialog.setAttribute('aria-labelledby','story-menu-title');
  dialog.innerHTML='<div class="map-menu-heading"><div><p class="eyebrow">STORYTELLING LIBRARY</p><h2 id="story-menu-title">Set the atmosphere</h2></div><button id="close-stories" class="quiet" aria-label="Close storytelling menu">×</button></div><div class="story-menu-layout"><div id="story-grid" class="story-grid" role="group" aria-label="Available atmospheres"></div><section class="story-details" aria-label="Selected atmosphere"><canvas id="story-preview" aria-label="Atmosphere preview"></canvas><h3 id="story-title"></h3><p id="story-description"></p><button id="add-story">Add to session</button></section></div><section class="session-sequence"><h3>In this session</h3><p>Keep a short list for the Storytelling dropdown. Arrange it in story order.</p><div id="story-sequence"></div></section><div class="dialog-actions"><button id="cancel-story">Keep playing</button><button id="apply-story" class="primary">Use atmosphere</button></div>';
  document.body.append(dialog);
  let selected=getProject().vibe;
  const animation=createStoryAnimation($('story-preview'));
  const select=id=>{selected=id;const scene=STORY_SCENES.find(scene=>scene.id===id);$('story-title').textContent=scene.title;$('story-description').textContent=scene.description;animation.set(id);for(const button of $('story-grid').children)button.setAttribute('aria-pressed',button.dataset.scene===id);render();};
  for(const scene of STORY_SCENES){
    const button=el('button',null,'story-card');button.type='button';button.dataset.scene=scene.id;
    const swatch=el('span',null,'story-swatch');swatch.style.background=`radial-gradient(ellipse at 70% 25%,${scene.colors[2]}80,transparent 55%),radial-gradient(ellipse at 20% 70%,${scene.colors[1]},${scene.colors[0]})`;
    button.append(swatch,el('span',scene.title));button.addEventListener('click',()=>select(scene.id));$('story-grid').append(button);
  }
  const close=()=>dialog.close();$('close-stories').addEventListener('click',close);$('cancel-story').addEventListener('click',close);dialog.addEventListener('close',()=>animation.stop());
  menuButton.addEventListener('click',()=>{dialog.showModal();select(getProject().vibe);animation.start();});
  $('add-story').addEventListener('click',()=>{const project=getProject();if(!project.stories.includes(selected))setProject({...project,stories:[...project.stories,selected]});render();});
  $('apply-story').addEventListener('click',()=>{const project=getProject();setProject({...project,vibe:selected,stories:project.stories.includes(selected)?project.stories:[...project.stories,selected]});close();announce(project.mode==='story'?'Storytelling atmosphere changed.':'Atmosphere ready. Press Storytelling to show it.');});
  mapSelect.addEventListener('change',async()=>{const id=mapSelect.value;mapSelect.value='';mapSelect.disabled=true;try{await prepareMap(id);}catch(error){announce(error.message);}finally{mapSelect.disabled=false;}});
  storySelect.addEventListener('change',()=>{const vibe=storySelect.value;storySelect.value='';setProject({...getProject(),vibe});announce(getProject().mode==='story'?'Storytelling atmosphere changed.':'Atmosphere ready. Press Storytelling to show it.');});
  function options(select,label,ids,library){select.replaceChildren();const placeholder=el('option',label);placeholder.value='';placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);ids.forEach((id,index)=>{const option=el('option',`${index+1}. ${library.find(item=>item.id===id)?.title||id}`);option.value=id;select.append(option);});}
  function render(){
    const project=getProject();$('show-battle').setAttribute('aria-pressed',project.mode==='battle');$('show-story').setAttribute('aria-pressed',project.mode==='story');
    options(mapSelect,'Maps',project.maps,catalog);options(storySelect,'Storytelling',project.stories,STORY_SCENES);
    const vibe=STORY_SCENES.find(scene=>scene.id===project.vibe);status.textContent=project.mode==='story'?`Players: ${vibe.title} · Map is private`:'Players: battle map';status.classList.toggle('is-story',project.mode==='story');
    mapSelect.title=`Prepare a map · Current: ${catalog.find(entry=>entry.id===mapId)?.title}`;storySelect.title=`Atmosphere: ${vibe.title}`;
    $('add-story').disabled=project.stories.includes(selected);$('add-story').textContent=project.stories.includes(selected)?'Added to session':'Add to session';
    renderSequence($('story-sequence'),project.stories,STORY_SCENES,stories=>{setProject({...getProject(),stories,vibe:stories.includes(getProject().vibe)?getProject().vibe:stories[0]});render();});
  }
  render();return {render};
}
