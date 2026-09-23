import {assetURL} from './local-assets.js?v=83';
import {normalizeUserSpells} from './user-spells.js?v=79';
// Intentionally empty until the owner clears a Factory collection for publication.
export const FACTORY_SPELLS=Object.freeze([]);
export async function loadSpells(campaign){return [...FACTORY_SPELLS,...await Promise.all(normalizeUserSpells(campaign?.userSpells).map(async s=>({...s,classes:[],user:true,cards:await Promise.all(s.cards.map(async c=>({...c,src:await assetURL(c.asset)})))})))];}
