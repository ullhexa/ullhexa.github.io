import {storyCatalog,validStoryAsset,validStoryAssets} from './story-assets.js?v=97';
import { STORY_SCENES } from './story-scenes.js?v=62';
const ids=STORY_SCENES.map(scene=>scene.id);
const validId=value=>typeof value==='string'&&/^[-a-zA-Z0-9]{1,80}$/.test(value);
const list=value=>Array.isArray(value)&&value.length<=100&&value.every(validId)&&new Set(value).size===value.length;

export function validProject(value) {
  return !!value&&value.version===1&&['battle','story'].includes(value.mode)&&validStoryAssets(value.storyAssets)&&list(value.maps)&&value.maps.length>0&&list(value.stories)&&value.stories.length>0&&value.stories.every(id=>storyCatalog(value).some(s=>s.id===id))&&value.stories.includes(value.vibe)&&validSceneGroups(value,'maps')&&validSceneGroups(value,'stories');
}
export function normalizeProject(value,catalog,activeId) {
  const maps=Array.isArray(value?.maps)?[...new Set(value.maps)].filter(id=>catalog.some(map=>map.id===id)):[];
  if(!maps.includes(activeId))maps.push(activeId);
  const storyAssets=Array.isArray(value?.storyAssets)?value.storyAssets.filter(validStoryAsset).filter((s,i,a)=>a.findIndex(v=>v.id===s.id)===i).slice(0,100):[];
  const allowedStories=storyCatalog({storyAssets}).map(s=>s.id);
  const stories=Array.isArray(value?.stories)?[...new Set(value.stories)].filter(id=>allowedStories.includes(id)):[];
  if(!stories.length)stories.push('embers');
  const result={...(storyAssets.length?{storyAssets}:{}),version:1,mode:value?.mode==='story'?'story':'battle',maps,stories,vibe:stories.includes(value?.vibe)?value.vibe:stories[0]};
  for(const kind of ['maps','stories']){const {key,active}=sceneKeys(kind),allowed=kind==='maps'?catalog.map(m=>m.id):allowedStories,seen=new Set();const groups=Array.isArray(value?.[key])?value[key]:[{id:`${kind}-default`,name:kind==='maps'?'Map session':'Story session',entries:result[kind]}];result[key]=groups.slice(0,20).filter(g=>g&&validId(g.id)&&!seen.has(g.id)&&seen.add(g.id)).map(g=>({id:g.id,name:typeof g.name==='string'?g.name.trim().slice(0,48)||'Session':'Session',entries:[...new Set(Array.isArray(g.entries)?g.entries:[])].filter(id=>allowed.includes(id)).slice(0,100)}));result[active]=value?.[active]===null?null:result[key].some(g=>g.id===value?.[active])?value[active]:result[key][0]?.id||null;result[key]=result[key].map(g=>g.id===result[active]?{...g,entries:result[kind]}:g);}
  return result;
}
export function reorder(items,id,direction){const result=[...items],index=result.indexOf(id),target=index+direction;if(index>=0&&target>=0&&target<result.length)[result[index],result[target]]=[result[target],result[index]];return result;}
export function validPresentation(value,catalog){return !!value&&(value.mapContent===undefined||(typeof value.mapContent==='string'&&value.mapContent.length<=2000))&&['battle','story'].includes(value.mode)&&(ids.includes(value.vibe)||(validStoryAsset(value.storyAsset)&&value.storyAsset.id===value.vibe))&&catalog.some(map=>map.id===value.mapId)&&Number.isSafeInteger(value.revision)&&value.revision>=0&&Number.isSafeInteger(value.sceneRevision)&&value.sceneRevision>=0;}
export function sceneCanShow(presentation,scene){return presentation?.mode==='battle'&&scene?.mapId===presentation.mapId&&(scene.content||'')===(presentation.mapContent||'')&&scene.ready&&scene.revision>=presentation.sceneRevision;}

export function sceneKeys(kind){return kind==='maps'?{key:'mapGroups',active:'activeMapGroup'}:{key:'storyGroups',active:'activeStoryGroup'};}
function validSceneGroups(value,kind){const{key,active}=sceneKeys(kind);if(value[key]===undefined)return value[active]===undefined;return Array.isArray(value[key])&&value[key].length<=20&&new Set(value[key].map(g=>g?.id)).size===value[key].length&&value[key].every(g=>g&&validId(g.id)&&typeof g.name==='string'&&g.name.trim()&&g.name.length<=48&&list(g.entries)&&(kind!=='stories'||g.entries.every(id=>storyCatalog(value).some(s=>s.id===id))))&&(value[active]===null||value[key].some(g=>g.id===value[active]));}
export function updateSceneGroup(project,kind,id,patch){const{key,active}=sceneKeys(kind);const groups=project[key].map(g=>g.id===id?{...g,...patch}:g),g=groups.find(g=>g.id===id);return {...project,[key]:groups,...(g&&project[active]===id&&patch.entries?{[kind]:g.entries,...(kind==='stories'&&!g.entries.includes(project.vibe)?{vibe:g.entries[0]||'embers'}:{})}:{})};}
export function activateSceneGroup(project,kind,id){const{key,active}=sceneKeys(kind),g=project[key].find(g=>g.id===id);return g?{...project,[active]:id,[kind]:[...g.entries],...(kind==='stories'?{vibe:g.entries.includes(project.vibe)?project.vibe:g.entries[0]||'embers'}:{})}:project;}
export function deleteSceneGroup(project,kind,id){const{key,active}=sceneKeys(kind),groups=project[key].filter(g=>g.id!==id),next={...project,[key]:groups};if(project[active]!==id)return next;if(groups.length)return activateSceneGroup(next,kind,groups[0].id);return {...next,[active]:null};}
export function projectMapIds(project,activeId){return [...new Set([...(project?.maps||[]),...(project?.mapGroups||[]).flatMap(g=>g.entries),activeId].filter(Boolean))];}
