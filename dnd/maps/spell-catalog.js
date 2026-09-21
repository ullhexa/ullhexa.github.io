import {fetchJSON} from './resource-loading.js?v=43';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=43').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
