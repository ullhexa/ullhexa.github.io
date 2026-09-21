export const GRID_COLORS=['map','black','white','#58a9e0','#9a6d47','#e76660','#eea348','#6fb980','#ad83df'];
export const MAX_GRID_THICKNESS=8;
export const validGridColor=value=>GRID_COLORS.includes(value);
export const validGridThickness=value=>Number.isInteger(value)&&value>=1&&value<=MAX_GRID_THICKNESS;
export const gridColor=(map,value)=>({map:map.grid.color||'#eff4d2',black:'#000000',white:'#ffffff'}[value]||value);

