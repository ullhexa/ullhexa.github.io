const id=value=>typeof value==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(value);
const asset=value=>typeof value==='string'&&/^asset-[-a-zA-Z0-9]{1,80}$/.test(value);
export const USER_TOKEN_KINDS=['party','encounter','items'];
export const validUserToken=t=>!!t&&id(t.id)&&asset(t.asset)&&typeof t.name==='string'&&!!t.name.trim()&&t.name.length<=80;
export function validUserTokens(value){return value===undefined||!!value&&USER_TOKEN_KINDS.every(kind=>Array.isArray(value[kind])&&value[kind].length<=500&&value[kind].every(validUserToken)&&new Set(value[kind].map(t=>t.id)).size===value[kind].length);}
export function normalizeUserTokens(value,groups){
  return Object.fromEntries(USER_TOKEN_KINDS.map((kind,i)=>{
    const source=Array.isArray(value?.[kind])?value[kind]:(groups[i]||[]).flatMap(g=>g.members).filter(m=>asset(m.avatar)).map(m=>({id:m.avatar,asset:m.avatar,name:m.name}));
    return [kind,source.filter(validUserToken).filter((t,i,a)=>a.findIndex(v=>v.id===t.id)===i).slice(0,500).map(t=>({id:t.id,asset:t.asset,name:t.name}))];
  }));
}
