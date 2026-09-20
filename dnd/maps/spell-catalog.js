import {fetchJSON} from './resource-loading.js?v=33';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=33').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
