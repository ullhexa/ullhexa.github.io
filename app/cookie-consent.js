import { cookiePreference } from './cookie-preference.js?v=20261120-dialog';
import { bindPressActions } from './press-action.js?v=20261120-touch-taps';
const mounted = new WeakMap();

export function mountCookieConsent(doc) {
  if (mounted.has(doc)) return mounted.get(doc);
  if (doc.defaultView.top !== doc.defaultView.self) return;
  const preference = cookiePreference(doc);
  const isPrivacyPage = /^\/privacy(?:\/(?:index\.html)?)?$/.test(doc.defaultView.location.pathname);
  const style = doc.createElement('link');
  style.rel = 'stylesheet'; style.href = '/app/cookie-consent.css?v=20261121-capsule';
  doc.head.append(style);
  const panel = doc.createElement('dialog');
  panel.className = 'cookieBanner';
  panel.setAttribute('aria-labelledby', 'cookieTitle');
  panel.setAttribute('aria-describedby', 'cookieSummary');
  panel.innerHTML = `<div class="cookieScroll">
    <h2 id="cookieTitle" tabindex="-1" autofocus>Privacy &amp; cookies</h2>
    <div data-cookie-intro>
      <div id="cookieSummary">
        <p>This site uses cookies and similar technologies to provide the best user experience, optimal site functions, and additional optional services.</p>
        <p>Within our page we use PayPal buttons and links for donations and contributions. Embedded PayPal forms load only with your permission. PayPal uses your IP address and browser details for payments, security and usage measurement.</p>
        <p><a class="cookiePolicy" href="/privacy/" target="_blank" rel="noopener">Privacy Policy</a> · Change your choice anytime in Cookie settings.</p>
      </div>
    </div>
    <div data-cookie-settings-view hidden>
      <p id="cookieSettingsSummary">Choose which optional content can load. Your choice is saved on this device for 180 days. Free downloads work either way. See our <a class="cookiePolicy" href="/privacy/" target="_blank" rel="noopener">Privacy Policy</a> for details.</p>
      <button type="button" class="cookieBack" data-cookie-back>← Back</button>
      <div class="cookieCategories">
        <div class="cookieCategory">
          <details>
            <summary>Necessary storage</summary>
            <div class="cookieCategoryText">
              <p>Remembers your cookie choice and keeps requested features working. The preview PIN lasts for the tab session. GM Console and Studio Tools save work and settings on your device. This storage is not used for advertising.</p>
              <p>Saved work stays until cleared or replaced. Export a backup before clearing site data.</p>
            </div>
          </details>
          <span class="cookieAlways">Always active</span>
        </div>
        <div class="cookieCategory">
          <details>
            <summary>PayPal contribution forms</summary>
            <div class="cookieCategoryText">
              <p>Loads PayPal’s contribution forms and payment controls on plugin download pages. PayPal handles payments and security, and its SDK reports loading, errors and interactions to PayPal. Requests include your IP address, browser/device details and technical identifiers.</p>
              <p>The SDK uses <code>__paypal_storage__</code> on this site for an identifier and session state. This local storage has no fixed expiry; the internal session renews after 20 minutes. PayPal also uses its own cookies. See <a href="/privacy/#paypal-storage" target="_blank" rel="noopener">storage details</a>.</p>
              <p>Ull Hexa has no separate advertising or website analytics integration. PayPal’s wider policy also covers personalisation and advertising across its services. See its <a href="https://www.paypal.com/no/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer">privacy statement</a> and <a href="https://www.paypal.com/no/legalhub/paypal/cookie-full" target="_blank" rel="noopener noreferrer">cookie policy</a>.</p>
              <p>Turning this off leaves the forms unloaded. Free downloads and the separate link to PayPal still work.</p>
              <p>Saving this setting as off reloads pages where PayPal is running. This stops the embedded forms, but does not erase PayPal’s existing cookies or payment records. The 180-day period applies to your Ull Hexa choice, not PayPal’s cookies.</p>
            </div>
          </details>
          <button type="button" class="cookieToggle" role="switch" aria-checked="false" aria-label="Allow PayPal contribution forms" data-cookie-paypal><span aria-hidden="true"></span></button>
        </div>
      </div>
    </div>
  </div>
  <div class="cookieActions" data-cookie-intro-actions>
    <button type="button" data-cookie-customize>Cookie settings</button>
    <button type="button" data-cookie-reject>Reject all</button>
    <button type="button" data-cookie-accept>Accept all</button>
  </div>
  <div class="cookieActions" data-cookie-settings-actions hidden>
    <button type="button" data-cookie-accept>Accept all</button>
    <button type="button" data-cookie-reject>Reject all</button>
    <button type="button" data-cookie-save>Save preferences</button>
  </div>
  <button type="button" class="cookieClose" aria-label="Close without accepting optional cookies" data-cookie-close>×</button>`;
  doc.body.append(panel);
  const title = panel.querySelector('h2');
  const toggle = panel.querySelector('[data-cookie-paypal]');
  let returnFocus = null;
  const setDraft = value => toggle.setAttribute('aria-checked', value ? 'true' : 'false');
  const showView = view => {
    const settings = view === 'settings';
    panel.querySelector('[data-cookie-intro]').hidden = settings;
    panel.querySelector('[data-cookie-intro-actions]').hidden = settings;
    panel.querySelector('[data-cookie-settings-view]').hidden = !settings;
    panel.querySelector('[data-cookie-settings-actions]').hidden = !settings;
    title.textContent = settings ? 'Cookie settings' : 'Privacy & cookies';
    panel.setAttribute('aria-describedby', settings ? 'cookieSettingsSummary' : 'cookieSummary');
    panel.querySelector('.cookieScroll').scrollTop = 0;
    if (panel.open) title.focus({preventScroll:true});
  };
  const close = () => {
    if (!panel.open) return;
    panel.close();
    doc.documentElement.classList.remove('hasCookieDialog');
    const destination = returnFocus?.isConnected ? returnFocus : doc.querySelector('[data-cookie-settings]');
    destination?.focus({preventScroll:true});
    returnFocus = null;
  };
  const open = (trigger, view = 'settings') => {
    if (panel.open) { showView(view); return; }
    returnFocus = trigger || doc.activeElement;
    setDraft(preference.read()?.paypal === true);
    panel.querySelectorAll('details').forEach(detail => { detail.open = false; });
    panel.querySelector('[data-cookie-close]').setAttribute('aria-label', preference.read() ? 'Close cookie settings without saving' : 'Close without accepting optional cookies');
    showView(view);
    doc.documentElement.classList.add('hasCookieDialog');
    panel.showModal();
    title.focus({preventScroll:true});
  };
  const decide = value => { close(); preference.choose(value); };
  // Closing is never acceptance. Remember necessary-only on first dismissal;
  // when settings are reopened, discard unsaved edits and keep the prior choice.
  const dismiss = () => { if (preference.read()) close(); else decide(false); };
  panel.querySelectorAll('[data-cookie-accept]').forEach(button => button.addEventListener('click', () => decide(true)));
  panel.querySelectorAll('[data-cookie-reject]').forEach(button => button.addEventListener('click', () => decide(false)));
  panel.querySelector('[data-cookie-close]').addEventListener('click', dismiss);
  panel.querySelector('[data-cookie-customize]').addEventListener('click', () => showView('settings'));
  panel.querySelector('[data-cookie-back]').addEventListener('click', () => showView('intro'));
  toggle.addEventListener('click', () => setDraft(toggle.getAttribute('aria-checked') !== 'true'));
  panel.querySelector('[data-cookie-save]').addEventListener('click', () => decide(toggle.getAttribute('aria-checked') === 'true'));
  doc.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-cookie-settings]');
    if (trigger) { event.preventDefault(); open(trigger, 'settings'); }
  });
  panel.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  preference.subscribe(choice => { if (choice) close(); else if (!isPrivacyPage) open(null, 'intro'); });
  bindPressActions(doc.body, {selector:'.cookieBanner button, [data-cookie-settings]'});
  const api = {open, preference};
  mounted.set(doc, api);
  if (!preference.read() && !isPrivacyPage) open(null, 'intro');
  return api;
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountCookieConsent(document), {once:true});
  else mountCookieConsent(document);
}
