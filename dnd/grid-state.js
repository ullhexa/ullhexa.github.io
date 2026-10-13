export const GRID_COLORS=['map','black','white','#9aa3a4','#e76660','#eea348','#e8cc60','#9a6d47','#6fb980','#a8cf62','#48b6ab','#78dce8','#58a9e0','#6971c9','#ad83df','#df8bba'];
export const MAX_GRID_THICKNESS=3;
export const validGridColor=value=>GRID_COLORS.includes(value);
export const validGridThickness=value=>Number.isInteger(value)&&value>=1&&value<=MAX_GRID_THICKNESS;
export const gridColor=(map,value)=>({map:map.grid.color||'#eff4d2',black:'#000000',white:'#ffffff'}[value]||value);
export const validGridOpacity=value=>Number.isFinite(value)&&value>=0&&value<=1;
export const normalizeGridOpacity=(value,color='map')=>validGridOpacity(value)?value:color==='map'?.3:.55;


// Earlier 1–8 px saves remain importable, clamped to the current 1–3 range.
export const storedGridThickness=value=>Number.isInteger(value)&&value>=1&&value<=8;
export const normalizeGridThickness=value=>storedGridThickness(value)?Math.min(MAX_GRID_THICKNESS,value):1;
