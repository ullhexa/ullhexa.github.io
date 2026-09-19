import {placeView} from './floors.js?v=29';
// A place's prepared visual states form an explicit, repeatable loop.
export function placeStep(place,state){
  const sequence=placeView(place,state).sequence||[];
  for(let i=sequence.length-1;i>0;i--)if(sequence[i].active.every(id=>state.active.includes(id)))return i;
  return 0;
}
export function setPlaceStep(place,state,index){
  const sequence=placeView(place,state).sequence||[];
  if(!sequence.length||!Number.isInteger(index)||index<0||index>=sequence.length)return state;
  const managed=new Set(sequence.flatMap(step=>step.active));
  return {...state,active:[...state.active.filter(id=>!managed.has(id)),...sequence[index].active],revision:state.revision+1};
}
export function cyclePlace(place,state,delta=1){
  const count=placeView(place,state).sequence?.length||1;
  return setPlaceStep(place,state,((placeStep(place,state)+delta)%count+count)%count);
}
