export const identityTransform=()=>[1,0,0,1,0,0];
export function transformPoint([a,b,c,d,e,f],[x,y]){return [a*x+c*y+e,b*x+d*y+f];}
export function composeTransform([a,b,c,d,e,f],[g,h,i,j,k,l]){return [a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f];}
export function imageOperation(kind,[w,h]){
  if(kind==='right')return {matrix:[0,1,-1,0,h,0],dimensions:[h,w]};
  if(kind==='left')return {matrix:[0,-1,1,0,0,w],dimensions:[h,w]};
  if(kind==='x')return {matrix:[-1,0,0,1,w,0],dimensions:[w,h]};
  if(kind==='y')return {matrix:[1,0,0,-1,0,h],dimensions:[w,h]};
  throw new Error('Unknown map orientation.');
}
