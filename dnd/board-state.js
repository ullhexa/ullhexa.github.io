export const FEATURE_KEYS=['party','encounter','items','spells'];
export const normalizeFeatures=value=>Object.fromEntries(FEATURE_KEYS.map(key=>[key,value?.[key]!==false]));
export const validFeatures=value=>value===undefined||!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([key,v])=>FEATURE_KEYS.includes(key)&&typeof v==='boolean');
export const featureEnabled=(state,key)=>(state.public?state.features:state.campaign?.features)?.[key]!==false;
export const AURA_COLORS=['#58a9e0','#9a6d47','#e76660','#eea348','#111111','#ffffff','#6fb980','#ad83df'];
export const validAura=value=>value==null||!!value&&AURA_COLORS.includes(value.color)&&Number.isInteger(value.range)&&value.range>=5&&value.range<=200&&value.range%5===0;
export const normalizeAura=value=>value&&validAura(value)?{color:value.color,range:value.range}:null;
export const auraRadius=member=>(member.size||5)/2+(member.aura?.range||0);
export const armorClass=value=>value===null||value===undefined||value===''?null:Math.max(0,Math.min(99,Math.round(Number(value)||0)));
export const encounterTitle=member=>`${member.name}${member.monster&&member.ac!==null&&member.ac!==undefined?`, AC ${member.ac}`:''}`;
export const placeName=(place,state)=>state.placeNames?.[place.id]||place.name;
export function normalizePlaceNames(map,value){return Object.fromEntries(map.places.filter(p=>typeof value?.[p.id]==='string'&&value[p.id].trim()).map(p=>[p.id,value[p.id].trim().slice(0,64)]));}
export const validPlaceNames=(map,value)=>value===undefined||!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,name])=>map.places.some(p=>p.id===id)&&typeof name==='string'&&name.trim().length>0&&name.length<=64);
