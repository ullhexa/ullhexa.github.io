import {editCustomMap} from './custom-maps.js?v=35';
import {registerMenu,openMenu,closeMenu} from './main-menu.js?v=35';
import {assetId} from './combat-state.js?v=35';
import {assetURL} from './local-assets.js?v=35';
import {createSceneGroups} from './scene-groups-ui.js?v=35';
const $ = id => document.getElementById(id);

export function createMapMenu({catalog,activeId,activeMap,loadMap,getEnvironment,applyMap,getProject,setProject,deleteMap,editMap}) {
  const formatSize=value=>new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(value);
  const dialog=$('map-dialog'),cache=new Map([[activeId,activeMap]]),buttons=new Map();
  let selected=null,request=0,environment=null,source='factory',upload=null;
  const textNode=(tag,text,className)=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};
  const sourceBar=textNode('div','','source-tabs'),factory=textNode('button','Factory'),user=textNode('button','User'),create=textNode('button','Upload map','map-card create-token');
  factory.type=user.type=create.type='button';sourceBar.append(factory,user);dialog.querySelector('.map-menu-heading').after(sourceBar);$('map-grid-menu').append(create);create.addEventListener('click',()=>upload?.());
  function filter(){dialog.dataset.source=source;factory.setAttribute('aria-pressed',source==='factory');user.setAttribute('aria-pressed',source==='user');create.hidden=source!=='user';for(const [id,button]of buttons)button.hidden=!!catalog.find(e=>e.id===id)?.map?.userMap!==(source==='user');}
  function changeSource(value){source=value;filter();request++;selected=null;environment=null;$('apply-map').disabled=true;$('map-details').replaceChildren();}
  factory.addEventListener('click',()=>changeSource('factory'));user.addEventListener('click',()=>changeSource('user'));
  const groups=createSceneGroups({kind:'maps',panel:dialog,content:dialog.querySelector('.map-menu-layout'),getProject,setProject,catalog,onChange:()=>updateAdd()});
  function renderPlan(){groups.renderSequence();}
  function updateAdd(){const button=$('add-map-session');if(button){button.disabled=!groups.selected()||groups.entries().includes(selected);button.textContent=groups.entries().includes(selected)?'Added to session':'Add to session';}}

  function environmentControls(map){
    environment={...getEnvironment(map)};
    const section=document.createElement('section');section.className='map-environment';section.setAttribute('aria-label','Map environment');
    section.append(textNode('h4','Environment'));
    const label=document.createElement('label');label.className='lighting-label';label.htmlFor='map-light-level';
    const output=document.createElement('output');output.htmlFor='map-light-level';
    label.append(textNode('span','Light ↔ Dark'),output);
    const slider=document.createElement('input');slider.id='map-light-level';slider.type='range';slider.min='0';slider.max='95';slider.step='1';slider.value=environment.darkness;slider.setAttribute('aria-label','Light to dark');
    const update=()=>{output.value=`${environment.darkness}%`;slider.setAttribute('aria-valuetext',`${environment.darkness}% darkness`);};
    slider.addEventListener('input',()=>{environment.darkness=Number(slider.value);update();});
    section.append(label,slider,textNode('p',map.userMap?'Darken the image gradually. Apply below to use this setting.':'Darken the map gradually. Fires, candles, and windows keep their light. Apply below to use this setting.','environment-hint'));
    update();return section;
  }

  async function select(entry) {
    selected=entry.id;const current=++request;
    for(const [id,button] of buttons)button.setAttribute('aria-pressed',id===selected);
    $('apply-map').disabled=true;
    $('map-details').replaceChildren(textNode('p','Loading map details…','map-menu-hint'));
    try {
      const map=cache.get(entry.id)||await loadMap(entry);
      cache.set(entry.id,map);
      if(current!==request)return;
      const details=$('map-details');details.replaceChildren(textNode('p',entry.category,'eyebrow'),textNode('h3',map.title));
      const stats=document.createElement('dl');stats.className='map-stats';
      for(const [label,value] of [['Interactive elements',map.interactions.length],['Places',map.places.length],['Grid square',`${map.grid.distance} ${map.grid.unit}`]]) {
        const stat=document.createElement('div');stat.append(textNode('dt',label),textNode('dd',value));stats.append(stat);
      }
      details.append(stats,textNode('p',`${formatSize(map.width / map.grid.size * map.grid.distance)} × ${formatSize(map.height / map.grid.size * map.grid.distance)} ${map.grid.unit} · ${formatSize(map.width / map.grid.size)} × ${formatSize(map.height / map.grid.size)} squares`,'map-menu-hint'));
      const features=document.createElement('ul');features.className='map-features';
      for(const [type,singular,plural] of [['roof','removable roof','removable roofs'],['marker','doorway','doorways'],['terrain','prepared map variation','prepared map variations']]) {
        const count=map.interactions.filter(item=>item.type===type).length;
        if(count)features.append(textNode('li',`${count} ${count===1?singular:plural}`));
      }
      details.append(features,environmentControls(map));
      const add=textNode('button','Add to session');add.id='add-map-session';add.type='button';add.addEventListener('click',()=>{groups.update([...groups.entries(),entry.id]);renderPlan();updateAdd();});const actions=textNode('div','','asset-actions');actions.append(add);if(map.userMap){const edit=textNode('button','Edit');edit.type='button';edit.addEventListener('click',async()=>{edit.disabled=true;try{const next=await editCustomMap(entry);if(!next)return;await editMap(next);cache.delete(entry.id);buttons.get(entry.id)?.remove();buttons.delete(entry.id);addEntry(next);filter();await select(next);}catch(e){details.append(textNode('p',e.message,'save-error'));}finally{edit.disabled=false;}});actions.append(edit);const remove=textNode('button','Delete','danger');remove.type='button';remove.addEventListener('click',async()=>{remove.disabled=true;try{await deleteMap(entry.id);buttons.get(entry.id)?.remove();buttons.delete(entry.id);cache.delete(entry.id);changeSource('user');groups.render();renderPlan();}catch(e){remove.disabled=false;details.append(textNode('p',e.message,'save-error'));}});actions.append(remove);}details.append(actions);updateAdd();
      if(entry.id===activeId)details.append(textNode('p','Currently in play. Your encounter progress will be kept.','map-menu-hint'));
      $('apply-map').disabled=false;
    } catch {
      if(current===request)$('map-details').replaceChildren(textNode('p','This map could not load. Select it again to retry.','map-menu-hint'));
    }
  }

  function addEntry(entry) {
    if(buttons.has(entry.id))return;
    const button=document.createElement('button');button.type='button';button.className='map-card';button.setAttribute('aria-pressed','false');
    const image=document.createElement('img');if(assetId(entry.thumbnail))assetURL(entry.thumbnail).then(url=>image.src=url);else image.src=entry.thumbnail;image.alt='';image.width=300;image.height=200;image.loading='lazy';
    button.append(image,textNode('span',entry.title,'map-card-title'),textNode('span',entry.id===activeId?'Currently in play':entry.category,'map-card-caption'));
    button.addEventListener('click',()=>select(entry));buttons.set(entry.id,button);$('map-grid-menu').append(button);renderPlan();
  }
  catalog.forEach(addEntry);filter();
  registerMenu('maps',dialog,{onShow:fresh=>{groups.render(fresh);if(!fresh){renderPlan();return;}
    source='factory';filter();request++;selected=null;environment=null;for(const button of buttons.values())button.setAttribute('aria-pressed','false');
    $('map-details').replaceChildren(textNode('p','Select a map to see its details.','map-menu-hint'));$('apply-map').disabled=true;renderPlan();
  }});
  $('open-maps').addEventListener('click',()=>openMenu('maps'));
  for(const id of ['close-maps'])$(id).addEventListener('click',()=>closeMenu());
  $('apply-map').addEventListener('click',()=>{if(selected&&environment&&!$('apply-map').disabled){if(groups.selected()){if(!groups.entries().includes(selected))groups.update([...groups.entries(),selected]);groups.activate();}closeMenu();applyMap(cache.get(selected),{...environment});}});
  return {addEntry,setUpload:fn=>upload=fn,showEntry:entry=>{source='user';filter();select(entry);}};
}
