// Keep the group heading/actions outside the scrolling list in every library.
export function groupPanel(container,heading,create){
  const top=container.querySelector('.library-group-list')?.scrollTop||0;
  const list=document.createElement('div');list.className='library-group-list';
  list.tabIndex=0;list.setAttribute('role','region');list.setAttribute('aria-label',`${heading.textContent} list`);
  container.replaceChildren(heading,create,list);
  // Callers fill the list synchronously. Restore after its final height is known.
  queueMicrotask(()=>{if(list.isConnected)list.scrollTop=top;});
  return list;
}
