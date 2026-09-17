import { PORTRAITS, portraitAsset, SHAPE_TYPES, SHAPE_COLORS, clamp, feetToWorld, setRosterCount, setTokenMode, newShape, resizeShape, rotateShape } from './encounter-state.js?v=14';

const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const node=(tag,attrs={},text)=>{const el=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
const pretty=type=>type[0].toUpperCase()+type.slice(1);
const colorNames=['Gold','Red','Blue','Purple','Green','Pink'];

export function createEncounterTools({map,player,getState,commit,preview,finishDrag,pointAt,announce}) {
  let selectedShape=null,drag=null,portraitPlayer=null,scaleStart=null;
  const svg=$('map');
  const characterNodes=new Map(),shapeNodes=new Map(),shapeButtons=new Map(),rosterRows=new Map();
  const world=p=>[p[0]*map.width,p[1]*map.height];
  const shapeById=id=>getState().shapes.find(s=>s.id===id);
  const updateShape=(id,patch,message='')=>commit({...getState(),shapes:getState().shapes.map(s=>s.id===id?{...s,...patch}:s)},message);
  const portraitStyle=(el,index)=>{const {url,columns,column,row}=portraitAsset(index);el.style.backgroundImage=`url('${url}')`;el.style.backgroundSize=`${columns*100}% ${columns*100}%`;el.style.backgroundPosition=`${column/(columns-1)*100}% ${row/(columns-1)*100}%`;};
  function faceGraphic(index) {
    const {url,columns,column,row}=portraitAsset(index);
    const view=node('svg',{x:-22,y:-22,width:44,height:44,viewBox:`${column*100} ${row*100} 100 100`,'pointer-events':'none'});
    view.append(node('image',{href:url,width:columns*100,height:columns*100}));return view;
  }
  function footprint(s,thumbnail=false) {
    const width=thumbnail?s.width:feetToWorld(map,s.width),height=thumbnail?s.height:feetToWorld(map,s.height);
    const attrs={fill:s.color,'fill-opacity':thumbnail?.75:.27,stroke:s.color,'stroke-width':thumbnail?1.5:2,'vector-effect':'non-scaling-stroke'};
    if(s.type==='circle')return node('ellipse',{...attrs,rx:width/2,ry:height/2});
    if(s.type==='triangle')return node('polygon',{...attrs,points:`0,${-height/2} ${width/2},${height/2} ${-width/2},${height/2}`});
    return node('rect',{...attrs,x:-width/2,y:-height/2,width,height});
  }
  function renderThumbnail(button,s) {
    const size=Math.max(s.width,s.height)*1.55;
    const icon=node('svg',{viewBox:`${-size/2} ${-size/2} ${size} ${size}`,width:42,height:42,'aria-hidden':'true'});
    const g=node('g',{transform:`rotate(${s.rotation})`});g.append(footprint(s,true));icon.append(g);
    const indicator=document.createElement('span');indicator.className='visibility-dot';indicator.textContent=s.visible?'●':'○';indicator.setAttribute('aria-hidden','true');
    button.replaceChildren(icon,indicator);
    button.setAttribute('aria-label',`${pretty(s.type)}, ${colorNames[SHAPE_COLORS.indexOf(s.color)]}, ${s.width} by ${s.height} feet, ${s.visible?'visible to players':'DM only'}`);
    button.title=`${s.width} × ${s.height} ft · ${s.visible?'Visible to players':'DM only'}`;
  }
  function renderCharacters(state) {
    $('character-layer').style.display=state.tokenMode==='players'?'':'none';
    for(const[id,el]of characterNodes)if(!state.roster.some(p=>p.id===id)){el.remove();characterNodes.delete(id);}
    for(const member of state.roster){
      let el=characterNodes.get(member.id);
      if(!el){
        el=node('g',{class:'character-token','data-character':member.id,...(player?{}:{role:'button',tabindex:0})});
        characterNodes.set(member.id,el);$('character-layer').append(el);
      }
      const identity=`${member.name}:${member.portrait}`;
      if(el.dataset.identity!==identity){
        const clip=node('clipPath',{id:`face-${member.id}`});clip.append(node('circle',{r:22}));
        const face=node('g',{'clip-path':`url(#face-${member.id})`});face.append(faceGraphic(member.portrait));
        el.replaceChildren(clip,node('circle',{r:25,fill:'#162822',stroke:'#e8ba71','stroke-width':3}),face,node('text',{class:'marker-label','text-anchor':'middle',y:43,'font-size':16},member.name));el.dataset.identity=identity;
      }
      const[x,y]=world(member.position);el.setAttribute('transform',`translate(${x} ${y})`);
      if(!player)el.setAttribute('aria-label',`${member.name}. Drag to move or use arrow keys.`);
    }
  }
  function renderShapes(state) {
    for(const[id,el]of shapeNodes)if(!state.shapes.some(s=>s.id===id&&(!player||s.visible))){el.remove();shapeNodes.delete(id);}
    for(const s of state.shapes){
      if(player&&!s.visible)continue;
      let el=shapeNodes.get(s.id);
      if(!el){el=node('g',{class:'spell-shape','data-shape':s.id,...(player?{'pointer-events':'none'}:{role:'button',tabindex:0})});shapeNodes.set(s.id,el);$('shape-layer').append(el);}
      const[x,y]=world(s.center);el.setAttribute('transform',`translate(${x} ${y}) rotate(${s.rotation})`);
      const drawing=footprint(s);if(!s.visible)drawing.setAttribute('stroke-dasharray','7 5');
      el.replaceChildren(drawing);
      if(!player)el.setAttribute('aria-label',`${pretty(s.type)} area, ${s.width} by ${s.height} feet. ${s.visible?'Visible to players':'DM only'}.`);
    }
    if(player)return;
    if(shapeNodes.has(selectedShape))$('shape-layer').append(shapeNodes.get(selectedShape));
    if(!state.shapes.some(s=>s.id===selectedShape))selectedShape=null;
    const selected=shapeById(selectedShape);
    $('shape-empty').hidden=state.shapes.length>0;
    for(const[id,el]of shapeButtons)if(!state.shapes.some(s=>s.id===id)){el.remove();shapeButtons.delete(id);}
    for(const s of state.shapes){
      let button=shapeButtons.get(s.id);
      if(!button){button=document.createElement('button');button.type='button';button.className='shape-choice';button.addEventListener('click',()=>{selectedShape=s.id;scaleStart=null;$('spell-areas').open=true;render();});shapeButtons.set(s.id,button);$('shape-list').append(button);}
      renderThumbnail(button,s);button.setAttribute('aria-pressed',s.id===selectedShape);
    }
    $('shape-editor').hidden=!selected;
    if(selected){
      $('shape-visibility-label').textContent=selected.visible?'Visible to players':'DM only';
      $('shape-visible').textContent=selected.visible?'Hide from players':'Show to players';$('shape-visible').setAttribute('aria-pressed',selected.visible);
      for(const[key,field]of [['width','shape-width'],['height','shape-height'],['rotation','shape-rotation']])if(document.activeElement!==$(field))$(field).value=key==='rotation'?Math.round(selected[key]):selected[key];
      for(const button of $('shape-colors').children)button.setAttribute('aria-pressed',button.dataset.color===selected.color);
      if(!scaleStart)$('shape-size').value=Math.max(selected.width,selected.height);
    }
    renderHandles(selected);
  }
  function renderHandles(s) {
    const focusedHandle=document.activeElement?.closest('[data-handle]')?.dataset.handle;
    $('shape-handles').replaceChildren();if(!s)return;
    const[x,y]=world(s.center),w=feetToWorld(map,s.width),h=feetToWorld(map,s.height),z=getState().camera.zoom;
    const unit=1/z;
    const group=node('g',{transform:`translate(${x} ${y}) rotate(${s.rotation})`,'data-shape':s.id});
    group.append(node('rect',{x:-w/2,y:-h/2,width:w,height:h,fill:'none',stroke:'#fff3ce','stroke-width':1.5*unit,'stroke-dasharray':`${5*unit} ${4*unit}`,'pointer-events':'none'}));
    group.append(node('line',{x1:0,y1:-h/2,x2:0,y2:-h/2-36*unit,stroke:'#fff3ce','stroke-width':2*unit,'pointer-events':'none'}));
    const handles=[['width',w/2,0],['height',0,h/2],['size',w/2,h/2],['rotate',0,-h/2-36*unit]];
    for(const[type,hx,hy]of handles){
      const handle=node('g',{'data-handle':type,role:'button',tabindex:0,'aria-label':`${type==='rotate'?'Rotate':type==='size'?'Resize':type==='width'?'Adjust width of':'Adjust length of'} selected area`,class:`shape-handle ${type}`});
      handle.append(node('circle',{cx:hx,cy:hy,r:16*unit,fill:'transparent'}));
      handle.append(type==='rotate'?node('circle',{cx:hx,cy:hy,r:8*unit,fill:'#e8ba71',stroke:'#15261e','stroke-width':2*unit}):node('rect',{x:hx-7*unit,y:hy-7*unit,width:14*unit,height:14*unit,rx:2*unit,fill:'#fff3ce',stroke:'#15261e','stroke-width':2*unit}));
      group.append(handle);
    }
    $('shape-handles').append(group);
    const label=node('text',{class:'marker-label',x,y:y-(Math.hypot(w,h)/2+56*unit),'text-anchor':'middle','font-size':16*unit,'pointer-events':'none'},`${s.width} × ${s.height} ft · ${Math.round(s.rotation)}°${s.visible?'':' · DM only'}`);
    // Keep the measurement horizontal while the area rotates.
    $('shape-handles').append(label);
    if(focusedHandle)$('shape-handles').querySelector(`[data-handle="${focusedHandle}"]`)?.focus();
  }
  function renderRoster(state) {
    $('mode-party').setAttribute('aria-pressed',state.tokenMode==='party');$('mode-players').setAttribute('aria-pressed',state.tokenMode==='players');
    $('player-count').value=state.roster.length;$('roster-count-label').textContent=`${state.roster.length} player${state.roster.length===1?'':'s'}`;
    for(const[id,row]of rosterRows)if(!state.roster.some(p=>p.id===id)){row.remove();rosterRows.delete(id);}
    for(const member of state.roster){
      let row=rosterRows.get(member.id);
      if(!row){
        row=document.createElement('div');row.className='roster-row';
        const face=document.createElement('button');face.type='button';face.className='portrait-thumb';face.addEventListener('click',()=>{portraitPlayer=member.id;$('portrait-dialog').showModal();});
        const input=document.createElement('input');input.type='text';input.maxLength=32;input.autocomplete='off';input.id=`name-${member.id}`;
        input.addEventListener('input',()=>commit({...getState(),roster:getState().roster.map(p=>p.id===member.id?{...p,name:input.value.trim()||'Player'}:p)},'Character name saved.'));
        row.append(face,input);$('roster-list').append(row);rosterRows.set(member.id,row);
      }
      const[face,input]=row.children;portraitStyle(face,member.portrait);face.setAttribute('aria-label',`Choose face for ${member.name}`);face.title=PORTRAITS[member.portrait];input.setAttribute('aria-label',`Name for ${member.name}`);if(document.activeElement!==input)input.value=member.name;
    }
  }
  function render() {const state=getState();renderCharacters(state);renderShapes(state);if(!player)renderRoster(state);}
  if(!player){
    for(let count=1;count<=12;count++){const option=document.createElement('option');option.value=count;option.textContent=count;$('player-count').append(option);}
    $('player-count').addEventListener('change',event=>commit(setRosterCount(map,getState(),Number(event.target.value)),'Player count updated.'));
    for(const mode of ['party','players'])$(`mode-${mode}`).addEventListener('click',()=>{if(getState().tokenMode!==mode)commit(setTokenMode(map,getState(),mode),mode==='party'?'Party marker shown.':getState().regroupPlayers?'Players placed around the party position.':'Player positions restored.');});
    $('close-portraits').addEventListener('click',()=>$('portrait-dialog').close());
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selectedShape&&!$('portrait-dialog').open){selectedShape=null;render();}});
    PORTRAITS.forEach((description,index)=>{const button=document.createElement('button');button.type='button';button.className='portrait-option';button.setAttribute('aria-label',description);button.title=description;const face=document.createElement('span');face.className='portrait-thumb';portraitStyle(face,index);button.append(face);button.addEventListener('click',()=>{commit({...getState(),roster:getState().roster.map(p=>p.id===portraitPlayer?{...p,portrait:index}:p)},'Character face updated.');$('portrait-dialog').close();});$('portrait-options').append(button);});
    document.querySelectorAll('[data-add-shape]').forEach(button=>button.addEventListener('click',()=>{
      if(getState().shapes.length>=32){announce('Up to 32 areas can be placed on this map.');return;}
      const state=getState();const shape=newShape(button.dataset.addShape,[state.camera.x,state.camera.y],crypto.randomUUID());selectedShape=shape.id;$('spell-areas').open=true;commit({...state,shapes:[...state.shapes,shape]},'Area added. Adjust it, then choose Show to players.');
    }));
    SHAPE_COLORS.forEach((color,index)=>{const button=document.createElement('button');button.type='button';button.dataset.color=color;button.className='color-swatch';button.style.backgroundColor=color;button.setAttribute('aria-label',`${colorNames[index]} area`);button.addEventListener('click',()=>updateShape(selectedShape,{color}));$('shape-colors').append(button);});
    $('shape-visible').addEventListener('click',()=>{const s=shapeById(selectedShape);if(s)updateShape(s.id,{visible:!s.visible},s.visible?'Area hidden from players.':'Area shown to players.');});
    $('delete-shape').addEventListener('click',()=>commit({...getState(),shapes:getState().shapes.filter(s=>s.id!==selectedShape)},'Area removed. Undo restores it.'));
    for(const[key,field]of [['width','shape-width'],['height','shape-height'],['rotation','shape-rotation']])$(field).addEventListener('input',event=>{
      const s=shapeById(selectedShape);if(!s||event.target.value==='')return;const parsed=Number(event.target.value);const value=Number.isFinite(parsed)?Math.round(parsed):s[key];const bounded=key==='rotation'?(value%360+360)%360:clamp(value,1,200);event.target.value=bounded;updateShape(s.id,{[key]:bounded});
    });
    $('shape-size').addEventListener('input',event=>{
      if(!scaleStart)scaleStart={state:structuredClone(getState()),shape:structuredClone(shapeById(selectedShape))};
      if(!scaleStart.shape)return;const s=scaleStart.shape,factor=Number(event.target.value)/Math.max(s.width,s.height);
      preview({...getState(),shapes:getState().shapes.map(item=>item.id===s.id?{...item,width:clamp(Math.round(s.width*factor),1,200),height:clamp(Math.round(s.height*factor),1,200)}:item)});
    });
    $('shape-size').addEventListener('change',()=>{if(scaleStart){const start=scaleStart.state;scaleStart=null;finishDrag(start,'Area resized.');}});
    svg.addEventListener('pointerdown',event=>{
      const character=event.target.closest('[data-character]'),shape=event.target.closest('[data-shape]'),handle=event.target.closest('[data-handle]');
      if(event.button!==0||(!character&&!shape)||$('measure').getAttribute('aria-pressed')==='true')return;
      event.stopImmediatePropagation();event.preventDefault();
      const p=pointAt(event),state=getState();
      if(shape){selectedShape=shape.dataset.shape;$('spell-areas').open=true;}
      drag={pointer:event.pointerId,character:character?.dataset.character,shape:shape?.dataset.shape,handle:handle?.dataset.handle,point:p,start:structuredClone(state),x:event.clientX,y:event.clientY,moved:false};
      svg.setPointerCapture(event.pointerId);render();
    },true);
    svg.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.pointer)return;event.stopImmediatePropagation();
      if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<3)return;drag.moved=true;
      const p=pointAt(event),state=getState();
      if(drag.character){const member=drag.start.roster.find(p=>p.id===drag.character);const position=member.position.map((n,axis)=>clamp(n+p[axis]-drag.point[axis],0,1));preview({...state,roster:state.roster.map(m=>m.id===member.id?{...m,position}:m)});}
      else{const original=drag.start.shapes.find(s=>s.id===drag.shape);let next;
        if(drag.handle==='rotate')next=rotateShape(map,original,p);
        else if(drag.handle)next=resizeShape(map,original,p,drag.handle);
        else next={...original,center:original.center.map((n,axis)=>clamp(n+p[axis]-drag.point[axis],0,1))};
        preview({...state,shapes:state.shapes.map(s=>s.id===next.id?next:s)});
      }
    },true);
    svg.addEventListener('pointerup',event=>{
      if(!drag||event.pointerId!==drag.pointer)return;event.stopImmediatePropagation();const current=drag;drag=null;
      if(current.moved)finishDrag(current.start,current.character?'Player moved.':'Area adjusted.');else render();
    },true);
    svg.addEventListener('pointercancel',event=>{if(drag?.pointer===event.pointerId){event.stopImmediatePropagation();const start=drag.start;drag=null;preview(start);}},true);
    svg.addEventListener('keydown',event=>{
      const character=event.target.closest('[data-character]'),shape=event.target.closest('[data-shape]'),handle=event.target.closest('[data-handle]');
      if(!character&&!shape)return;
      const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},offset=offsets[event.key];
      if(shape&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectedShape=shape.dataset.shape;$('spell-areas').open=true;render();return;}
      if(!offset)return;event.preventDefault();event.stopPropagation();
      if(character){commit({...getState(),roster:getState().roster.map(p=>p.id===character.dataset.character?{...p,position:p.position.map((n,axis)=>clamp(n+offset[axis]*map.grid.size/(axis?map.height:map.width),0,1))}:p)},'Player moved one square.');return;}
      selectedShape=shape.dataset.shape;const s=shapeById(selectedShape);if(!s)return;
      const direction=offset[0]||-offset[1];
      if(handle){const type=handle.dataset.handle;updateShape(s.id,type==='rotate'?{rotation:(s.rotation+direction*5+360)%360}:type==='width'?{width:clamp(s.width+direction,1,200)}:type==='height'?{height:clamp(s.height+direction,1,200)}:{width:clamp(s.width+direction,1,200),height:clamp(s.height+direction,1,200)});}
      else updateShape(s.id,{center:s.center.map((n,axis)=>clamp(n+offset[axis]*map.grid.size/(axis?map.height:map.width),0,1))});
    });
  }
  return {render,isDragging:()=>!!drag,clearSelection:()=>{selectedShape=null;}};
}
