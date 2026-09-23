const NS='http://www.w3.org/2000/svg';
export const PING_DURATION=4000,PING_LIMIT=10,PING_HOLD_LEASE=8000;
export function validPing(ping,now=Date.now()){
 return !!ping&&typeof ping.id==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(ping.id)&&Array.isArray(ping.point)&&ping.point.length===2&&ping.point.every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&typeof ping.held==='boolean'&&Number.isSafeInteger(ping.revision)&&ping.revision>=0&&Number.isFinite(ping.started)&&ping.started<=now&&now-ping.started<(ping.held?PING_HOLD_LEASE:PING_DURATION);
}
export function createMapPings({map,stage,player,pointAt,send}){
 const node=(tag,attrs)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 const plane=node('svg',{id:'map-pings','aria-hidden':'true',preserveAspectRatio:'xMidYMid meet'});stage.append(plane);
 const active=new Map(),diameter=12; // CSS pixels, matching the token-label text size.
 let screenScale=1;
 function positionEntry(entry){entry.node.setAttribute('transform',`translate(${entry.ping.point[0]*map.width} ${entry.ping.point[1]*map.height}) scale(${1/screenScale})`);}
 function remove(id){const entry=active.get(id);if(!entry)return;clearTimeout(entry.timer);entry.animation?.cancel();entry.node.remove();active.delete(id);}
 function prune(){const now=Date.now();for(const[id,entry]of active)if(!validPing(entry.ping,now))remove(id);}
 function add(ping){
  prune();const now=Date.now();if(!validPing(ping,now))return false;let entry=active.get(ping.id);
  if(entry?ping.revision<=entry.ping.revision:active.size>=PING_LIMIT)return false;
  if(!entry){
   const g=node('g',{'data-ping':ping.id});
   g.append(node('circle',{r:diameter*.36,fill:'none',stroke:'#0a110e','stroke-width':diameter*.28}),node('circle',{r:diameter*.36,fill:'none',stroke:'#ffd786','stroke-width':diameter*.13}),node('circle',{r:diameter*.095,fill:'#fff4cf'}));plane.append(g);entry={node:g};active.set(ping.id,entry);
  }
  clearTimeout(entry.timer);entry.animation?.cancel();entry.animation=null;entry.ping={...ping,point:[...ping.point]};entry.node.dataset.held=String(ping.held);positionEntry(entry);
  const age=now-ping.started;
  if(!ping.held){entry.animation=entry.node.animate([{opacity:1},{opacity:0}],{duration:PING_DURATION,easing:'linear',fill:'forwards'});entry.animation.currentTime=age;}
  entry.timer=setTimeout(()=>remove(ping.id),(ping.held?PING_HOLD_LEASE:PING_DURATION)-age);return true;
 }
 let press=null,last=null,held=null,pending=null,frame=0,heartbeat=0,suppressContextUntil=0;
 function updateHeld(point,released=false){if(!held)return;const ping={...held.ping,point,held:!released,started:Date.now(),revision:held.ping.revision+1};if(add(ping)){held.ping=ping;send(ping);}}
 function flush(){cancelAnimationFrame(frame);frame=0;if(held&&pending){const point=pending;pending=null;updateHeld(point);}}
 function release(){
  if(!held)return;flush();const current=held;updateHeld(current.ping.point,true);held=null;clearInterval(heartbeat);heartbeat=0;
  if(stage.hasPointerCapture(current.pointer))stage.releasePointerCapture(current.pointer);
 }
 function cancel(){release();press=null;last=null;pending=null;cancelAnimationFrame(frame);frame=0;}
 if(!player){
  // Secondary buttons do not reliably emit dblclick. Detect the second press
  // ourselves, before the pan handler, so holding that press moves only the ping.
  stage.addEventListener('pointerdown',event=>{
   const board=event.target.closest('#map,#party-overlay,#character-tokens,#shape-handle-overlay,#aura-handles');
   if(event.button!==2||!board){cancel();return;}
   const now=performance.now(),previous=last;last=null;
   if(previous&&now-previous.time<=500&&Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<=6){
    press=null;const ping={id:crypto.randomUUID(),point:pointAt(event),held:true,revision:0,started:Date.now()};
    event.preventDefault();event.stopImmediatePropagation();suppressContextUntil=now+700;
    if(add(ping)){held={ping,pointer:event.pointerId};stage.setPointerCapture(event.pointerId);send(ping);heartbeat=setInterval(()=>{if(held)updateHeld(held.ping.point);},1000);}
    return;
   }
   press={id:event.pointerId,x:event.clientX,y:event.clientY,time:now,moved:false};
  });
  stage.addEventListener('pointermove',event=>{
   if(held&&event.pointerId===held.pointer){if(!(event.buttons&2)){cancel();return;}event.preventDefault();event.stopImmediatePropagation();const point=pointAt(event);if(point?.every(Number.isFinite)){pending=point.map(n=>Math.max(0,Math.min(1,n)));if(!frame)frame=requestAnimationFrame(flush);}return;}
   if(press&&press.id===event.pointerId&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>4){press.moved=true;last=null;}
  },true);
  stage.addEventListener('pointerup',event=>{
   if(event.button!==2)return;
   if(held&&event.pointerId===held.pointer){event.preventDefault();event.stopImmediatePropagation();release();last=null;return;}
   if(!press||press.id!==event.pointerId)return;const click=press;press=null;const now=performance.now();
   last=click.moved||now-click.time>500?null:{x:event.clientX,y:event.clientY,time:now};
  },true);
  stage.addEventListener('contextmenu',event=>{if(held||event.target===stage&&performance.now()<suppressContextUntil)event.preventDefault();});
  stage.addEventListener('pointercancel',cancel,true);
  stage.addEventListener('lostpointercapture',event=>{if(event.target===stage&&held&&event.pointerId===held.pointer)cancel();});
  window.addEventListener('blur',cancel);
 }
 document.addEventListener('visibilitychange',()=>{cancel();prune();});
 window.addEventListener('pagehide',()=>{cancel();for(const id of [...active.keys()])remove(id);});
 return {add,cancelGesture:cancel,isHolding:()=>!!held,current(){prune();return [...active.values()].map(entry=>entry.ping);},position(viewBox,scale){plane.setAttribute('viewBox',viewBox);screenScale=scale;for(const entry of active.values())positionEntry(entry);}};
}
