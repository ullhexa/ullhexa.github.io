// A casual-access gate for this public static prototype, not server authentication.
// Assets and source remain public. Never use this as a paid-content access check.
const pinDigest='c6f5c46f9e3daea6422f8a004682a5de6f6946a9cfb7c9ca71912c029a981403';
const storageKey='ullhexa:board-access:v1';
const grantKey='ullhexaBoardAccess';

function hasAccess(){
  try{if(sessionStorage.getItem(storageKey)===pinDigest)return true;}catch{}
  // Keep embedded maps and the DM-opened player window usable when storage is blocked.
  for(const host of [window.parent,window.opener]){
    try{if(host&&host!==window&&host.location.origin===location.origin&&host[grantKey]===pinDigest)return true;}catch{}
  }
  return false;
}

function grantAccess(){
  window[grantKey]=pinDigest;
  try{sessionStorage.setItem(storageKey,pinDigest);}catch{}
}

async function waitForPIN(){
  const gate=document.getElementById('access-gate');
  if(!hasAccess()){
    const form=document.getElementById('access-form');
    const input=document.getElementById('access-pin');
    const submit=document.getElementById('access-enter');
    const lifecycle=new AbortController(),options={signal:lifecycle.signal};
    gate.removeAttribute('open');
    gate.showModal();
    input.disabled=false;
    input.focus({preventScroll:true});
    gate.addEventListener('cancel',event=>event.preventDefault(),options);
    await new Promise(resolve=>{
      let checking=false;
      input.addEventListener('input',()=>{
        input.value=input.value.replace(/\D/g,'').slice(0,4);
        input.removeAttribute('aria-invalid');
        input.setAttribute('aria-label','PIN');
        submit.disabled=checking||input.value.length!==4;
      },options);
      form.addEventListener('submit',async event=>{
        event.preventDefault();
        if(checking||input.value.length!==4)return;
        checking=true;submit.disabled=true;input.readOnly=true;
        try{
          const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.value));
          const value=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
          if(value===pinDigest){resolve();return;}
          input.setAttribute('aria-invalid','true');
          input.setAttribute('aria-label','Incorrect PIN');
        }catch{
          input.setAttribute('aria-invalid','true');
          input.setAttribute('aria-label','PIN could not be checked');
        }
        input.value='';input.readOnly=false;checking=false;
        input.focus({preventScroll:true});
      },options);
    });
    lifecycle.abort();
  }
  grantAccess();
  gate.remove();
  document.documentElement.classList.remove('access-locked');
}

await waitForPIN();
await import('./app.js?v=114');
