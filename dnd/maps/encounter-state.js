export const PORTRAITS = ['Human warrior','Silver-haired elf','Dwarven adventurer','Halfling ranger','Half-orc guardian','Human wizard','Tiefling wanderer','Elven mage','Dragonborn',
  'Copper-haired elf','Human paladin','Dwarven shieldmaiden','Halfling bard','Half-orc veteran','Violet tiefling','Blue dragonborn','Gnome tinkerer',
  'Human cleric','Human monk','Elven scholar','Feline ranger','Lizardfolk druid','Veteran knight','Human rogue','Dwarven cleric'];
export const PORTRAIT_ASSETS = ['./assets/portraits.png','./assets/portraits-additional.png'];
export function portraitAsset(index) {
  const original=index<9,columns=original?3:4,cell=original?index:index-9;
  return {url:PORTRAIT_ASSETS[original?0:1],columns,column:cell%columns,row:Math.floor(cell/columns)};
}
export const SHAPE_TYPES = ['circle','square','triangle'];
export const SHAPE_COLORS = ['#e8ba71','#ec6d62','#70bce8','#a98ce5','#78cba2','#ef91be'];
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const boundedPoint = p => Array.isArray(p) && p.length === 2 && p.every(n=>Number.isFinite(n)&&n>=0&&n<=1);
export const feetToWorld = (map,n) => n/map.grid.distance*map.grid.size;
export const worldToFeet = (map,n) => n/map.grid.size*map.grid.distance;

// Nearest grid centers form a compact, non-overlapping group even beside a map edge.
export function formation(map, anchor, count) {
  const cols=Math.floor(map.width/map.grid.size), rows=Math.floor(map.height/map.grid.size);
  const cx=clamp(Math.floor(anchor[0]*map.width/map.grid.size),0,cols-1), cy=clamp(Math.floor(anchor[1]*map.height/map.grid.size),0,rows-1);
  const cells=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if((x-cx)%2===0&&(y-cy)%2===0)cells.push({x,y,d:(x-cx)**2+(y-cy)**2});
  cells.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);
  return cells.slice(0,count).map(({x,y})=>[(x+.5)*map.grid.size/map.width,(y+.5)*map.grid.size/map.height]);
}
export function defaultRoster(map, anchor=map.partyStart) {
  return formation(map,anchor,4).map((position,index)=>({id:`player-${index+1}`,name:`Player ${index+1}`,portrait:index,position}));
}
export function normalizeEncounter(map,input,party) {
  const used=new Set();
  const roster=Array.isArray(input.roster)?input.roster.slice(0,12).filter(p=>p&&typeof p.id==='string'&&/^[-a-zA-Z0-9]+$/.test(p.id)&&!used.has(p.id)&&used.add(p.id)).map((p,i)=>({id:p.id,name:typeof p.name==='string'?p.name.trim().slice(0,32)||`Player ${i+1}`:`Player ${i+1}`,portrait:Number.isInteger(p.portrait)?clamp(p.portrait,0,PORTRAITS.length-1):i%PORTRAITS.length,position:boundedPoint(p.position)?[...p.position]:formation(map,party,12)[i]})):[];
  const shapeIds=new Set();
  const shapes=Array.isArray(input.shapes)?input.shapes.slice(0,32).filter(s=>s&&typeof s.id==='string'&&/^[-a-zA-Z0-9]+$/.test(s.id)&&!shapeIds.has(s.id)&&shapeIds.add(s.id)&&SHAPE_TYPES.includes(s.type)&&boundedPoint(s.center)&&[s.width,s.height,s.rotation].every(Number.isFinite)).map(s=>({id:s.id,type:s.type,center:[...s.center],width:clamp(Math.round(s.width),1,200),height:clamp(Math.round(s.height),1,200),rotation:((s.rotation%360)+360)%360,color:SHAPE_COLORS.includes(s.color)?s.color:SHAPE_COLORS[0],visible:s.visible===true})):[];
  return {roster:roster.length?roster:defaultRoster(map,party),tokenMode:input.tokenMode==='players'?'players':'party',shapes};
}
export function setTokenMode(map,state,mode) {
  if(!['party','players'].includes(mode))throw new Error('Unknown party mode.');
  if(mode===state.tokenMode)return state;
  if(mode==='players'){
    const points=formation(map,state.party,state.roster.length);
    return {...state,tokenMode:mode,roster:state.roster.map((p,i)=>({...p,position:points[i]}))};
  }
  const party=[0,1].map(axis=>state.roster.reduce((sum,p)=>sum+p.position[axis],0)/state.roster.length);
  return {...state,tokenMode:mode,party};
}
export function setRosterCount(map,state,count) {
  if(!Number.isInteger(count)||count<1||count>12)throw new Error('Choose 1–12 players.');
  const points=formation(map,state.party,12);
  const roster=state.roster.slice(0,count);
  for(let i=roster.length;i<count;i++){
    const position=points.find(p=>!roster.some(r=>Math.hypot((p[0]-r.position[0])*map.width,(p[1]-r.position[1])*map.height)<map.grid.size*.8))||points[i];
    let suffix=i+1;while(roster.some(p=>p.id===`player-${suffix}`))suffix++;
    roster.push({id:`player-${suffix}`,name:`Player ${i+1}`,portrait:i%PORTRAITS.length,position});
  }
  return {...state,roster};
}
export function newShape(type,center,id) {
  if(!SHAPE_TYPES.includes(type)||!boundedPoint(center))throw new Error('Invalid shape.');
  return {id,type,center:[...center],width:20,height:20,rotation:0,color:SHAPE_COLORS[0],visible:false};
}
export function shapeLocalPoint(map,shape,point) {
  const x=(point[0]-shape.center[0])*map.width,y=(point[1]-shape.center[1])*map.height;
  const angle=-shape.rotation*Math.PI/180;
  return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
}
export function resizeShape(map,shape,point,handle) {
  const [x,y]=shapeLocalPoint(map,shape,point);
  const next={...shape};
  if(handle==='width'||handle==='size')next.width=clamp(Math.round(worldToFeet(map,Math.abs(x)*2)),1,200);
  if(handle==='height'||handle==='size')next.height=clamp(Math.round(worldToFeet(map,Math.abs(y)*2)),1,200);
  return next;
}
export function rotateShape(map,shape,point) {
  const angle=Math.atan2((point[1]-shape.center[1])*map.height,(point[0]-shape.center[0])*map.width)*180/Math.PI+90;
  return {...shape,rotation:(Math.round(angle/5)*5+360)%360};
}
export function playerProjection(state) {
  return {...state,shapes:state.shapes.filter(s=>s.visible)};
}
