import {normalizeZoomSettings} from './zoom-settings.js?v=82';
import {readSessionValue,writeSessionValue} from './session-storage.js?v=62';

// Board preferences belong to the session, not to the map document.
export function createControlPreferences(sessionKey){
  const key=`${sessionKey}:controls`;
  return {
    getZoom(){return normalizeZoomSettings(readSessionValue(`${key}:zoom`));},
    setZoom(value){const next=normalizeZoomSettings(value);writeSessionValue(`${key}:zoom`,next);try{localStorage.setItem(`${key}:zoom`,JSON.stringify(next));}catch{}},
    get(name){return readSessionValue(key)?.[name]===true;},
    set(name,value){writeSessionValue(key,{...(readSessionValue(key)||{}),[name]:value===true});}
  };
}
