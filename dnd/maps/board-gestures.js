import {isTextEntry} from './keyboard.js?v=62';

export function installBoardGestures(){
  // Keep real editors native. The surrounding control board is not a document
  // selection surface (including browsers with caret browsing enabled).
  const editable=target=>{const element=target instanceof Element?target:target?.parentElement;return !!element&&isTextEntry(element);};
  document.addEventListener('selectstart',event=>{if(!editable(event.target))event.preventDefault();});
  document.addEventListener('dragstart',event=>{if(!editable(event.target)&&!event.target.closest('[draggable="true"]'))event.preventDefault();});
  document.addEventListener('dblclick',event=>{if(!editable(event.target))event.preventDefault();});
  document.addEventListener('keydown',event=>{if(event.key==='F7'&&!editable(event.target))event.preventDefault();},true);
}
