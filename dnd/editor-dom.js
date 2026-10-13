export function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
export function button(text,fn,cls){const b=el('button',text,cls);b.type='button';if(fn)b.addEventListener('click',fn);return b;}
export function label(text,input){const l=el('label',text,'field-label');l.append(input);return l;}
