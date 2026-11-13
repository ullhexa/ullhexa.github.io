import {normalizeZoomSettings,mapZoomSettings} from './zoom-settings.js?v=128';
import {readSessionValue,writeSessionValue} from './session-storage.js?v=62';

// Board preferences belong to the session, not to the map document.
export function createControlPreferences(sessionKey,map){
  const key=`${sessionKey}:controls`;
  const defaults=()=>mapZoomSettings(map);
  const adaptive=()=>{const value=readSessionValue(`${key}:zoom`);return !Number.isFinite(value?.maximum)||value.adaptiveMaximum===true;};
  function setZoom(value,{adaptiveMaximum=false}={}){const next=normalizeZoomSettings(value,defaults()),stored={...next,adaptiveMaximum};writeSessionValue(`${key}:zoom`,stored);try{localStorage.setItem(`${key}:zoom`,JSON.stringify(stored));}catch{}return next;}
  return {
    getZoom(){const value=readSessionValue(`${key}:zoom`),base=defaults();return normalizeZoomSettings(adaptive()?{...value,maximum:base.maximum}:value,base);},
    getZoomDefaults:defaults,
    isAdaptiveZoom:adaptive,
    setZoom,
    resetZoom(){return setZoom(defaults(),{adaptiveMaximum:true});},
    get(name){return readSessionValue(key)?.[name]===true;},
    set(name,value){writeSessionValue(key,{...(readSessionValue(key)||{}),[name]:value===true});}
  };
}
