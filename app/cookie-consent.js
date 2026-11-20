import { cookiePreference } from './cookie-preference.js?v=20261120-sitewide';
import { bindPressActions } from './press-action.js?v=20261120-touch-taps';
const mounted = new WeakMap();

export function mountCookieConsent(doc) {
  if (mounted.has(doc)) return mounted.get(doc);
  // Guides embedded in the site's document modal share the parent's controls.
  if (doc.defaultView.top !== doc.defaultView.self) return;
  const preference = cookiePreference(doc);
  const style = doc.createElement('link');
  style.rel = 'stylesheet'; style.href = '/app/cookie-consent.css?v=20261120-sitewide';
  doc.head.append(style);
  const panel = doc.createElement('section');
  panel.className = 'cookieBanner';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'cookieTitle');
  panel.hidden = true;
  panel.innerHTML = `<div class="cookieCopy">
    <h2 id="cookieTitle">Cookies &amp; privacy</h2>
    <p>Necessary browser storage keeps the site working. Optional PayPal panels send your IP address and browser details to PayPal and allow its cookies and similar storage for payment and security, with possible personalisation, measurement and advertising depending on your PayPal settings.</p>
    <p>You can use the site and download free without accepting. Your choice applies across this site for 180 days. Change it anytime in Cookie settings. <a href="/privacy/#cookies">Privacy details</a></p>
    </div><div class="cookieActions">
      <button type="button" data-cookie-accept>Accept optional cookies</button>
      <button type="button" data-cookie-reject>Necessary only</button>
      <button type="button" class="cookieClose" aria-label="Close cookie settings" data-cookie-close hidden>×</button>
    </div>`;
  doc.body.append(panel);
  let returnFocus = null;
  const close = () => {
    const focusedInside = panel.contains(doc.activeElement);
    panel.hidden = true;
    const destination = returnFocus?.isConnected ? returnFocus : focusedInside ? doc.querySelector('[data-cookie-settings]') : null;
    destination?.focus({preventScroll:true});
    returnFocus = null;
  };
  const open = trigger => {
    returnFocus = trigger || null;
    panel.querySelector('[data-cookie-close]').hidden = !preference.read();
    panel.hidden = false;
    if (trigger) panel.querySelector('[data-cookie-reject]').focus({preventScroll:true});
  };
  const decide = value => { close(); preference.choose(value); };
  panel.querySelector('[data-cookie-accept]').addEventListener('click', () => decide(true));
  panel.querySelector('[data-cookie-reject]').addEventListener('click', () => decide(false));
  panel.querySelector('[data-cookie-close]').addEventListener('click', close);
  doc.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-cookie-settings]');
    if (trigger) { event.preventDefault(); open(trigger); }
  });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (preference.read()) close(); else decide(false);
  });
  preference.subscribe(choice => { if (choice) close(); else open(); });
  bindPressActions(doc.body, {selector:'.cookieBanner button, [data-cookie-settings]'});
  const api = {open, preference};
  mounted.set(doc, api);
  if (!preference.read()) open();
  return api;
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountCookieConsent(document), {once:true});
  else mountCookieConsent(document);
}
