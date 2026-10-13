// Request the destination before asynchronous image bundling consumes activation.
export async function chooseSaveDestination(filename,host=window){
  if(typeof host.showSaveFilePicker!=='function')return null;
  try{return await host.showSaveFilePicker({id:'ullhexa-game',suggestedName:filename,types:[{description:'Ull Hexa game',accept:{'application/json':['.ullhexa']}}]});}
  catch(error){if(['SecurityError','NotSupportedError'].includes(error.name))return null;throw error;}
}
export async function writeGameFile(handle,data){const stream=await handle.createWritable();try{await stream.write(data);await stream.close();}catch(error){try{await stream.abort();}catch{}throw error;}}
