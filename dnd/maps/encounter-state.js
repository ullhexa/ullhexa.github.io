import {normalizeItems, normalizeMembers, normalizeCampaign, syncCampaign, fiveFeet, initiativeOrder} from './combat-state.js?v=25';
export const PORTRAITS = ['Human warrior','Silver-haired elf','Dwarven adventurer','Halfling ranger','Half-orc guardian','Human wizard','Tiefling wanderer','Elven mage','Dragonborn',
  'Copper-haired elf','Human paladin','Dwarven shieldmaiden','Halfling bard','Half-orc veteran','Violet tiefling','Blue dragonborn','Gnome tinkerer',
  'Human cleric','Human monk','Elven scholar','Feline ranger','Lizardfolk druid','Veteran knight','Human rogue','Dwarven cleric','Human druid','Elder sorcerer','Golden dragonborn','Gnome scout','Orc fighter'];
export const PORTRAIT_ASSETS = ['./assets/portraits.png','./assets/portraits-additional.png','./assets/portraits-extra.png','./assets/monsters.png'];
// The generated monster sheet has uneven row heights, especially its last row.
// Crop within the measured panels instead of assuming a uniform 5 × 6 atlas.
const MONSTER_COLUMNS = [0,230,459,687,916,1145];
const MONSTER_ROWS = [0,213,423,634,845,1066,1374];
export function portraitAsset(index,monster=false) {
  const sheet=monster?3:index<9?0:index<25?1:2,columns=[3,4,3,5][sheet],rows=[3,4,2,6][sheet],cell=monster?index:index-[0,9,25][sheet];
  const column=cell%columns,row=Math.floor(cell/columns),asset={url:PORTRAIT_ASSETS[sheet],columns,rows,column,row};
  if(monster){
    const x=MONSTER_COLUMNS[column],y=MONSTER_ROWS[row],w=MONSTER_COLUMNS[column+1]-x,h=MONSTER_ROWS[row+1]-y;
    const size=Math.min(w,h)-4; // Keep resampling safely inside each panel's seam.
    asset.crop=[(x+(w-size)/2)/1145,(y+(h-size)/2)/1374,size/1145,size/1374];
  }
  return asset;
}
export const SHAPE_TYPES = ['circle','square','cone'];
export const SHAPE_COLORS = ['#58a9e0','#9a6d47','#e76660','#eea348','#111111','#ffffff','#6fb980','#ad83df'];
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
  const roster=normalizeMembers(Array.isArray(input.roster)?input.roster:defaultRoster(map,party));
  const shapeIds=new Set();
  const shapes=(Array.isArray(input.shapes)?input.shapes:[]).slice(0,32).filter(s=>s&&typeof s.id==='string'&&/^[-a-zA-Z0-9]+$/.test(s.id)&&!shapeIds.has(s.id)&&shapeIds.add(s.id)&&[...SHAPE_TYPES,'triangle'].includes(s.type)&&boundedPoint(s.center)&&[s.width,s.height,s.rotation].every(Number.isFinite)).map(s=>{const type=s.type==='triangle'?'cone':s.type,size=fiveFeet(s.size??(type==='circle'?Math.max(s.width,s.height)/2:Math.max(s.width,s.height)));return {id:s.id,type,size,width:type==='circle'?size*2:size,height:type==='circle'?size*2:size,center:[...s.center],rotation:((s.rotation%360)+360)%360,color:SHAPE_COLORS.includes(s.color)?s.color:({'#e8ba71':'#eea348','#ec6d62':'#e76660','#70bce8':'#58a9e0','#a98ce5':'#58a9e0','#78cba2':'#6fb980','#ef91be':'#e76660'}[s.color]||SHAPE_COLORS[0]),visible:true};});
  return {roster,items:normalizeItems(input.items),monsters:normalizeMembers(input.monsters,true),...(input.public?{public:true}:{campaign:normalizeCampaign(input.campaign,roster)}),tokenMode:input.tokenMode==='players'?'players':'party',regroupPlayers:typeof input.regroupPlayers==='boolean'?input.regroupPlayers:input.tokenMode!=='players',shapes};
}

export function moveParty(state,position) {
  if(position.every((n,axis)=>n===state.party[axis]))return state;
  return {...state,party:[...position],regroupPlayers:true};
}
export function setTokenMode(map,state,mode) {
  if(!['party','players'].includes(mode))throw new Error('Unknown party mode.');
  if(mode===state.tokenMode)return state;
  if(mode==='players'){
    if(!state.regroupPlayers)return {...state,tokenMode:mode};
    const points=formation(map,state.party,state.roster.length);
    return {...state,tokenMode:mode,regroupPlayers:false,roster:state.roster.map((p,i)=>({...p,position:points[i]}))};
  }
  const party=state.roster.length?[0,1].map(axis=>state.roster.reduce((sum,p)=>sum+p.position[axis],0)/state.roster.length):state.party;
  return {...state,tokenMode:mode,party,regroupPlayers:false};
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
  return {id,type,center:[...center],size:20,width:type==='circle'?40:20,height:type==='circle'?40:20,rotation:0,color:SHAPE_COLORS[0],visible:true};
}
export function shapeLocalPoint(map,shape,point) {
  const x=(point[0]-shape.center[0])*map.width,y=(point[1]-shape.center[1])*map.height,angle=-shape.rotation*Math.PI/180;
  return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
}
export function resizeShape(map,shape,point) {
  const [x,y]=shapeLocalPoint(map,shape,point),size=fiveFeet(worldToFeet(map,shape.type==='square'?Math.max(Math.abs(x),Math.abs(y))*2:Math.hypot(x,y)));
  return {...shape,size,width:shape.type==='circle'?size*2:size,height:shape.type==='circle'?size*2:size};
}
export function rotateShape(map,shape,point,offset=0) {
  const angle=Math.atan2((point[1]-shape.center[1])*map.height,(point[0]-shape.center[0])*map.width)*180/Math.PI+90-offset;
  return {...shape,rotation:(angle+720)%360};
}
export function playerProjection(state) {
  const {campaign,...rest}=state;
  const publicMember=m=>{const {hp,maxHp,statCard,...safe}=m;return safe;};
  return {...rest,public:true,turnId:state.public?state.turnId:initiativeOrder(state).some(m=>m.id===state.turnId)?state.turnId:initiativeOrder(state)[0]?.id||null,roster:state.roster.map(publicMember),items:(state.items||[]).filter(m=>m.visible),monsters:(state.monsters||[]).filter(m=>m.visible).map(m=>({...publicMember(m),initiative:null})),shapes:state.shapes.map(s=>({...s,visible:true}))};
}
