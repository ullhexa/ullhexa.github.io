import {itemOnSelectedFloor} from './floors.js?v=59';
import {normalizeItems, normalizeMembers, normalizeCampaign, syncCampaign, fiveFeet, initiativeOrder} from './combat-state.js?v=59';
export const PORTRAITS = ['Human warrior','Silver-haired elf','Dwarven adventurer','Halfling ranger','Half-orc guardian','Human wizard','Tiefling wanderer','Elven mage','Dragonborn',
  'Copper-haired elf','Human paladin','Dwarven shieldmaiden','Halfling bard','Half-orc veteran','Violet tiefling','Blue dragonborn','Gnome tinkerer',
  'Human cleric','Human monk','Elven scholar','Feline ranger','Lizardfolk druid','Veteran knight','Human rogue','Dwarven cleric','Human druid','Elder sorcerer','Golden dragonborn','Gnome scout','Orc fighter'];
export const PARTY_CHOICES=[{"id": 30, "name": "Human \u00b7 Male", "species": "Human", "gender": "Male"}, {"id": 31, "name": "Human \u00b7 Female", "species": "Human", "gender": "Female"}, {"id": 32, "name": "Hill dwarf \u00b7 Male", "species": "Hill dwarf", "gender": "Male"}, {"id": 33, "name": "Hill dwarf \u00b7 Female", "species": "Hill dwarf", "gender": "Female"}, {"id": 34, "name": "Mountain dwarf \u00b7 Male", "species": "Mountain dwarf", "gender": "Male"}, {"id": 35, "name": "Mountain dwarf \u00b7 Female", "species": "Mountain dwarf", "gender": "Female"}, {"id": 36, "name": "High elf \u00b7 Male", "species": "High elf", "gender": "Male"}, {"id": 37, "name": "High elf \u00b7 Female", "species": "High elf", "gender": "Female"}, {"id": 38, "name": "Wood elf \u00b7 Male", "species": "Wood elf", "gender": "Male"}, {"id": 39, "name": "Wood elf \u00b7 Female", "species": "Wood elf", "gender": "Female"}, {"id": 40, "name": "Drow \u00b7 Male", "species": "Drow", "gender": "Male"}, {"id": 41, "name": "Drow \u00b7 Female", "species": "Drow", "gender": "Female"}, {"id": 42, "name": "Lightfoot halfling \u00b7 Male", "species": "Lightfoot halfling", "gender": "Male"}, {"id": 43, "name": "Lightfoot halfling \u00b7 Female", "species": "Lightfoot halfling", "gender": "Female"}, {"id": 44, "name": "Stout halfling \u00b7 Male", "species": "Stout halfling", "gender": "Male"}, {"id": 45, "name": "Stout halfling \u00b7 Female", "species": "Stout halfling", "gender": "Female"}, {"id": 46, "name": "Forest gnome \u00b7 Male", "species": "Forest gnome", "gender": "Male"}, {"id": 47, "name": "Forest gnome \u00b7 Female", "species": "Forest gnome", "gender": "Female"}, {"id": 48, "name": "Rock gnome \u00b7 Male", "species": "Rock gnome", "gender": "Male"}, {"id": 49, "name": "Rock gnome \u00b7 Female", "species": "Rock gnome", "gender": "Female"}, {"id": 50, "name": "Red dragonborn \u00b7 Male", "species": "Red dragonborn", "gender": "Male"}, {"id": 51, "name": "Red dragonborn \u00b7 Female", "species": "Red dragonborn", "gender": "Female"}, {"id": 52, "name": "Blue dragonborn \u00b7 Male", "species": "Blue dragonborn", "gender": "Male"}, {"id": 53, "name": "Blue dragonborn \u00b7 Female", "species": "Blue dragonborn", "gender": "Female"}, {"id": 54, "name": "Gold dragonborn \u00b7 Male", "species": "Gold dragonborn", "gender": "Male"}, {"id": 55, "name": "Gold dragonborn \u00b7 Female", "species": "Gold dragonborn", "gender": "Female"}, {"id": 56, "name": "Orc \u00b7 Male", "species": "Orc", "gender": "Male"}, {"id": 57, "name": "Orc \u00b7 Female", "species": "Orc", "gender": "Female"}, {"id": 58, "name": "Goliath \u00b7 Male", "species": "Goliath", "gender": "Male"}, {"id": 59, "name": "Goliath \u00b7 Female", "species": "Goliath", "gender": "Female"}, {"id": 60, "name": "Aasimar \u00b7 Male", "species": "Aasimar", "gender": "Male"}, {"id": 61, "name": "Aasimar \u00b7 Female", "species": "Aasimar", "gender": "Female"}, {"id": 62, "name": "Infernal tiefling \u00b7 Male", "species": "Infernal tiefling", "gender": "Male"}, {"id": 63, "name": "Infernal tiefling \u00b7 Female", "species": "Infernal tiefling", "gender": "Female"}, {"id": 64, "name": "Abyssal tiefling \u00b7 Male", "species": "Abyssal tiefling", "gender": "Male"}, {"id": 65, "name": "Abyssal tiefling \u00b7 Female", "species": "Abyssal tiefling", "gender": "Female"}, {"id": 66, "name": "Chthonic tiefling \u00b7 Male", "species": "Chthonic tiefling", "gender": "Male"}, {"id": 67, "name": "Chthonic tiefling \u00b7 Female", "species": "Chthonic tiefling", "gender": "Female"}, {"id": 68, "name": "Half-elf \u00b7 Male", "species": "Half-elf", "gender": "Male"}, {"id": 69, "name": "Half-elf \u00b7 Female", "species": "Half-elf", "gender": "Female"}, {"id": 70, "name": "Half-orc \u00b7 Male", "species": "Half-orc", "gender": "Male"}, {"id": 71, "name": "Half-orc \u00b7 Female", "species": "Half-orc", "gender": "Female"}, {"id": 72, "name": "Tabaxi \u00b7 Male", "species": "Tabaxi", "gender": "Male"}, {"id": 73, "name": "Tabaxi \u00b7 Female", "species": "Tabaxi", "gender": "Female"}, {"id": 74, "name": "Lizardfolk \u00b7 Male", "species": "Lizardfolk", "gender": "Male"}, {"id": 75, "name": "Lizardfolk \u00b7 Female", "species": "Lizardfolk", "gender": "Female"}, {"id": 76, "name": "Fire genasi \u00b7 Male", "species": "Fire genasi", "gender": "Male"}, {"id": 77, "name": "Fire genasi \u00b7 Female", "species": "Fire genasi", "gender": "Female"}, {"id": 78, "name": "Water genasi \u00b7 Male", "species": "Water genasi", "gender": "Male"}, {"id": 79, "name": "Water genasi \u00b7 Female", "species": "Water genasi", "gender": "Female"}];
PORTRAITS.push(...PARTY_CHOICES.map(p=>p.name));
export const PORTRAIT_ASSETS = ['./assets/portraits.png','./assets/portraits-additional.png','./assets/portraits-extra.png','./assets/monsters.png','./assets/portraits-paired.png','./assets/monsters-additional.png'];
// The generated monster sheet has uneven row heights, especially its last row.
// Crop within the measured panels instead of assuming a uniform 5 × 6 atlas.
const MONSTER_COLUMNS = [0,230,459,687,916,1145];
const MONSTER_ROWS = [0,213,423,634,845,1066,1374];
export function portraitAsset(index,monster=false) {
  if(monster&&index>=30){const n=index-30,ys=[0,282,562,844,1254],x=n%5*250.8,y=ys[Math.floor(n/5)],h=ys[Math.floor(n/5)+1]-y,size=Math.min(250.8,h)-4;return {url:PORTRAIT_ASSETS[5],crop:[(x+(250.8-size)/2)/1254,(y+(h-size)/2)/1254,size/1254,size/1254]};}
  if(!monster&&index>=30){const n=index-30,r=Math.floor(n/10),c=n%10,selection=[[0,1,2,3,4,5,6,7,10,11],[0,1,2,3,4,6,7,8,10,11],[0,1,2,3,4,5,7,8,9,11],[0,1,2,3,4,5,7,8,9,10]],xs=r===4?[0,148,296,444,592,790,988,1165,1342,1558,1774]:Array.from({length:13},(_,i)=>i*1774/12),col=r===4?c:selection[r][c],ys=[0,180,354,533,708,887],w=xs[col+1]-xs[col],h=ys[r+1]-ys[r],size=Math.min(w,h)-4;return {url:PORTRAIT_ASSETS[4],crop:[(xs[col]+(w-size)/2)/1774,(ys[r]+(h-size)/2)/887,size/1774,size/887]};}
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

// Keep the first player at the party anchor, then fill alternating nearby squares.
export function formation(map, anchor, count) {
  const step=map.grid.size,half=step/2,center=anchor.map((n,i)=>clamp(n*[map.width,map.height][i],Math.min(half,[map.width,map.height][i]/2),Math.max([map.width,map.height][i]/2,[map.width,map.height][i]-half))),cells=[];
  const limit=Math.ceil(Math.max(map.width,map.height)/step);
  for(let r=0;r<=limit&&cells.length<count;r++)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||(x+y)%2!==0)continue;
    const px=center[0]+x*step,py=center[1]+y*step;
    if(px<half||py<half||px>map.width-half||py>map.height-half)continue;
    cells.push({x,y,px,py,d:x*x+y*y});
  }
  cells.sort((a,b)=>a.d-b.d||a.y-b.y||b.x-a.x);
  return cells.slice(0,count).map(({px,py})=>[px/map.width,py/map.height]);
}
export function defaultRoster(map, anchor=map.partyStart) {
  return formation(map,anchor,4).map((position,index)=>({id:`player-${index+1}`,name:`Player ${index+1}`,portrait:PARTY_CHOICES[index].id,position}));
}
export function normalizeEncounter(map,input,party) {
  const roster=normalizeMembers(Array.isArray(input.roster)?input.roster:defaultRoster(map,party));
  const shapeIds=new Set();
  const shapes=(Array.isArray(input.shapes)?input.shapes:[]).slice(0,32).filter(s=>s&&typeof s.id==='string'&&/^[-a-zA-Z0-9]+$/.test(s.id)&&!shapeIds.has(s.id)&&shapeIds.add(s.id)&&[...SHAPE_TYPES,'triangle'].includes(s.type)&&boundedPoint(s.center)&&[s.width,s.height,s.rotation].every(Number.isFinite)).map(s=>{const type=s.type==='triangle'?'cone':s.type,size=fiveFeet(s.size??(type==='circle'?Math.max(s.width,s.height)/2:Math.max(s.width,s.height)));return {id:s.id,type,size,width:type==='circle'?size*2:size,height:type==='circle'?size*2:size,center:[...s.center],rotation:((s.rotation%360)+360)%360,color:SHAPE_COLORS.includes(s.color)?s.color:({'#e8ba71':'#eea348','#ec6d62':'#e76660','#70bce8':'#58a9e0','#a98ce5':'#58a9e0','#78cba2':'#6fb980','#ef91be':'#e76660'}[s.color]||SHAPE_COLORS[0]),visible:s.visible!==false};});
  return {roster,itemSchema:2,items:input.itemSchema===2?normalizeItems(input.items):[],monsters:normalizeMembers(input.monsters,true),...(input.public?{public:true}:{campaign:normalizeCampaign(input.campaign,roster)}),tokenMode:input.tokenMode==='players'?'players':'party',regroupPlayers:typeof input.regroupPlayers==='boolean'?input.regroupPlayers:input.tokenMode!=='players',shapes};
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
    roster.push({id:`player-${suffix}`,name:`Player ${i+1}`,portrait:PARTY_CHOICES[i%PARTY_CHOICES.length].id,position});
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
  const publicMember=m=>{const {hp,maxHp,hpLinked,statCard,statText,spells,...safe}=m;return safe;};
  return {...rest,public:true,turnId:state.public?state.turnId:initiativeOrder(state).some(m=>m.id===state.turnId)?state.turnId:initiativeOrder(state)[0]?.id||null,roster:state.roster.map(publicMember),items:(state.items||[]).filter(m=>m.visible&&itemOnSelectedFloor(m,state)).map(({comment,templateId,...safe})=>safe),monsters:(state.monsters||[]).filter(m=>m.visible).map(m=>({...publicMember(m),initiative:null})),shapes:state.shapes.filter(s=>s.visible!==false).map(s=>({...s,visible:true}))};
}
