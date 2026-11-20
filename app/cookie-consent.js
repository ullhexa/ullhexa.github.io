import { cookiePreference } from './cookie-preference.js?v=20261120-dialog';
import { bindPressActions } from './press-action.js?v=20261120-touch-taps';
const mounted = new WeakMap();

export function mountCookieConsent(doc) {
  if (mounted.has(doc)) return mounted.get(doc);
  if (doc.defaultView.top !== doc.defaultView.self) return;
  const preference = cookiePreference(doc);
  // The full notice must be readable before a visitor makes their choice.
  const isPrivacyPage = /^\/privacy(?:\/(?:index\.html)?)?$/.test(doc.defaultView.location.pathname);
  const style = doc.createElement('link');
  style.rel = 'stylesheet'; style.href = '/app/cookie-consent.css?v=20261120-dialog-size';
  doc.head.append(style);
  const panel = doc.createElement('dialog');
  panel.className = 'cookieBanner';
  panel.setAttribute('aria-labelledby', 'cookieTitle');
  panel.setAttribute('aria-describedby', 'cookieSummary');
  panel.innerHTML = `<div class="cookieScroll">
    <h2 id="cookieTitle" tabindex="-1" autofocus>Privacy &amp; cookies</h2>
    <div id="cookieSummary">
      <p>Necessary browser storage keeps this site working. <strong>Accept all</strong> also loads PayPal contribution forms, which receive your IP address and browser details and use cookies and similar storage.</p>
      <p>PayPal’s cookie policy covers payments, security, personalisation, measurement and advertising.</p>
    </div>
    <details class="cookieDetails">
      <summary>Read more</summary>
      <div class="cookieDetailText">
        <p>Your choice is saved on this device for 180 days. Free downloads work either way. <a href="/privacy/" target="_blank" rel="noopener">Privacy notice</a></p>
      </div>
    </details>
  </div>
  <div class="cookieActions">
    <button type="button" data-cookie-accept>Accept all</button>
    <button type="button" data-cookie-reject>Necessary only</button>
  </div>
  <button type="button" class="cookieClose" aria-label="Close cookie settings" data-cookie-close hidden>×</button>`;
  doc.body.append(panel);
  let returnFocus = null;
  const close = () => {
    if (!panel.open) return;
    panel.close();
    doc.documentElement.classList.remove('hasCookieDialog');
    const destination = returnFocus?.isConnected ? returnFocus : doc.querySelector('[data-cookie-settings]');
    destination?.focus({preventScroll:true});
    returnFocus = null;
  };
  const open = trigger => {
    if (panel.open) return;
    returnFocus = trigger || doc.activeElement;
    panel.querySelector('[data-cookie-close]').hidden = !preference.read();
    panel.querySelector('details').open = false;
    panel.querySelector('.cookieScroll').scrollTop = 0;
    doc.documentElement.classList.add('hasCookieDialog');
    panel.showModal();
    panel.querySelector('h2').focus({preventScroll:true});
  };
  const decide = value => { close(); preference.choose(value); };
  panel.querySelector('[data-cookie-accept]').addEventListener('click', () => decide(true));
  panel.querySelector('[data-cookie-reject]').addEventListener('click', () => decide(false));
  panel.querySelector('[data-cookie-close]').addEventListener('click', close);
  doc.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-cookie-settings]');
    if (trigger) { event.preventDefault(); open(trigger); }
  });
  // Escape is a rejection on first visit, never implicit acceptance.
  panel.addEventListener('cancel', event => {
    event.preventDefault();
    if (preference.read()) close(); else decide(false);
  });
  preference.subscribe(choice => { if (choice) close(); else if (!isPrivacyPage) open(); });
  bindPressActions(doc.body, {selector:'.cookieBanner button, [data-cookie-settings]'});
  const api = {open, preference};
  mounted.set(doc, api);
  if (!preference.read() && !isPrivacyPage) open();
  return api;
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountCookieConsent(document), {once:true});
  else mountCookieConsent(document);
}
