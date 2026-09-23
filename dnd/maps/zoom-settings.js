export const MAX_MAP_ZOOM=20;
export const DEFAULT_ZOOM_SETTINGS=Object.freeze({maximum:3,wheel:100,step:25});
export function normalizeZoomSettings(value={}){
 const number=(key,min,max)=>Number.isFinite(value?.[key])?Math.max(min,Math.min(max,Math.round(value[key]*(key==='maximum'?100:1))/(key==='maximum'?100:1))):DEFAULT_ZOOM_SETTINGS[key];
 return {maximum:number('maximum',1,MAX_MAP_ZOOM),wheel:number('wheel',10,400),step:number('step',1,100)};
}
