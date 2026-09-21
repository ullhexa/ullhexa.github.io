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
export function boardIcon(kind){
  const paths={
    undo:'M7 7h8a6 6 0 0 1 0 12h-3M7 7l5-5M7 7l5 5',redo:'M17 7H9a6 6 0 0 0 0 12h3M17 7l-5-5M17 7l-5 5',
    grid:'M3 3h18v18H3ZM9 3v18M15 3v18M3 9h18M3 15h18',
    locked:'M6 10h12v11H6ZM8 10V6a4 4 0 0 1 8 0v4M12 14v3',unlocked:'M6 10h12v11H6ZM8 10V6a4 4 0 0 1 8 0M12 14v3',
    ruler:'m3 16 13-13 5 5L8 21ZM6 13l3 3M9 10l2 2M12 7l3 3M15 4l2 2',
    party:'M17 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM3 22v-3a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v3',
    players:'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM7 5a3 3 0 1 0 0 6M17 5a3 3 0 1 1 0 6M6 22v-5a6 6 0 0 1 12 0v5M3 20H1v-4a5 5 0 0 1 4-5M21 20h2v-4a5 5 0 0 0-4-5',
    dice:'m12 2 9 5v10l-9 5-9-5V7ZM3 7h18L12 22ZM12 2 8 7m4-5 4 5M3 17l5-10m13 10-5-10M3 17h18',
    shield:'M12 2 3 6v6c0 5 5 8 9 10 4-2 9-5 9-10V6Z',
    expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',collapse:'M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5'
  };return icon([{d:paths[kind]||paths.grid,fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'}]);
}
