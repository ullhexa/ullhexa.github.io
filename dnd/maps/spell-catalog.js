import {fetchJSON} from './resource-loading.js?v=35';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=35').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
