import {fetchJSON} from './resource-loading.js?v=38';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=38').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
