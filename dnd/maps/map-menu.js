const $ = id => document.getElementById(id);

export function createMapMenu({catalog,activeId,activeMap,loadMap,applyMap}) {
  const dialog=$('map-dialog'),cache=new Map([[activeId,activeMap]]),buttons=new Map();
  let selected=null,request=0;
  const textNode=(tag,text,className)=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};

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
      details.append(features);
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
    request++;selected=null;for(const button of buttons.values())button.setAttribute('aria-pressed','false');
    $('map-details').replaceChildren(textNode('p','Select a map to see its details.','map-menu-hint'));$('apply-map').disabled=true;dialog.showModal();
  });
  for(const id of ['close-maps','cancel-map'])$(id).addEventListener('click',()=>dialog.close());
  $('apply-map').addEventListener('click',()=>{if(selected&&!$('apply-map').disabled){dialog.close();applyMap(selected);}});
}
