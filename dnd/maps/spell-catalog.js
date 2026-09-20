import {fetchJSON} from './resource-loading.js?v=34';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=34').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
