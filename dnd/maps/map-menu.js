const $ = id => document.getElementById(id);

export function createMapMenu({catalog,activeId,activeMap,loadMap,getEnvironment,applyMap}) {
  const dialog=$('map-dialog'),cache=new Map([[activeId,activeMap]]),buttons=new Map();
  let selected=null,request=0,environment=null;
  const textNode=(tag,text,className)=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};

  function environmentControls(map){
    environment={...getEnvironment(map)};
    const section=document.createElement('section');section.className='map-environment';section.setAttribute('aria-label','Map environment');
    section.append(textNode('h4','Environment'));
    const modes=document.createElement('div');modes.className='environment-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Time of day');
    const choices=[];
    const label=document.createElement('label');label.className='night-darkness-label';label.htmlFor='night-darkness-control';
    const output=document.createElement('output');output.htmlFor='night-darkness-control';
    label.append(textNode('span','Night darkness'),output);
    const slider=document.createElement('input');slider.id='night-darkness-control';slider.type='range';slider.min='40';slider.max='95';slider.step='1';slider.value=environment.darkness;
    const update=()=>{
      for(const [mode,button] of choices)button.setAttribute('aria-pressed',mode===environment.timeOfDay);
      slider.disabled=environment.timeOfDay!=='night';label.classList.toggle('inactive',slider.disabled);
      output.value=`${environment.darkness}%`;slider.setAttribute('aria-valuetext',`${environment.darkness}% darkness`);
    };
    for(const [mode,symbol,title] of [['day','☀','Day'],['night','☾','Night']]){
      const button=document.createElement('button');button.type='button';
      const icon=textNode('span',symbol);icon.setAttribute('aria-hidden','true');button.append(icon,document.createTextNode(title));
      button.addEventListener('click',()=>{environment.timeOfDay=mode;update();});modes.append(button);choices.push([mode,button]);
    }
    slider.addEventListener('input',()=>{environment.darkness=Number(slider.value);update();});
    section.append(modes,label,slider,textNode('p','Night keeps the ground dark and the fires, candles, and windows warm. Apply below to use these settings.','environment-hint'));
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
      details.append(stats);
      const features=document.createElement('ul');features.className='map-features';
      for(const [type,singular,plural] of [['roof','removable roof','removable roofs'],['marker','discovery','discoveries'],['fog','concealed area','concealed areas'],['terrain','terrain change','terrain changes']]) {
        const count=map.interactions.filter(item=>item.type===type).length;
        if(count)features.append(textNode('li',`${count} ${count===1?singular:plural}`));
      }
      details.append(features,environmentControls(map));
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
    $('map-details').replaceChildren(textNode('p','Select a map to see its details.','map-menu-hint'));$('apply-map').disabled=true;dialog.showModal();
  });
  for(const id of ['close-maps','cancel-map'])$(id).addEventListener('click',()=>dialog.close());
  $('apply-map').addEventListener('click',()=>{if(selected&&environment&&!$('apply-map').disabled){dialog.close();applyMap(cache.get(selected),{...environment});}});
}
