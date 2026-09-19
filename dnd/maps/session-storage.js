const preference='lanternford:auto-save';
// Rebind from the current frame: the previous DM map document is discarded on navigation.
function bind(m){if(!m.channel)return;m.channel.onmessage=({data:d})=>{
  if(!d||d.session!==m.session)return;
  if(d.type==='snapshot-request'&&!m.player)m.channel.postMessage({type:'snapshot',session:m.session,request:d.request,values:[...m.values],auto:m.auto});
  if(d.type==='snapshot'&&m.pending.has(d.request)){for(const [key,value]of d.values||[])if(typeof key==='string'&&key.startsWith('lanternford:'))m.values.set(key,value);m.auto=d.auto!==false;m.pending.get(d.request)(true);}
  if(d.type==='put'&&m.player&&typeof d.key==='string'&&d.key.startsWith('lanternford:'))m.values.set(d.key,d.value);
  if(d.type==='asset-request'&&!m.player&&m.assets.has(d.id))m.channel.postMessage({type:'asset',session:m.session,request:d.request,record:m.assets.get(d.id)});
  if(d.type==='asset'&&m.pending.has(d.request)&&d.record?.id){m.assets.set(d.record.id,d.record);m.pending.get(d.request)(d.record);}
 };}
function memory(){
 const host=window.top;
 if(host.ullhexaLiveStore){bind(host.ullhexaLiveStore);return host.ullhexaLiveStore;}
 const m={values:new Map(),assets:new Map(),pendingAssets:new Map(),pending:new Map(),session:null,player:false,auto:true,channel:null};
 try{m.auto=localStorage.getItem(preference)!=='false';}catch{}
 host.ullhexaLiveStore=m;
 try{m.channel=new host.BroadcastChannel('ullhexa-live-session-v1');bind(m);}catch{}
 return m;
}
function request(type,payload={},timeout=1500){const m=memory();if(!m.channel)return Promise.resolve(null);const id=crypto.randomUUID();return new Promise(resolve=>{const timer=window.setTimeout(()=>finish(null),timeout);function finish(value){clearTimeout(timer);m.pending.delete(id);resolve(value);}m.pending.set(id,finish);m.channel.postMessage({type,session:m.session,request:id,...payload});});}
export async function configureSession(session,{player=false}={}){const m=memory();if(m.session===session&&m.configured)return;m.session=session;m.player=player;m.configured=true;if(player)await request('snapshot-request',{},300);}
export function readSessionValue(key){const m=memory();if(m.values.has(key))return m.values.get(key);try{const value=JSON.parse(localStorage.getItem(key));if(value!==null)m.values.set(key,value);return value;}catch{return null;}}
export function writeSessionValue(key,value){if(window.ullhexaResetting)return false;const m=memory();m.values.set(key,value);if(!m.player)m.channel?.postMessage({type:'put',session:m.session,key,value});if(!m.auto)return true;try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function autoSaveEnabled(){return memory().auto;}
export async function setAutoSave(enabled,persistAssets){const m=memory();if(enabled){await persistAssets([...m.pendingAssets.values()]);for(const [key,value]of m.values)localStorage.setItem(key,JSON.stringify(value));m.pendingAssets.clear();}m.auto=enabled;try{localStorage.setItem(preference,String(enabled));}catch{}return enabled;}
export function memoryAsset(id){return memory().assets.get(id);}
export function rememberAssets(records,{pending=false}={}){const m=memory();for(const record of records){m.assets.set(record.id,record);if(pending)m.pendingAssets.set(record.id,record);}}
export async function requestMemoryAsset(id){return request('asset-request',{id});}
export function clearSessionMemory(){const m=memory();m.values.clear();m.assets.clear();m.pendingAssets.clear();m.auto=true;}
