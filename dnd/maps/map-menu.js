import { renderSequence } from './director.js?v=14';
const $ = id => document.getElementById(id);

export function createMapMenu({catalog,activeId,activeMap,loadMap,getEnvironment,applyMap,getProject,setProject}) {
  const formatSize=value=>new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(value);
  const dialog=$('map-dialog'),cache=new Map([[activeId,activeMap]]),buttons=new Map();
  let selected=null,request=0,environment=null;
  const textNode=(tag,text,className)=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};
  const sequence=document.createElement('section');sequence.className='session-sequence';
  sequence.append(textNode('h3','In this session'),textNode('p','Add maps, then arrange the sequence for the Maps dropdown. The current map stays in the list.'));
  const sequenceList=document.createElement('div');sequenceList.id='map-sequence';sequence.append(sequenceList);dialog.querySelector('.dialog-actions').before(sequence);
  function renderPlan(){renderSequence(sequenceList,getProject().maps,catalog,maps=>{setProject({...getProject(),maps});renderPlan();updateAdd();},{locked:activeId});}
  function updateAdd(){const button=$('add-map-session');if(button){button.disabled=getProject().maps.includes(selected);button.textContent=button.disabled?'Added to session':'Add to session';}}

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
    section.append(label,slider,textNode('p','Darken the map gradually. Fires, candles, and windows keep their light. Apply below to use this setting.','environment-hint'));
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
      const details=$('map-details');details.replaceChildren(textNode('p',entry.category,'eyebrow'),textNode('h3',map.title),textNode('p',entry.description,'map-description'));
      const stats=document.createElement('dl');stats.className='map-stats';
      for(const [label,value] of [['Interactive elements',map.interactions.length],['Places',map.places.length],['Grid square',`${map.grid.distance} ${map.grid.unit}`]]) {
        const stat=document.createElement('div');stat.append(textNode('dt',label),textNode('dd',value));stats.append(stat);
      }
      details.append(stats,textNode('p',`${formatSize(map.width / map.grid.size * map.grid.distance)} × ${formatSize(map.height / map.grid.size * map.grid.distance)} ${map.grid.unit} · ${formatSize(map.width / map.grid.size)} × ${formatSize(map.height / map.grid.size)} squares`,'map-menu-hint'));
      const features=document.createElement('ul');features.className='map-features';
      for(const [type,singular,plural] of [['roof','removable roof','removable roofs'],['marker','discovery','discoveries'],['fog','concealed area','concealed areas'],['terrain','terrain change','terrain changes']]) {
        const count=map.interactions.filter(item=>item.type===type).length;
        if(count)features.append(textNode('li',`${count} ${count===1?singular:plural}`));
      }
      details.append(features,environmentControls(map));
      const add=textNode('button','Add to session');add.id='add-map-session';add.type='button';add.addEventListener('click',()=>{setProject({...getProject(),maps:[...getProject().maps,entry.id]});renderPlan();updateAdd();});details.append(add);updateAdd();
      if(entry.id===activeId)details.append(textNode('p','Currently in play. Your encounter progress will be kept.','map-menu-hint'));
      $('apply-map').disabled=false;
    } catch {
      if(current===request)$('map-details').replaceChildren(textNode('p','This map could not load. Select it again to retry.','map-menu-hint'));
    }
  }

  for(const entry of catalog) {
    const button=document.createElement('button');button.type='button';button.className='map-card';button.setAttribute('aria-pressed','false');
    const image=document.createElement('img');image.src=entry.thumbnail;image.alt='';image.width=300;image.height=200;image.loading='lazy';
    button.append(image,textNode('span',entry.title,'map-card-title'),textNode('span',entry.id===activeId?'Currently in play':entry.category,'map-card-caption'));
    button.addEventListener('click',()=>select(entry));buttons.set(entry.id,button);$('map-grid-menu').append(button);
  }
  $('open-maps').addEventListener('click',()=>{
    request++;selected=null;environment=null;for(const button of buttons.values())button.setAttribute('aria-pressed','false');
    $('map-details').replaceChildren(textNode('p','Select a map to see its details.','map-menu-hint'));$('apply-map').disabled=true;renderPlan();dialog.showModal();
  });
  for(const id of ['close-maps','cancel-map'])$(id).addEventListener('click',()=>dialog.close());
  $('apply-map').addEventListener('click',()=>{if(selected&&environment&&!$('apply-map').disabled){dialog.close();applyMap(cache.get(selected),{...environment});}});
}
