import {createSceneGroups} from './scene-groups-ui.js?v=29';
import {registerMenu,openMenu,closeMenu} from './main-menu.js?v=29';
import {storyCatalog} from './story-assets.js?v=29';
import {createStoryPlayer} from './story-player.js?v=29';
import {uploadImage,assetURL} from './local-assets.js?v=29';
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};

export function createDirector({catalog,mapId,getProject,setProject,prepareMap,announce}){
  const menuButton=el('button','Story','map-picker');menuButton.id='open-stories';menuButton.setAttribute('aria-haspopup','dialog');menuButton.setAttribute('aria-controls','story-dialog');
  menuButton.append(el('span','⌄'));$('open-maps').after(menuButton);
  const modes=el('div',null,'presentation-modes');modes.id='presentation-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Player display mode');
  for(const [id,label] of [['battle','Battle map'],['story','Story']]){
    const button=el('button',label);button.id=`show-${id}`;button.type='button';button.addEventListener('click',()=>{setProject({...getProject(),mode:id});announce(id==='story'?'Story is on the player display. Prepare the next map below.':'Your prepared battle map is on the player display.');});modes.append(button);
  }
  document.querySelector('.site-identity').after(modes);
  const quick=el('div',null,'quick-selections');quick.setAttribute('aria-label','Prepared scenes');
  const mapSelect=el('select'),storySelect=el('select');mapSelect.id='quick-maps';storySelect.id='quick-stories';
  mapSelect.setAttribute('aria-label','Prepared maps');storySelect.setAttribute('aria-label','Prepared stories');
  quick.append(mapSelect,storySelect);document.querySelector('.lighting-control').after(quick);
  const status=el('span',null,'presentation-status');status.id='presentation-status';document.querySelector('.map-topline>div').append(status);
  const dialog=el('section');dialog.id='story-dialog';dialog.setAttribute('aria-labelledby','story-menu-title');
  dialog.innerHTML='<div class="map-menu-heading"><div><p class="eyebrow">STORY LIBRARY</p><h2 id="story-menu-title">Choose a scene</h2></div><button id="close-stories" class="quiet" aria-label="Close story menu">×</button></div><div class="story-menu-layout"><div id="story-grid" class="story-grid" role="group" aria-label="Available story scenes"></div><section class="story-details" aria-label="Selected story scene"><div id="story-preview" class="story-preview" aria-label="Story preview"></div><h3 id="story-title"></h3><p id="story-description"></p><button id="add-story">Add to session</button></section></div><div class="dialog-actions"><button id="apply-story" class="primary">Use scene</button></div>';
  document.body.append(dialog);
  const library=storyCatalog(getProject());
  const source=el('div',null,'source-tabs'),factory=el('button','Factory'),user=el('button','User'),upload=el('input'),uploadButton=el('button','Upload image','story-card create-token'),error=el('p','','save-error');error.setAttribute('role','alert');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.hidden=true;upload.setAttribute('aria-label','Upload story image');uploadButton.type='button';uploadButton.addEventListener('click',()=>{upload.value='';upload.click();});source.append(factory,user,upload);dialog.querySelector('.map-menu-heading').after(source,error);
  const groups=createSceneGroups({kind:'stories',panel:dialog,content:dialog.querySelector('.story-menu-layout'),getProject,setProject,catalog:library,onChange:()=>render()});
  let selected=getProject().vibe,librarySource='factory';
  const remove=el('button','Delete','danger'),actions=el('div',null,'asset-actions');remove.type='button';$('add-story').before(actions);actions.append($('add-story'),remove);
  function filter(){factory.setAttribute('aria-pressed',librarySource==='factory');user.setAttribute('aria-pressed',librarySource==='user');uploadButton.hidden=librarySource!=='user';for(const card of $('story-grid').querySelectorAll('[data-scene]'))card.hidden=!!library.find(s=>s.id===card.dataset.scene)?.asset!==(librarySource==='user');}
  function changeSource(value){librarySource=value;filter();const scene=library.find(s=>!!s.asset===(value==='user'));if(scene)select(scene.id);else{selected=null;$('story-title').textContent='';$('story-description').textContent='';animation.stop();$('story-preview').hidden=true;render();}}
  factory.addEventListener('click',()=>changeSource('factory'));user.addEventListener('click',()=>changeSource('user'));
  remove.addEventListener('click',()=>{const project=getProject(),id=selected;if(!project.storyAssets?.some(s=>s.id===id))return;setProject({...project,storyAssets:project.storyAssets.filter(s=>s.id!==id),stories:project.stories.filter(s=>s!==id),storyGroups:project.storyGroups.map(g=>({...g,entries:g.entries.filter(s=>s!==id)}))});changeSource('user');});
  const animation=createStoryPlayer($('story-preview'),{onError:e=>{error.textContent=e.message;}});
  const select=id=>{$('story-preview').hidden=false;selected=id;const scene=library.find(scene=>scene.id===id)||library[0];selected=scene.id;$('story-title').textContent=scene.title;$('story-description').textContent=scene.description||'';animation.set(scene);for(const button of $('story-grid').children)button.setAttribute('aria-pressed',button.dataset.scene===id);render();};
  function addCard(scene){
    const button=el('button',null,'story-card');button.type='button';button.dataset.scene=scene.id;
    const swatch=el('span',null,'story-swatch');if(scene.asset){const img=el('img');img.alt='';assetURL(scene.asset).then(url=>{img.src=url;}).catch(e=>{error.textContent=e.message;});swatch.append(img);}else swatch.style.background=`radial-gradient(ellipse at 70% 25%,${scene.colors[2]}80,transparent 55%),radial-gradient(ellipse at 20% 70%,${scene.colors[1]},${scene.colors[0]})`;
    button.append(swatch,el('span',scene.title));button.addEventListener('click',()=>select(scene.id));$('story-grid').append(button);
  }
  $('story-grid').append(uploadButton);library.forEach(addCard);filter();
  upload.addEventListener('input',async()=>{const file=upload.files?.[0];if(!file)return;uploadButton.disabled=true;error.textContent='';try{if((getProject().storyAssets?.length||0)>=100)throw new Error('Up to 100 story images per game.');const asset=await uploadImage(file,'story'),scene={id:`story-${crypto.randomUUID()}`,title:file.name.replace(/\.[^.]+$/,'').slice(0,80)||'Story image',asset:asset.id};setProject({...getProject(),storyAssets:[...(getProject().storyAssets||[]),scene]});librarySource='user';select(scene.id);}catch(e){error.textContent=e.message;}finally{uploadButton.disabled=false;}});
  const close=closeMenu;$('close-stories').addEventListener('click',close);registerMenu('story',dialog,{onShow:fresh=>{groups.render(fresh);if(fresh)changeSource('factory');else render();animation.start();},onHide:()=>animation.stop()});
  menuButton.addEventListener('click',()=>openMenu('story'));
  $('add-story').addEventListener('click',()=>{if(!groups.entries().includes(selected))groups.update([...groups.entries(),selected]);render();});
  $('apply-story').addEventListener('click',()=>{if(!groups.entries().includes(selected))groups.update([...groups.entries(),selected]);groups.activate();const project=getProject();setProject({...project,vibe:selected,stories:project.stories.includes(selected)?project.stories:[...project.stories,selected]});close();announce(project.mode==='story'?'Story scene changed.':'Scene ready. Press Story to show it.');});
  mapSelect.addEventListener('change',async()=>{const id=mapSelect.value;mapSelect.value='';mapSelect.disabled=true;try{await prepareMap(id);}catch(error){announce(error.message);}finally{mapSelect.disabled=false;}});
  storySelect.addEventListener('change',()=>{const vibe=storySelect.value;storySelect.value='';setProject({...getProject(),vibe});announce(getProject().mode==='story'?'Story scene changed.':'Scene ready. Press Story to show it.');});
  function options(select,label,ids,library){select.replaceChildren();const placeholder=el('option',label);placeholder.value='';placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);ids.forEach((id,index)=>{const option=el('option',`${index+1}. ${library.find(item=>item.id===id)?.title||id}`);option.value=id;select.append(option);});}
  function render(){
    const project=getProject(),scenes=storyCatalog(project);
    if(JSON.stringify(scenes.map(s=>[s.id,s.asset]))!==JSON.stringify(library.map(s=>[s.id,s.asset]))){library.splice(0,library.length,...scenes);$('story-grid').replaceChildren(uploadButton);library.forEach(addCard);}
    $('show-battle').setAttribute('aria-pressed',project.mode==='battle');$('show-story').setAttribute('aria-pressed',project.mode==='story');
    options(mapSelect,`Map (${Math.max(0,project.maps.indexOf(mapId)+1)}/${project.maps.length})`,project.maps,catalog);options(storySelect,`Story (${Math.max(0,project.stories.indexOf(project.vibe)+1)}/${project.stories.length})`,project.stories,library);
    const vibe=library.find(scene=>scene.id===project.vibe)||library[0];status.textContent=project.mode==='story'?`Players: ${vibe.title} · Map is private`:'Players: battle map';status.classList.toggle('is-story',project.mode==='story');
    mapSelect.title=`Prepare a map · Current: ${catalog.find(entry=>entry.id===mapId)?.title}`;storySelect.title=`Story: ${vibe.title}`;
    filter();remove.hidden=!library.find(s=>s.id===selected)?.asset;$('apply-story').disabled=!selected;
    $('add-story').disabled=!selected||!groups.selected()||groups.entries().includes(selected);$('add-story').textContent=groups.entries().includes(selected)?'Added to session':'Add to session';
    groups.renderSequence();
  }
  render();return {render};
}
