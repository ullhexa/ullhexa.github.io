// Encounter history is transient; camera/grid choices survive ordinary undo/redo.
export function createHistory(limit=40){
  const past=[],future=[];
  const snapshot=(state,view)=>structuredClone({state,...(view?{view}:{})});
  const push=(list,item)=>{list.push(item);if(list.length>limit)list.shift();};
  function travel(from,to,current,currentView){
    if(!from.length)return null;
    const entry=from.pop();push(to,snapshot(current,entry.view?currentView:undefined));
    return {state:{...entry.state,...(!entry.view?{camera:current.camera,grid:current.grid,gridColor:current.gridColor}:{})},view:entry.view};
  }
  return {
    get canUndo(){return past.length>0;},get canRedo(){return future.length>0;},
    record(state,view){push(past,snapshot(state,view));future.length=0;},
    undo(state,view){return travel(past,future,state,view);},
    redo(state,view){return travel(future,past,state,view);}
  };
}
