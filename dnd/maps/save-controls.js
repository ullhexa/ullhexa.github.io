import {showDialog} from './dialogs.js?v=62';
import {chooseSaveDestination,writeGameFile} from './file-destination.js?v=62';
import { MAX_SAVE_BYTES, parseSave, restoreSave, serializeSave, saveFilename } from './save-file.js?v=114';
const $=id=>document.getElementById(id);

export function createSaveControls({map,catalog,loadMap,bundle,getState,getView,getProject,applySave,announce}) {
  const submit=$('save-game-form').querySelector('[type=submit]');submit.textContent=typeof window.showSaveFilePicker==='function'?'Choose destination':'Download save';
  let lastName=`${map.title} - ${new Date().toLocaleDateString('en-CA')}`;
  function showError(message) {
    $('save-error-message').textContent=message;
    showDialog($('save-error-dialog'));
  }
  $('save-game').disabled=false;$('load-game').disabled=false;
  $('save-game').addEventListener('click',()=>{
    $('save-name').value=lastName;$('save-name-error').textContent='';showDialog($('save-game-dialog'));$('save-name').focus();$('save-name').select();
  });
  $('cancel-save').addEventListener('click',()=>$('save-game-dialog').close());
  $('save-game-form').addEventListener('submit',async event=>{
    event.preventDefault();if(submit.disabled)return;submit.disabled=true;
    try {
      const name=$('save-name').value.trim();
      const raw=serializeSave(map,getState(),name,getView(),undefined,getProject?.());
      const filename=saveFilename(name),handle=await chooseSaveDestination(filename);
      const data=bundle?await bundle.export(JSON.parse(raw)):raw;
      if(handle){await writeGameFile(handle,data);lastName=name;$('save-game-dialog').close();announce(`Saved: ${handle.name||filename}`);return;}
      const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      lastName=name;$('save-game-dialog').close();announce(`Download started: ${filename}`);
    } catch(error) {if(error.name==='AbortError')return;$('save-name-error').textContent=error.message;}finally{submit.disabled=false;}
  });
  $('load-game').addEventListener('click',()=>{const input=$('load-game-file');input.value='';input.click();});
  $('load-game-file').addEventListener('input',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    $('load-game').disabled=true;
    try {
      if(!/\.ullhexa$/i.test(file.name))throw new Error('Choose a file with the .ullhexa extension.');
      if(file.size>MAX_SAVE_BYTES)throw new Error('This save is too large. Choose an .ullhexa game save under 64 MB.');
      const data=parseSave(await file.text());
      const prepared=bundle?await bundle.validate(data):{catalog};
      const available=prepared.catalog;
      if(data.project?.maps.some(id=>!available.some(item=>item.id===id)))throw new Error('A map in this session’s prepared list is not available here.');
      const entry=available.find(item=>item.id===data.state.mapId);
      if(!entry)throw new Error('The map used by this save is not available in this library.');
      const target=entry.id===map.id?map:await loadMap(entry);
      const restored=restoreSave(target,data);
      if(bundle)await bundle.apply(prepared,data);
      await applySave(target,restored,data);
      lastName=data.name;
    } catch(error) {showError(error.message);}
    finally {$('load-game').disabled=false;event.target.value='';}
  });
  $('close-save-error').addEventListener('click',()=>$('save-error-dialog').close());
  return {showError,setName:name=>{lastName=name;}};
}
