export const FOG_SIZES=[5,15,30]; // Legacy presets remain valid saved strokes.
export const FOG_FEATHER=2.5;
export const FOG_TEXTURES=[
  {id:'clouds',preview:'./assets/fog-of-war-preview.webp',name:'Clouds',url:'./assets/fog-of-war.png'},
  {id:'mist',preview:'./assets/fog-mist-preview.webp',name:'Silver mist',url:'./assets/fog-mist.webp'},
  {id:'storm',preview:'./assets/fog-storm-preview.webp',name:'Storm clouds',url:'./assets/fog-storm.webp'},
  {id:'haze',preview:'./assets/fog-haze-preview.webp',name:'Dust haze',url:'./assets/fog-haze.webp'}
];
export const fogAssetId=value=>typeof value==='string'&&/^asset-[a-zA-Z0-9-]{1,80}$/.test(value);
export const validFogSize=n=>Number.isInteger(n)&&n>=5&&n<=200&&n%5===0;
export const fogSize=n=>Math.max(5,Math.min(200,Math.round((Number(n)||15)/5)*5));
export const defaultFogSettings=()=>({texture:'clouds',size:15,zoom:1,x:.5,y:.5});
export const validFogSettings=s=>s===undefined||!!s&&typeof s==='object'&&(FOG_TEXTURES.some(t=>t.id===s.texture)||fogAssetId(s.texture))&&validFogSize(s.size)&&Number.isFinite(s.zoom)&&s.zoom>=1&&s.zoom<=5&&[s.x,s.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1);
export const normalizeFogSettings=s=>validFogSettings(s)&&s?{texture:s.texture,size:s.size,zoom:s.zoom,x:s.x,y:s.y}:defaultFogSettings();
export const validFogImage=i=>!!i&&fogAssetId(i.id)&&typeof i.name==='string'&&i.name.trim().length>0&&i.name.length<=80&&(i.preview===undefined||fogAssetId(i.preview)&&i.preview!==i.id);
export const validFogImages=value=>value===undefined||Array.isArray(value)&&value.length<=40&&value.every(validFogImage)&&new Set(value.map(i=>i.id)).size===value.length;
export const normalizeFogImages=value=>(Array.isArray(value)?value:[]).filter(validFogImage).filter((v,i,a)=>a.findIndex(n=>n.id===v.id)===i).slice(0,40).map(({id,name,preview})=>({id,name,...(preview?{preview}:{})}));
// Cover the map without stretching or uncovered edges. x/y select the crop
// within the available overflow, so even extreme panning stays filled.
export function fogCrop(iw,ih,w,h,{zoom=1,x=.5,y=.5}={}){
  const scale=Math.max(w/iw,h/ih)*Math.max(1,Math.min(5,zoom)),sw=w/scale,sh=h/scale;
  return {sx:(iw-sw)*Math.max(0,Math.min(1,x)),sy:(ih-sh)*Math.max(0,Math.min(1,y)),sw,sh};
}
export function paintFogTexture(context,image,w,h,settings){
  context.globalCompositeOperation='source-over';context.fillStyle='#38443f';context.fillRect(0,0,w,h);
  if(image){const {sx,sy,sw,sh}=fogCrop(image.naturalWidth||image.width,image.naturalHeight||image.height,w,h,settings);context.drawImage(image,sx,sy,sw,sh,0,0,w,h);}
}
export function normalizeFog(value){return (Array.isArray(value)?value:[]).slice(0,1500).filter(s=>s&&['paint','erase'].includes(s.tool)&&validFogSize(s.size)&&Array.isArray(s.points)&&s.points.length>0&&s.points.length<=4000&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1))).map(s=>({tool:s.tool,size:s.size,points:s.points.map(p=>[...p])}));}

export function removeFogImage(state,id){const images=state.campaign?.fogImages||[];if(!images.some(i=>i.id===id))return state;return {...state,campaign:{...state.campaign,fogImages:images.filter(i=>i.id!==id)},fogSettings:state.fogSettings.texture===id?{...state.fogSettings,texture:'clouds',zoom:1,x:.5,y:.5}:state.fogSettings};}
