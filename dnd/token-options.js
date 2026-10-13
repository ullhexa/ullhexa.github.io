export const elevation=value=>Number.isFinite(value)?Math.max(-100000,Math.min(100000,Math.round(value/5)*5)):0;
export const tokenName=member=>`${member.name}${elevation(member.elevation)?` [${elevation(member.elevation)}ft]`:''}`;
export function statusCursor(group,index,key,conditionCount=15){
  const next={...index};
  if(group==='letters'){
    const row=Math.floor(next.letters/3),last=Math.min(row*3+2,25);
    if(key==='ArrowRight'){if(next.letters===last)group='conditions';else next.letters++;}
    if(key==='ArrowLeft')next.letters=Math.max(row*3,next.letters-1);
    if(key==='ArrowUp')next.letters=Math.max(0,next.letters-3);
    if(key==='ArrowDown')next.letters=Math.min(25,next.letters+3);
  }else{
    if(key==='ArrowLeft')group='letters';
    if(key==='ArrowUp')next.conditions=Math.max(0,next.conditions-1);
    if(key==='ArrowDown')next.conditions=Math.min(conditionCount-1,next.conditions+1);
  }
  return {group,index:next};
}
