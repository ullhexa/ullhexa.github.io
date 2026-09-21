// A heartbeat is an invitation to verify a live display, not proof by itself.
// Late packets from a closed window cannot relight the button without a reply.
export function createDisplayPresence({now=Date.now,nonce=()=>crypto.randomUUID()}={}){
 const peers=new Map(),pending=new Map();
 function hello(playerId){
  if(typeof playerId!=='string'||!playerId||playerId.length>80)return null;
  const challenge=nonce();pending.set(playerId,{challenge,time:now()});
  return {type:'display-probe',playerId,challenge};
 }
 function confirm({playerId,challenge}){
  const request=pending.get(playerId);
  if(!request||request.challenge!==challenge||now()-request.time>3000)return false;
  pending.delete(playerId);peers.set(playerId,now());return true;
 }
 function bye(id){pending.delete(id);peers.delete(id);}
 function connected(){
  for(const[id,time]of peers)if(now()-time>7000)peers.delete(id);
  for(const[id,request]of pending)if(now()-request.time>3000)pending.delete(id);
  return peers.size>0;
 }
 return {hello,confirm,bye,connected,clear(){peers.clear();pending.clear();}};
}
