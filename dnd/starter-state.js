import {formation} from './encounter-state.js?v=97';
import {normalizeMember,normalizeCampaign} from './combat-state.js?v=97';

// Called only for a fresh board, never while normalizing saves or empty groups.
export function withStarterEncounters(map,state){
 const positions=formation(map,state.party,6).slice(4);
 const monsters=positions.map((position,index)=>normalizeMember({id:`monster-${index+1}`,name:`Encounter ${index+1}`,portrait:index,position,size:5,visible:false},index,true));
 const campaign=normalizeCampaign({encounters:[{id:'encounter-default',name:'Encounter',members:monsters}],activeEncounter:'encounter-default'},state.roster);
 return {...state,monsters,campaign};
}
