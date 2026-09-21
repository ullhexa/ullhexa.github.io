const NS='http://www.w3.org/2000/svg';
export function icon(paths,className=''){const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');if(className)svg.setAttribute('class',className);for(const attrs of paths){const p=document.createElementNS(NS,attrs.tag||'path');for(const [key,value]of Object.entries(attrs))if(key!=='tag')p.setAttribute(key,value);svg.append(p);}return svg;}
export function statIcon(){return icon([{d:'M5 2h11l3 3v17H5z',fill:'currentColor'},{d:'M8 8h8M8 12h8M8 16h6',fill:'none',stroke:'#15221b','stroke-width':1.6}], 'stat-icon');}
export function chevronIcon(){return icon([{d:'m6 9 6 6 6-6',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'}]);}
export function orientationIcon(kind){if(kind==='left'||kind==='right')return icon([{d:kind==='left'?'M19 5H9a4 4 0 0 0-4 4v10m-4-4 4 4 4-4':'M5 5h10a4 4 0 0 1 4 4v10m-4-4 4 4 4-4',fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'}]);const svg=icon([{d:'M12 3 2 21h20z',fill:'none',stroke:'currentColor','stroke-width':1.6},{d:'M12 3 2 21h10z',fill:'currentColor','fill-opacity':.3},{d:'M12 1v22',stroke:'currentColor','stroke-width':1.6}]);if(kind==='y')svg.style.transform='rotate(90deg)';return svg;}

export function visibilityIcon(visible){return icon([{d:visible?'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0':'M3 9q9 10 18 0M5 12l-2 3m7-1-1 4m5-4 1 4m4-6 2 3',fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'}]);}
export function fogIcon(kind='cloud'){
  const paths={cloud:'M6 18a4 4 0 0 1-.7-7.94 6 6 0 0 1 11.58-1.45A4.75 4.75 0 0 1 18 18Z',paint:'m9 14 8-10a2.12 2.12 0 0 1 3 3l-10 8M8 13c-4-1-3 5-6 6 4 3 9 1 8-4Z',erase:'m3 13 9-9a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-7 8H8l-5-4a2 2 0 0 1 0-3ZM8 8l9 9M13 20h9'};
  return icon([{d:paths[kind]||paths.cloud,fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'}]);
}
