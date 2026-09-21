import {fetchJSON} from './resource-loading.js?v=41';
let pending;
export function loadSpells(){return pending??=fetchJSON('./spells/catalog.json?v=41').then(data=>data.spells).catch(error=>{pending=null;throw error;});}
