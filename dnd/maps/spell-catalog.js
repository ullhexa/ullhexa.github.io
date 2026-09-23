import {assetURL} from './local-assets.js?v=83';
import {normalizeUserSpells} from './user-spells.js?v=79';
export const FACTORY_COLLECTION='SRD 5.2.1';
export function createFactoryLoader(fetcher=(...args)=>fetch(...args)){
 let pending;
 return function loadFactory(){
  if(!pending)pending=(async()=>{
   const response=await fetcher(new URL('./spells/srd-5.2.1/catalog.json?v=1',import.meta.url));
   if(!response.ok)throw new Error('The SRD library could not load. Reopen Spells to retry.');
   const data=await response.json();
   if(data.collection!==FACTORY_COLLECTION||data.license!=='CC-BY-4.0'||data.spells?.length!==339)throw new Error('The SRD library catalog is incomplete.');
   return data.spells;
  })().catch(error=>{pending=null;throw error;});
  return pending;
 };
}
export const loadFactorySpells=createFactoryLoader();
export async function loadSpells(campaign,loadFactory=loadFactorySpells){
 const [factory,users]=await Promise.allSettled([
  loadFactory(),
  Promise.all(normalizeUserSpells(campaign?.userSpells).map(async s=>({...s,classes:[],user:true,cards:await Promise.all(s.cards.map(async c=>({...c,src:await assetURL(c.asset)})))})))
 ]);
 if(users.status==='rejected')throw users.reason;
 const catalog=[...(factory.status==='fulfilled'?factory.value:[]),...users.value];
 // Local User cards remain usable if the Factory request fails; the library
 // exposes the retryable error instead of presenting it as an empty catalog.
 Object.defineProperty(catalog,'factoryError',{value:factory.status==='rejected'?factory.reason.message:''});return catalog;
}
