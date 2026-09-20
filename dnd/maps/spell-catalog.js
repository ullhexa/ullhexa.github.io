import {fetchJSON} from './resource-loading.js?v=36';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=36').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
