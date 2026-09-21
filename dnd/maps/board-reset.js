import {clearSessionMemory} from './session-storage.js?v=60';
import {clearAssets} from './local-assets.js?v=60';
import {showDialog} from './dialogs.js?v=60';
import {el,button} from './editor-dom.js?v=60';
export const isBoardStorageKey=key=>key.startsWith('lanternford:')||['ullhexa:initiative-width','ullhexa:dm-sidebar-width'].includes(key);
const channelName='ullhexa-control-board-reset',signalKey='lanternford:reset-signal';
let channel;
export function listenForBoardReset(){
  const receive=message=>{if(message?.type==='cancel')window.ullhexaResetting=false;if(message?.type==='begin')window.ullhexaResetting=true;if(message?.type==='complete'&&typeof message.session==='string'){window.ullhexaResetting=true;if(window.top!==window)return;const url=new URL(location.href),player=url.searchParams.get('view')==='player';url.search='';url.searchParams.set('session',message.session);if(player)url.searchParams.set('view','player');location.replace(url);}};
  try{channel=new BroadcastChannel(channelName);channel.onmessage=e=>receive(e.data);}catch{}
  window.addEventListener('storage',e=>{if(e.key===signalKey&&e.newValue){try{receive(JSON.parse(e.newValue));}catch{}}});
}
function notify(message){channel?.postMessage(message);localStorage.setItem(signalKey,JSON.stringify({...message,nonce:crypto.randomUUID()}));}
export function confirmInitializeControlBoard(){
  return new Promise(resolve=>{
    let confirmed=false;const dialog=el('dialog',undefined,'initialize-dialog');dialog.id='initialize-dialog';dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-labelledby','initialize-title');dialog.setAttribute('aria-describedby','initialize-description');
    const title=el('h2','Initialize control board?');title.id='initialize-title';
    const description=el('p','This clears all games, uploaded assets and control settings in this browser. Downloaded save files are kept.');description.id='initialize-description';
    const actions=el('div',undefined,'dialog-actions');actions.append(button('Cancel',()=>dialog.close(),'quiet'),button('Initialize',()=>{confirmed=true;dialog.close();},'danger'));
    dialog.append(title,description,actions);document.body.append(dialog);
    dialog.addEventListener('close',()=>{dialog.remove();resolve(confirmed);},{once:true});showDialog(dialog);
  });
}
export async function initializeControlBoard(){
  window.ullhexaResetting=true;notify({type:'begin'});
  try{await clearAssets();clearSessionMemory();const keys=Object.keys(localStorage).filter(isBoardStorageKey);keys.forEach(key=>localStorage.removeItem(key));const session=crypto.randomUUID();notify({type:'complete',session});localStorage.removeItem(signalKey);const url=new URL(location.href);url.search=new URLSearchParams({session}).toString();window.top.location.replace(url);}catch(error){window.ullhexaResetting=false;notify({type:'cancel'});localStorage.removeItem(signalKey);throw error;}
}
