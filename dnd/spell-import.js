import {readRaster,rasterRecord,MAX_IMAGE_BYTES,IMAGE_ACCEPT,IMAGE_TYPES} from './image-import.js?v=62';
import {MAX_SPELL_PAGES,MAX_SPELL_TEXT} from './user-spells.js?v=79';
export const SPELL_ACCEPT=`.pdf,application/pdf,${IMAGE_ACCEPT}`;
export const SPELL_FILE_TYPES=`PDF · ${IMAGE_TYPES} · Up to 20 MB per file`;
const record=canvas=>({id:`asset-${crypto.randomUUID()}`,width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/png')});
const aborted=signal=>{if(signal?.aborted)throw new DOMException('Import cancelled.','AbortError');};
export function isPDF(bytes){return new TextDecoder('latin1').decode(new Uint8Array(bytes).slice(0,1024)).includes('%PDF-');}
let renderer;
async function pdfRenderer(){return renderer??=import('./vendor/pdfjs/pdf.min.mjs').then(pdf=>{pdf.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;return pdf;}).catch(error=>{renderer=null;throw error;});}
export async function importSpellFiles(files,{signal,onProgress=()=>{},remaining=MAX_SPELL_PAGES}={}){
 if(!files.length)throw new Error('Choose a PDF or image.');
 const records=[];
 for(const file of files){
  aborted(signal);if(!file.size||file.size>MAX_IMAGE_BYTES)throw new Error('Choose a PDF or image under 20 MB.');
  const header=await file.slice(0,1024).arrayBuffer();aborted(signal);
  if(!isPDF(header)){
   if(records.length>=remaining)throw new Error(`A spell can contain up to ${MAX_SPELL_PAGES} cards.`);
   const raster=await readRaster(file);try{aborted(signal);records.push(rasterRecord(raster));}finally{raster.dispose();}
   onProgress(`${records.length} card${records.length===1?'':'s'} ready`);continue;
  }
  const pdf=await pdfRenderer();aborted(signal);
  const loading=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,stopAtErrors:true,
   cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,
   standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,
   wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href});
  const cancel=()=>{void loading.destroy();};signal?.addEventListener('abort',cancel,{once:true});
  try{
   const pdfDocument=await loading.promise;aborted(signal);
   if(records.length+pdfDocument.numPages>remaining)throw new Error(`A spell can contain up to ${MAX_SPELL_PAGES} cards. Split the PDF into smaller files.`);
   for(let i=1;i<=pdfDocument.numPages;i++){
    aborted(signal);onProgress(`Reading ${file.name} · ${i} / ${pdfDocument.numPages}`);
    const page=await pdfDocument.getPage(i),base=page.getViewport({scale:1}),scale=2400/Math.max(base.width,base.height),viewport=page.getViewport({scale});
    if(!Number.isFinite(scale)||base.width<=0||base.height<=0)throw new Error('This PDF has an invalid page size.');
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
    try{await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)',annotationMode:pdf.AnnotationMode.DISABLE}).promise;aborted(signal);records.push(record(canvas));}finally{page.cleanup();canvas.width=canvas.height=1;}
    await new Promise(resolve=>setTimeout(resolve,0));
   }
  }catch(error){aborted(signal);if(error.name==='PasswordException')throw new Error('This PDF is password protected. Upload an unlocked copy.');if(['InvalidPDFException','UnknownErrorException'].includes(error.name))throw new Error('This PDF could not be read. Try exporting it again.');throw error;}
  finally{signal?.removeEventListener('abort',cancel);await loading.destroy();}
 }
 return records;
}
// Render original typed text to the same image-page interface used by every card viewer.
// Store the source text separately, so edits never depend on reading pixels back.
export function wrapCardText(context,text,width){
 const lines=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  if(!paragraph){lines.push('');continue;}
  let line='';
  for(const part of paragraph.match(/\S+\s*|\s+/g)||[]){
   if(context.measureText(line+part).width<=width){line+=part;continue;}
   if(line){lines.push(line.trimEnd());line='';}
   for(const char of part){if(line&&context.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
  }
  lines.push(line.trimEnd());
 }
 return lines;
}
export function renderTypedSpell({title,text,level,school}){
 if(!text.trim())throw new Error('Write the spell text first.');if(text.length>MAX_SPELL_TEXT)throw new Error('Spell text is too long.');
 const canvas=document.createElement('canvas');canvas.width=750;canvas.height=1050;const ctx=canvas.getContext('2d');
 ctx.font='bold 32px Georgia, serif';const heading=wrapCardText(ctx,title,654),meta=[level==null?'':level?`Level ${level}`:'Cantrip',school].filter(Boolean).join(' · ');
 const bodyTop=60+heading.length*39+(meta?44:18);ctx.font='24px Georgia, serif';const lines=wrapCardText(ctx,text,654),perPage=Math.max(1,Math.floor((972-bodyTop)/33)),pages=[];
 for(let offset=0;offset<lines.length;offset+=perPage){
  ctx.fillStyle='#fffefc';ctx.fillRect(0,0,750,1050);ctx.strokeStyle='#393e38';ctx.lineWidth=2;ctx.strokeRect(18,18,714,1014);ctx.fillStyle='#121712';ctx.textBaseline='top';ctx.font='bold 32px Georgia, serif';heading.forEach((line,i)=>ctx.fillText(line,48,48+i*39));
  if(meta){ctx.font='18px Arial, sans-serif';ctx.fillText(meta,48,60+heading.length*39);}
  ctx.font='24px Georgia, serif';lines.slice(offset,offset+perPage).forEach((line,i)=>ctx.fillText(line,48,bodyTop+i*33));ctx.font='16px Arial, sans-serif';ctx.textAlign='right';ctx.fillText(`${pages.length+1} / ${Math.ceil(lines.length/perPage)}`,702,995);ctx.textAlign='left';pages.push(record(canvas));
 }
 canvas.width=canvas.height=1;return pages;
}
