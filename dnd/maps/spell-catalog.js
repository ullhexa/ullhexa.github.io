import {fetchJSON} from './resource-loading.js?v=40';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=40').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
