import {STORY_SCENES} from './story-scenes.js?v=44';
import {assetId} from './combat-state.js?v=44';

export function validStoryAsset(value){return !!value&&typeof value.id==='string'&&/^story-[-a-zA-Z0-9]{1,70}$/.test(value.id)&&typeof value.title==='string'&&!!value.title.trim()&&value.title.length<=80&&assetId(value.asset);}
export function validStoryAssets(value){return value===undefined||(Array.isArray(value)&&value.length<=100&&value.every(validStoryAsset)&&new Set(value.map(s=>s.id)).size===value.length);}
export function storyCatalog(project){return [...STORY_SCENES,...(project?.storyAssets||[]).filter(validStoryAsset)];}
export function nextStory(project){const list=project.stories,index=list.indexOf(project.vibe);return list.length?list[(index+1)%list.length]:project.vibe;}
