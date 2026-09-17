import { STORY_SCENES } from './story-scenes.js?v=15';
const ids=STORY_SCENES.map(scene=>scene.id);
const validId=value=>typeof value==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(value);
const list=value=>Array.isArray(value)&&value.length<=100&&value.every(validId)&&new Set(value).size===value.length;

export function validProject(value) {
  return !!value&&value.version===1&&['battle','story'].includes(value.mode)&&list(value.maps)&&value.maps.length>0&&list(value.stories)&&value.stories.length>0&&value.stories.every(id=>ids.includes(id))&&value.stories.includes(value.vibe);
}
export function normalizeProject(value,catalog,activeId) {
  const maps=Array.isArray(value?.maps)?[...new Set(value.maps)].filter(id=>catalog.some(map=>map.id===id)):[];
  if(!maps.includes(activeId))maps.push(activeId);
  const stories=Array.isArray(value?.stories)?[...new Set(value.stories)].filter(id=>ids.includes(id)):[];
  if(!stories.length)stories.push('embers');
  return {version:1,mode:value?.mode==='story'?'story':'battle',maps,stories,vibe:stories.includes(value?.vibe)?value.vibe:stories[0]};
}
export function reorder(items,id,direction){const result=[...items],index=result.indexOf(id),target=index+direction;if(index>=0&&target>=0&&target<result.length)[result[index],result[target]]=[result[target],result[index]];return result;}
export function validPresentation(value,catalog){return !!value&&['battle','story'].includes(value.mode)&&ids.includes(value.vibe)&&catalog.some(map=>map.id===value.mapId)&&Number.isSafeInteger(value.revision)&&value.revision>=0&&Number.isSafeInteger(value.sceneRevision)&&value.sceneRevision>=0;}
export function sceneCanShow(presentation,scene){return presentation?.mode==='battle'&&scene?.mapId===presentation.mapId&&scene.ready&&scene.revision>=presentation.sceneRevision;}
