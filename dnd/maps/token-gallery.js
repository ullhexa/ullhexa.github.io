import {el,button} from './editor-dom.js?v=28';
import {assetURL} from './local-assets.js?v=28';
import {editTokenImage} from './token-image-editor.js?v=28';
export function tokenGallery({kind,mode,setMode,selected,setSelected,getState,commit,onApply,onRefresh,factory,error}){
  const root=el('section',undefined,'token-gallery'),bar=el('div',undefined,'avatar-options source-tabs');
  for(const source of ['Factory','User']){const b=button(source,()=>{setMode(source.toLowerCase());onRefresh();});b.setAttribute('aria-pressed',mode===source.toLowerCase());bar.append(b);}
  root.append(bar);const entries=getState().campaign.userTokens[kind];
  if(mode==='factory'){root.append(factory());return root;}
  const remove=button('Delete token',()=>{const s=getState();commit({...s,campaign:{...s.campaign,userTokens:{...s.campaign.userTokens,[kind]:entries.filter(t=>t.id!==selected)}}},'User token deleted.');setSelected(null);onRefresh();},'delete-token');remove.disabled=!entries.some(t=>t.id===selected);bar.append(remove);
  const grid=el('div',undefined,kind==='items'?'item-catalog user-token-grid':`portrait-options library-portraits user-token-grid ${kind}-user-grid`),upload=el('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.hidden=true;upload.setAttribute('aria-label',`Create ${kind} token image`);root.append(upload,grid);
  const create=button('Create token',()=>{upload.value='';upload.click();},'portrait-option create-token');grid.append(create);
  upload.addEventListener('input',async()=>{const file=upload.files?.[0];if(!file)return;create.disabled=true;try{if(entries.length>=500)throw new Error('Up to 500 user tokens per library.');const image=await editTokenImage(file,{square:kind==='items'});if(!image)return;const token={id:crypto.randomUUID(),asset:image.id,name:file.name.replace(/\.[^.]+$/,'').slice(0,80)||'Token'},s=getState();commit({...s,campaign:{...s.campaign,userTokens:{...s.campaign.userTokens,[kind]:[...s.campaign.userTokens[kind],token]}}},'User token created.');setSelected(token.id);onApply(token);onRefresh();}catch(e){error.textContent=e.message;}finally{create.disabled=false;}});
  for(const token of entries){const b=button('',()=>{setSelected(token.id);onApply(token);onRefresh();},'portrait-option');b.setAttribute('aria-label',token.name);b.title=token.name;b.setAttribute('aria-pressed',token.id===selected);const img=el('img');img.alt='';assetURL(token.asset).then(url=>img.src=url).catch(e=>error.textContent=e.message);b.append(img);grid.append(b);}
  return root;
}
