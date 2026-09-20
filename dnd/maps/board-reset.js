import {clearSessionMemory} from './session-storage.js?v=33';
import {clearAssets} from './local-assets.js?v=33';
export const isBoardStorageKey=key=>key.startsWith('lanternford:')||['ullhexa:initiative-width','ullhexa:dm-sidebar-width'].includes(key);
const channelName='ullhexa-control-board-reset',signalKey='lanternford:reset-signal';
let channel;
export function listenForBoardReset(){
  const receive=message=>{if(message?.type==='cancel')window.ullhexaResetting=false;if(message?.type==='begin')window.ullhexaResetting=true;if(message?.type==='complete'&&typeof message.session==='string'){window.ullhexaResetting=true;if(window.top!==window)return;const url=new URL(location.href),player=url.searchParams.get('view')==='player';url.search='';url.searchParams.set('session',message.session);if(player)url.searchParams.set('view','player');location.replace(url);}};
  try{channel=new BroadcastChannel(channelName);channel.onmessage=e=>receive(e.data);}catch{}
  window.addEventListener('storage',e=>{if(e.key===signalKey&&e.newValue){try{receive(JSON.parse(e.newValue));}catch{}}});
}
function notify(message){channel?.postMessage(message);localStorage.setItem(signalKey,JSON.stringify({...message,nonce:crypto.randomUUID()}));}
export async function initializeControlBoard(){
  window.ullhexaResetting=true;notify({type:'begin'});
  try{await clearAssets();clearSessionMemory();const keys=Object.keys(localStorage).filter(isBoardStorageKey);keys.forEach(key=>localStorage.removeItem(key));const session=crypto.randomUUID();notify({type:'complete',session});localStorage.removeItem(signalKey);const url=new URL(location.href);url.search=new URLSearchParams({session}).toString();window.top.location.replace(url);}catch(error){window.ullhexaResetting=false;notify({type:'cancel'});localStorage.removeItem(signalKey);throw error;}
}
