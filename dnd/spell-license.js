import {el,button} from './editor-dom.js?v=62';
import {showDialog} from './dialogs.js?v=62';
export const SRD_ATTRIBUTION='This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';
export const SRD_CHANGES='Changes: spell material reformatted and paginated as cards; PDF line wrapping, discretionary hyphens and small-cap glyph casing normalized. Rules wording is preserved.';
export function showSpellCredits(){
 const dialog=el('dialog',undefined,'spell-credits-dialog'),heading=el('div',undefined,'reference-heading'),close=button('×',()=>dialog.close()),body=el('div',undefined,'spell-credits-body');
 close.setAttribute('aria-label','Close spell credits');heading.append(el('h2','Spell library credits'),close);
 body.append(el('p',SRD_ATTRIBUTION),el('p',SRD_CHANGES),el('p','These notices apply to the SRD spell content. User imports and the application code are separate. No Wizards endorsement is claimed.'));
 for(const [title,url]of [['Official SRD','https://www.dndbeyond.com/srd'],['CC BY 4.0 license','https://creativecommons.org/licenses/by/4.0/legalcode'],['Credits and reuse','./spell-credits.html']]){const a=el('a',title);a.href=url;a.target='_blank';a.rel='noopener';body.append(a);}
 dialog.append(heading,body);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});showDialog(dialog);
}
