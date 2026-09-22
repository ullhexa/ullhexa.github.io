import {readSessionValue,writeSessionValue} from './session-storage.js?v=62';

// Board preferences belong to the session, not to the map document.
export function createControlPreferences(sessionKey){
  const key=`${sessionKey}:controls`;
  return {
    get(name){return readSessionValue(key)?.[name]===true;},
    set(name,value){writeSessionValue(key,{...(readSessionValue(key)||{}),[name]:value===true});}
  };
}
