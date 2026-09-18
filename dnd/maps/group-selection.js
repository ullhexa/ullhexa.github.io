// Shared desktop-style selection for all library group lists.
export function groupSelection(){
  let ids=new Set(),anchor=null,initialized=false;
  return {
    get ids(){return [...ids];}, has(id){return ids.has(id);},
    reset(id){ids=new Set(id?[id]:[]);anchor=id||null;initialized=!!id;},
    prune(order,fallback){ids=new Set([...ids].filter(id=>order.includes(id)));if(!initialized&&fallback){ids.add(fallback);initialized=true;}if(!order.includes(anchor))anchor=fallback||null;},
    click(id,event,order){
      initialized=true;
      if(event.shiftKey&&anchor&&order.includes(anchor)){const a=order.indexOf(anchor),b=order.indexOf(id),range=order.slice(Math.min(a,b),Math.max(a,b)+1);ids=new Set(event.metaKey||event.ctrlKey?[...ids,...range]:range);}
      else if(event.metaKey||event.ctrlKey){ids.has(id)?ids.delete(id):ids.add(id);anchor=id;}
      else {ids=new Set([id]);anchor=id;}
      return id;
    }
  };
}
