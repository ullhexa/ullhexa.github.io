const NS='http://www.w3.org/2000/svg';
export const PING_DURATION=1700,PING_LIMIT=10,PING_HOLD_LEASE=8000;
export const PING_ATTACK=150,PING_DECAY=700,PING_TRAIL_DURATION=180,PING_TRAIL_LIMIT=6;
const clamp=n=>Math.max(0,Math.min(1,n));
const attackCurve=t=>Math.log1p(9*clamp(t))/Math.log(10);
const decayCurve=t=>-Math.expm1(-3*clamp(t))/-Math.expm1(-3);
const releaseStart=ping=>ping.created===undefined?ping.started:Math.max(ping.started,ping.created+PING_ATTACK+PING_DECAY);
export const pingExpiry=ping=>ping.held?ping.started+PING_HOLD_LEASE:releaseStart(ping)+PING_DURATION;
// The birth clock survives movement/heartbeats; the lease/release clock does not.
// Finish the opening pulse even on a quick tap, then start outward release.
// Attack/decay and opacity ease toward their targets; release size grows exponentially.
export function pingEnvelope(ping,now=Date.now()){
 const age=Math.max(0,now-(ping.created??ping.started));
 const pulse=age<PING_ATTACK?1+.5*attackCurve(age/PING_ATTACK):1+.5*(1-decayCurve((age-PING_ATTACK)/PING_DECAY));
 const release=ping.held?0:clamp((now-releaseStart(ping))/PING_DURATION);
 return {scale:pulse*Math.pow(3,release),opacity:1-decayCurve(release),animating:age<PING_ATTACK+PING_DECAY||!ping.held&&release<1};
}
export function validPing(ping,now=Date.now()){
 return !!ping&&typeof ping.id==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(ping.id)&&Array.isArray(ping.point)&&ping.point.length===2&&ping.point.every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&typeof ping.held==='boolean'&&Number.isSafeInteger(ping.revision)&&ping.revision>=0&&Number.isFinite(ping.started)&&(ping.created===undefined||Number.isFinite(ping.created)&&ping.created<=ping.started)&&ping.started<=now&&now<pingExpiry(ping);
}
export function createMapPings({map,stage,player,pointAt,send}){
 const node=(tag,attrs)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 const plane=node('svg',{id:'map-pings','aria-hidden':'true',preserveAspectRatio:'xMidYMid meet'});stage.append(plane);
 const defs=node('defs',{}),filter=node('filter',{id:'ping-trail-blur',filterUnits:'userSpaceOnUse',x:-32,y:-32,width:64,height:64});
 filter.append(node('feGaussianBlur',{stdDeviation:.8}));defs.append(filter);plane.append(defs);
 const active=new Map(),diameter=12; // CSS pixels at the envelope's resting size.
 let screenScale=1,animationFrame=0;
 function positionEntry(entry){entry.node.setAttribute('transform',`translate(${entry.ping.point[0]*map.width} ${entry.ping.point[1]*map.height}) scale(${1/screenScale})`);}
 function positionTrail(trail){
  const dx=(trail.from[0]-trail.to[0])*map.width*screenScale,dy=(trail.from[1]-trail.to[1])*map.height*screenScale,limit=Math.min(1,24/Math.max(.001,Math.hypot(dx,dy)));
  trail.node.setAttribute('transform',`translate(${trail.to[0]*map.width} ${trail.to[1]*map.height}) scale(${1/screenScale})`);
  trail.line.setAttribute('x2',dx*limit);trail.line.setAttribute('y2',dy*limit);
 }
 function remove(id){const entry=active.get(id);if(!entry)return;clearTimeout(entry.timer);entry.node.remove();entry.trailNode.remove();active.delete(id);}
 function prune(){const now=Date.now();for(const[id,entry]of active)if(!validPing(entry.ping,now))remove(id);}
 function paint(entry,now){
  const value=pingEnvelope(entry.ping,now);entry.glyph.setAttribute('transform',`scale(${value.scale})`);entry.node.style.opacity=String(value.opacity);
  entry.trails=entry.trails.filter(trail=>{const age=now-trail.started;if(age>=PING_TRAIL_DURATION){trail.node.remove();return false;}trail.node.style.opacity=String(trail.opacity*(1-age/PING_TRAIL_DURATION)**2);return true;});
  return value.animating||entry.trails.length>0;
 }
 function animate(){animationFrame=0;prune();const now=Date.now();let needed=false;for(const entry of active.values())needed=paint(entry,now)||needed;if(needed)animationFrame=requestAnimationFrame(animate);}
 function wake(){if(!animationFrame)animationFrame=requestAnimationFrame(animate);}
 function addTrail(entry,ping,now){
  const previous=entry.ping;if(!previous?.held||!ping.held||now-ping.started>PING_TRAIL_DURATION)return;
  const distance=Math.hypot((ping.point[0]-previous.point[0])*map.width,(ping.point[1]-previous.point[1])*map.height)*screenScale;
  const elapsed=Math.max(8,ping.started-previous.started),speed=distance/elapsed;
  if(distance<2||elapsed>150||speed<.08)return;
  const g=node('g',{'data-ping-trail':ping.id}),line=node('line',{x1:0,y1:0,stroke:'#ffd786','stroke-width':2.2,'stroke-linecap':'round',filter:'url(#ping-trail-blur)'});
  g.append(line);entry.trailNode.append(g);const trail={node:g,line,from:previous.point,to:ping.point,started:ping.started,opacity:.18*clamp(speed/1.2)};
  entry.trails.push(trail);positionTrail(trail);while(entry.trails.length>PING_TRAIL_LIMIT)entry.trails.shift().node.remove();
 }
 function add(ping){
  prune();const now=Date.now();if(!validPing(ping,now))return false;let entry=active.get(ping.id);
  if(entry?ping.revision<=entry.ping.revision:active.size>=PING_LIMIT)return false;
  if(!entry){
   const g=node('g',{'data-ping':ping.id}),glyph=node('g',{class:'ping-glyph'}),trailNode=node('g',{});
   glyph.append(node('circle',{r:diameter*.36,fill:'none',stroke:'#0a110e','stroke-width':diameter*.28}),node('circle',{r:diameter*.36,fill:'none',stroke:'#ffd786','stroke-width':diameter*.13}),node('circle',{r:diameter*.095,fill:'#fff4cf'}));
   g.append(glyph);plane.append(trailNode,g);entry={node:g,glyph,trailNode,trails:[]};active.set(ping.id,entry);
  }
  clearTimeout(entry.timer);addTrail(entry,ping,now);entry.ping={...ping,created:ping.created??entry.ping?.created??ping.started,point:[...ping.point]};entry.node.dataset.held=String(ping.held);positionEntry(entry);paint(entry,now);wake();
  entry.timer=setTimeout(()=>remove(ping.id),pingExpiry(entry.ping)-now);return true;
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
    press=null;const created=Date.now(),ping={id:crypto.randomUUID(),point:pointAt(event),held:true,revision:0,started:created,created};
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
 window.addEventListener('pagehide',()=>{cancel();for(const id of [...active.keys()])remove(id);cancelAnimationFrame(animationFrame);animationFrame=0;});
 return {add,cancelGesture:cancel,isHolding:()=>!!held,current(){prune();return [...active.values()].map(entry=>entry.ping);},position(viewBox,scale){plane.setAttribute('viewBox',viewBox);screenScale=scale;for(const entry of active.values()){positionEntry(entry);for(const trail of entry.trails)positionTrail(trail);}}};
}
