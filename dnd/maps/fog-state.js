export const FOG_SIZES=[5,15,30];
export const FOG_FEATHER=2.5;
export function normalizeFog(value){return (Array.isArray(value)?value:[]).slice(0,1500).filter(s=>s&&['paint','erase'].includes(s.tool)&&FOG_SIZES.includes(s.size)&&Array.isArray(s.points)&&s.points.length>0&&s.points.length<=4000&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1))).map(s=>({tool:s.tool,size:s.size,points:s.points.map(p=>[...p])}));}
