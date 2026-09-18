// Priority rules shared by the whole DM desk. Text editing keeps native keys.
export function shortcutAction({key,typing=false,hp=false,story=false,conditions=false,modal=false,palette=false,shape=false,meta=false,ctrl=false,alt=false,shift=false,composing=false}){
  if(composing||modal||conditions||alt)return null;
  if(meta||ctrl){if(typing)return null;const letter=key.toLowerCase();if(letter==='z')return shift?'redo':'undo';return ctrl&&!meta&&!shift&&letter==='y'?'redo':null;}
  if(typing&&!hp)return null;
  if(hp&&key==='ArrowLeft')return 'damage';
  if(hp&&key==='ArrowRight')return 'heal';
  if(key===' '&&story)return 'next-story';
  if(key===' '||key==='ArrowDown')return 'next-turn';
  if(key==='ArrowUp')return 'previous-turn';
  if(!typing&&(key==='Delete'||key==='Backspace'))return palette?'close-palette':shape?'delete-shape':null;
  if(!typing&&key==='Escape')return palette?'close-palette':shape?'clear-shape':null;
  return null;
}

export function isTextEntry(target){return !!target.closest('textarea,[contenteditable=""],[contenteditable="true"],input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="color"])');}
