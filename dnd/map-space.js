// Map extensions move normalized coordinates, not distances measured in feet.
// Only explicitly listed older map versions use the authored translation.
const extentFor=(map,version)=>version!==map.version&&!map.userMap?map.coordinateMigrations?.find(m=>m.versions.includes(version)):null;
const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1);
export function migrateMapPoint(map,version,p){
 const extent=extentFor(map,version);
 if(!extent||!point(p))return p;
 return p.map((n,i)=>(n*extent.size[i]+extent.offset[i])/[map.width,map.height][i]);
}
export function migrateMapState(map,input){
 if(!extentFor(map,input.mapVersion))return input;
 const move=p=>migrateMapPoint(map,input.mapVersion,p);
 const members=list=>Array.isArray(list)?list.map(m=>m&&({...m,position:move(m.position)})):list;
 const next={...input,party:move(input.party),roster:members(input.roster),monsters:members(input.monsters),items:members(input.items)};
 if(Array.isArray(input.shapes))next.shapes=input.shapes.map(s=>s&&({...s,center:move(s.center)}));
 if(Array.isArray(input.fog))next.fog=input.fog.map(s=>s&&({...s,points:Array.isArray(s.points)?s.points.map(move):s.points}));
 if(input.camera&&point([input.camera.x,input.camera.y])){const [x,y]=move([input.camera.x,input.camera.y]);next.camera={...input.camera,x,y};}
 if(input.campaign){next.campaign={...input.campaign};for(const key of ['parties','encounters','itemLists'])if(Array.isArray(input.campaign[key]))next.campaign[key]=input.campaign[key].map(g=>({...g,members:members(g.members)}));}
 return next;
}
export function validCoordinateMigrations(map){
 if(map.coordinateMigrations===undefined)return true;
 const seen=new Set();return Array.isArray(map.coordinateMigrations)&&map.coordinateMigrations.length<=8&&map.coordinateMigrations.every(m=>
  m&&Array.isArray(m.versions)&&m.versions.length>0&&m.versions.every(v=>typeof v==='string'&&v!==map.version&&(map.previousVersions||[]).includes(v)&&!seen.has(v)&&seen.add(v))&&
  Array.isArray(m.size)&&m.size.length===2&&Array.isArray(m.offset)&&m.offset.length===2&&m.size.every((n,i)=>Number.isFinite(n)&&n>0&&Number.isFinite(m.offset[i])&&m.offset[i]>=0&&n+m.offset[i]<=[map.width,map.height][i]));
}
