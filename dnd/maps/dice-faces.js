import {drawDie,landingMesh,DICE_COLORS} from './dice-geometry.js?v=61';

const banks=new Map(),scratch=new Map();
const numberLift={4:6,6:2,8:2,10:4,12:2,20:2,100:0};
const numberRowCenter=52;
const canvasAt=ratio=>{const c=document.createElement('canvas');c.width=c.height=104*ratio;return c;};

// Build every numbered landing face of a chosen die type on its first roll. Reuse
// these small canvases across rolls; nothing waits for image or font downloads.
export function diceFaceBank(sides,ratio=Math.min(2,devicePixelRatio||1)){
 ratio=Math.floor(104*ratio)/104;const key=`${sides}:${ratio}`;if(banks.has(key))return banks.get(key);
 const shape=landingMesh(sides===100?10:sides),color=DICE_COLORS[sides],body=canvasAt(ratio);
 drawDie(body,shape,0,[0,0,0],false,color);
 const values=sides===100?[...Array.from({length:10},(_,i)=>String(i*10).padStart(2,'0')),...Array.from({length:10},(_,i)=>String(i))]:Array.from({length:sides},(_,i)=>String(i+1)),faces=new Map();
 for(const value of values){const ink=canvasAt(ratio),anchor=drawDie(ink,shape,value,[0,0,0],true,color,true,numberLift[sides]),image=canvasAt(ratio),ctx=image.getContext('2d');ctx.drawImage(body,0,0);ctx.drawImage(ink,0,0);faces.set(value,{body,ink,image,anchor:anchor.map(n=>n*ratio)});}
 const numberY=faces.values().next().value.anchor[1]/ratio;
 const bank={shape,color,faces,ratio,offsetY:numberRowCenter-numberY};banks.set(key,bank);return bank;
}

// Fade while the die is slowing to its landing pose, finishing with the roll.
// The number expands gently then returns to its exact resting size.
export function faceReveal(elapsed,duration){
 const progress=duration?Math.max(0,Math.min(1,(elapsed-(duration-256))/256)):1;
 return {alpha:progress*progress*(3-2*progress),scale:1+.09*Math.sin(Math.PI*progress)**2};
}

export function blendDieFace(canvas,plate,{alpha,scale}){
 if(alpha<=0)return;const ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);
 if(alpha>=1){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(plate.image,0,0);ctx.restore();return;}
 let layer=scratch.get(canvas.width);if(!layer){layer=canvasAt(canvas.width/104);scratch.set(canvas.width,layer);}const paint=layer.getContext('2d');paint.setTransform(1,0,0,1,0,0);paint.clearRect(0,0,layer.width,layer.height);paint.drawImage(plate.body,0,0);paint.save();paint.translate(...plate.anchor);paint.scale(scale,scale);paint.translate(-plate.anchor[0],-plate.anchor[1]);paint.drawImage(plate.ink,0,0);paint.restore();
 // A linear premultiplied crossfade preserves the translucent face opacity.
 ctx.globalCompositeOperation='destination-in';ctx.fillStyle=`rgba(0,0,0,${1-alpha})`;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;ctx.drawImage(layer,0,0);ctx.restore();
}
