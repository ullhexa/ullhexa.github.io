import {createSceneGroups} from './scene-groups-ui.js?v=25';
import {registerMenu,openMenu,closeMenu} from './main-menu.js?v=25';
import { STORY_SCENES, createStoryAnimation } from './story-scenes.js?v=25';
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};

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
  const dialog=el('section');dialog.id='story-dialog';dialog.setAttribute('aria-labelledby','story-menu-title');
  dialog.innerHTML='<div class="map-menu-heading"><div><p class="eyebrow">STORYTELLING LIBRARY</p><h2 id="story-menu-title">Set the atmosphere</h2></div><button id="close-stories" class="quiet" aria-label="Close storytelling menu">×</button></div><div class="story-menu-layout"><div id="story-grid" class="story-grid" role="group" aria-label="Available atmospheres"></div><section class="story-details" aria-label="Selected atmosphere"><canvas id="story-preview" aria-label="Atmosphere preview"></canvas><h3 id="story-title"></h3><p id="story-description"></p><button id="add-story">Add to session</button></section></div><div class="dialog-actions"><button id="apply-story" class="primary">Use atmosphere</button></div>';
  document.body.append(dialog);
  const groups=createSceneGroups({kind:'stories',panel:dialog,content:dialog.querySelector('.story-menu-layout'),getProject,setProject,catalog:STORY_SCENES,onChange:()=>render()});
  let selected=getProject().vibe;
  const animation=createStoryAnimation($('story-preview'));
  const select=id=>{selected=id;const scene=STORY_SCENES.find(scene=>scene.id===id);$('story-title').textContent=scene.title;$('story-description').textContent=scene.description;animation.set(id);for(const button of $('story-grid').children)button.setAttribute('aria-pressed',button.dataset.scene===id);render();};
  for(const scene of STORY_SCENES){
    const button=el('button',null,'story-card');button.type='button';button.dataset.scene=scene.id;
    const swatch=el('span',null,'story-swatch');swatch.style.background=`radial-gradient(ellipse at 70% 25%,${scene.colors[2]}80,transparent 55%),radial-gradient(ellipse at 20% 70%,${scene.colors[1]},${scene.colors[0]})`;
    button.append(swatch,el('span',scene.title));button.addEventListener('click',()=>select(scene.id));$('story-grid').append(button);
  }
  const close=closeMenu;$('close-stories').addEventListener('click',close);registerMenu('story',dialog,{onShow:fresh=>{groups.render(fresh);if(fresh)select(getProject().vibe);else render();animation.start();},onHide:()=>animation.stop()});
  menuButton.addEventListener('click',()=>openMenu('story'));
  $('add-story').addEventListener('click',()=>{if(!groups.entries().includes(selected))groups.update([...groups.entries(),selected]);render();});
  $('apply-story').addEventListener('click',()=>{if(!groups.entries().includes(selected))groups.update([...groups.entries(),selected]);groups.activate();const project=getProject();setProject({...project,vibe:selected,stories:project.stories.includes(selected)?project.stories:[...project.stories,selected]});close();announce(project.mode==='story'?'Storytelling atmosphere changed.':'Atmosphere ready. Press Storytelling to show it.');});
  mapSelect.addEventListener('change',async()=>{const id=mapSelect.value;mapSelect.value='';mapSelect.disabled=true;try{await prepareMap(id);}catch(error){announce(error.message);}finally{mapSelect.disabled=false;}});
  storySelect.addEventListener('change',()=>{const vibe=storySelect.value;storySelect.value='';setProject({...getProject(),vibe});announce(getProject().mode==='story'?'Storytelling atmosphere changed.':'Atmosphere ready. Press Storytelling to show it.');});
  function options(select,label,ids,library){select.replaceChildren();const placeholder=el('option',label);placeholder.value='';placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);ids.forEach((id,index)=>{const option=el('option',`${index+1}. ${library.find(item=>item.id===id)?.title||id}`);option.value=id;select.append(option);});}
  function render(){
    const project=getProject();$('show-battle').setAttribute('aria-pressed',project.mode==='battle');$('show-story').setAttribute('aria-pressed',project.mode==='story');
    options(mapSelect,'Maps',project.maps,catalog);options(storySelect,'Storytelling',project.stories,STORY_SCENES);
    const vibe=STORY_SCENES.find(scene=>scene.id===project.vibe);status.textContent=project.mode==='story'?`Players: ${vibe.title} · Map is private`:'Players: battle map';status.classList.toggle('is-story',project.mode==='story');
    mapSelect.title=`Prepare a map · Current: ${catalog.find(entry=>entry.id===mapId)?.title}`;storySelect.title=`Atmosphere: ${vibe.title}`;
    $('add-story').disabled=!groups.selected()||groups.entries().includes(selected);$('add-story').textContent=groups.entries().includes(selected)?'Added to session':'Add to session';
    groups.renderSequence();
  }
  render();return {render};
}
