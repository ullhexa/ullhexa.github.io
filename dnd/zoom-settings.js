export const MAX_MAP_ZOOM=20;
export const DEFAULT_ZOOM_SETTINGS=Object.freeze({maximum:3,wheel:100,step:25});
// About sixteen cells along the long side at the limit; keep smaller maps usable.
// Artwork pixel resolution and feet per square do not change the zoom allowance.
export function mapZoomSettings(map){
 const cells=Math.max(map?.width||0,map?.height||0)/map?.grid?.size;
 const maximum=Number.isFinite(cells)&&cells>0?Math.max(3,Math.min(MAX_MAP_ZOOM,Math.round(cells/16*4)/4)):3;
 return {...DEFAULT_ZOOM_SETTINGS,maximum};
}
export function normalizeZoomSettings(value={},defaults=DEFAULT_ZOOM_SETTINGS){
 const number=(key,min,max)=>Number.isFinite(value?.[key])?Math.max(min,Math.min(max,Math.round(value[key]*(key==='maximum'?100:1))/(key==='maximum'?100:1))):defaults[key];
 return {maximum:number('maximum',1,MAX_MAP_ZOOM),wheel:number('wheel',10,400),step:number('step',1,100)};
}
