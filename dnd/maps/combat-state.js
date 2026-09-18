// Small, explicit session model. Roster and monsters are the active map instances.
export const CONDITIONS=[['blinded','◉̸','Blinded'],['charmed','♡','Charmed'],['deafened','♬̸','Deafened'],['exhaustion','⌛','Exhaustion'],['frightened','!','Frightened'],['grappled','⚓','Grappled'],['incapacitated','×','Incapacitated'],['invisible','◌','Invisible'],['paralyzed','Ⅱ','Paralyzed'],['petrified','◆','Petrified'],['poisoned','☠','Poisoned'],['prone','↘','Prone'],['restrained','⊠','Restrained'],['stunned','✧','Stunned'],['unconscious','☾','Unconscious']];
export const MONSTERS=['Goblin','Kobold','Orc','Bugbear','Bandit','Cultist','Skeleton','Zombie','Ghoul','Mummy','Vampire','Ghost','Wolf','Bear','Giant spider','Owlbear','Troll','Ogre','Cyclops','Minotaur','Red dragon','Green dragon','Gargoyle','Imp','Fire elemental','Water elemental','Earth elemental','Air elemental','Mimic','Gelatinous cube'];
export const safeId=v=>typeof v==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(v);
export const assetId=v=>typeof v==='string'&&/^asset-[a-zA-Z0-9-]{1,80}$/.test(v);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const point=v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<=1);
export const fiveFeet=n=>clamp(Math.round((Number(n)||5)/5)*5,5,200);
export function parseInitiative(value){if(value===null||value===undefined||String(value).trim()==='')return null;const text=String(value).trim().replace(',','.');return /^-?\d+(?:\.\d+)?$/.test(text)&&Math.abs(Number(text))<=999?Number(text):null;}
export function normalizeMember(p,i=0,monster=false){
  const hp=Number.isFinite(p.maxHp)?clamp(Math.round(p.maxHp),0,100000):0;
  return {id:safeId(p.id)?p.id:`${monster?'monster':'player'}-${i+1}`,name:typeof p.name==='string'?p.name.trim().slice(0,32)||'Unnamed':'Unnamed',portrait:Number.isInteger(p.portrait)?clamp(p.portrait,0,29):0,position:point(p.position)?[...p.position]:[.5,.5],avatar:assetId(p.avatar)?p.avatar:null,stack:Number.isSafeInteger(p.stack)&&p.stack>=0?p.stack:0,initiative:parseInitiative(p.initiative),conditions:[...new Set((Array.isArray(p.conditions)?p.conditions:[]).filter(id=>CONDITIONS.some(c=>c[0]===id)))],letters:[...new Set((Array.isArray(p.letters)?p.letters:[]).filter(s=>typeof s==='string'&&/^[A-Z]$/.test(s)))],...(monster?{monster:true,size:fiveFeet(p.size),visible:p.visible===true,maxHp:hp,hp:Number.isFinite(p.hp)?clamp(Math.round(p.hp),0,hp):hp,statCard:assetId(p.statCard)?p.statCard:null}:{size:5})};
}
export function normalizeMembers(list,monster=false){const used=new Set();return (Array.isArray(list)?list:[]).slice(0,60).filter(p=>p&&safeId(p.id)&&!used.has(p.id)&&used.add(p.id)).map((p,i)=>normalizeMember(p,i,monster));}
export function normalizeCampaign(value,roster){
  const groups=(items,monster)=>{const used=new Set();return (Array.isArray(items)?items:[]).slice(0,20).filter(g=>g&&safeId(g.id)&&!used.has(g.id)&&used.add(g.id)).map(g=>({id:g.id,name:typeof g.name==='string'?g.name.trim().slice(0,48)||'Untitled':'Untitled',members:normalizeMembers(g.members,monster)}));};
  const parties=groups(value?.parties,false),encounters=groups(value?.encounters,true);
  if(!parties.length)parties.push({id:'party-default',name:'Party',members:normalizeMembers(roster)});
  return {parties,encounters,activeParty:parties.some(p=>p.id===value?.activeParty)?value.activeParty:parties[0].id,activeEncounter:encounters.some(g=>g.id===value?.activeEncounter)?value.activeEncounter:null};
}
export function syncCampaign(state){if(state.public)return state;const campaign=normalizeCampaign(state.campaign,state.roster);campaign.parties=campaign.parties.map(g=>g.id===campaign.activeParty?{...g,members:state.roster}:g);campaign.encounters=campaign.encounters.map(g=>g.id===campaign.activeEncounter?{...g,members:state.monsters||[]}:g);return {...state,campaign};}
export function applyGroup(state,kind,id){const current=syncCampaign(state),key=kind==='party'?'parties':'encounters',active=kind==='party'?'activeParty':'activeEncounter',field=kind==='party'?'roster':'monsters';const g=current.campaign[key].find(g=>g.id===id);if(!g)return state;return {...current,[field]:g.members.map(m=>({...m})),campaign:{...current.campaign,[active]:id},turnId:null,...(kind==='party'?{regroupPlayers:false}:{})};}
export function combatants(state){return [...state.roster,...(state.monsters||[])];}
export function initiativeOrder(state,publicOnly=false){return combatants(state).filter(m=>(!publicOnly||!m.monster)&&m.initiative!==null&&Number.isFinite(m.initiative)).sort((a,b)=>b.initiative-a.initiative||a.id.localeCompare(b.id));}
export function stepTurn(state,delta){const order=initiativeOrder(state);if(!order.length)return {...state,turnId:null};const index=order.findIndex(m=>m.id===state.turnId);return {...state,turnId:order[(Math.max(0,index)+delta+order.length)%order.length].id};}
export function patchMember(state,id,patch){return {...state,roster:state.roster.map(m=>m.id===id?{...m,...patch}:m),monsters:(state.monsters||[]).map(m=>m.id===id?{...m,...patch}:m)};}
export function resetInitiative(state,monster=false){
  const key=monster?'monsters':'roster',members=state[key]||[];
  const next={...state,[key]:members.map(m=>({...m,initiative:null}))};
  if(members.some(m=>m.id===state.turnId))next.turnId=initiativeOrder(next)[0]?.id||null;
  return syncCampaign(next);
}
export function changeHP(member,amount,heal=false){return {...member,hp:clamp(member.hp+(heal?1:-1)*Math.max(0,Math.round(Number(amount)||0)),0,member.maxHp)};}
export function snapPoint(map,p,size=5){const cells=Math.max(1,Math.round(size/map.grid.distance)),offset=cells%2?.5:0;return p.map((n,i)=>{const dimension=i?map.height:map.width;return clamp((Math.round(n*dimension/map.grid.size-offset)+offset)*map.grid.size/dimension,0,1);});}

export function bringToFront(state,id){const members=combatants(state);if(!members.some(m=>m.id===id))return state;return patchMember(state,id,{stack:Math.max(0,...members.map(m=>m.stack||0))+1});}
