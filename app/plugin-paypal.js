import { cookiePreference } from './cookie-preference.js?v=20261120-dialog';
import { escapeHTML as html } from './plugin-catalogue.js?v=20261116-public-downloads';

// Public SDK identifier supplied by the owner. Each product owns its own ticket.
const sdkUrl = 'https://www.paypal.com/sdk/js?client-id=BAAeDIej6ICgC_DArq071R4PtdFHOr81DjJ22RhpshQ-JTc7czYm-gtYIvp2wcgJwX4d7MHrwVOioUOReE&components=hosted-buttons&disable-funding=venmo&currency=USD';
const sdkLoads = new WeakMap();
const mounts = new WeakMap();
const ticketFor = plugin => plugin.priceUSD === 0 && /^[A-Z0-9]+$/.test(plugin.paypal?.hostedButtonId || '') ? plugin.paypal.hostedButtonId : null;

export function renderPluginPayPal(plugin) {
  const ticket = ticketFor(plugin);
  if (!ticket) return '';
  const first = plugin.images[0];
  return `<section class="pluginPayPal" aria-label="Optional contribution for ${html(plugin.title)}" data-plugin-paypal>
    <div class="pluginPayPalPanel">
      <div data-paypal-preview>${first ? `<img class="pluginPayPalPreview" src="${html(first.src)}" alt="${html(first.alt)}">` : ''}</div>
      <div id="paypal-container-${ticket}" data-paypal-buttons></div>
      <p class="pluginPayPalStatus" role="status" data-paypal-status hidden></p>
      <p class="pluginPayPalExternal"><a class="pluginPayPalFallback" data-paypal-fallback href="https://www.paypal.com/ncp/payment/${ticket}" target="_blank" rel="noopener noreferrer">Open on PayPal instead <span aria-hidden="true">↗</span></a></p>
    </div>
  </section>`;
}

function loadSdk(doc) {
  if (doc.defaultView.paypal?.HostedButtons) return Promise.resolve(doc.defaultView.paypal);
  if (sdkLoads.has(doc)) return sdkLoads.get(doc);
  const script = doc.createElement('script');
  script.src = sdkUrl;
  script.async = true;
  const loading = new Promise((resolve, reject) => {
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.onload = script.onerror = null;
      if (error) {
        script.remove();
        sdkLoads.delete(doc);
        reject(error);
      } else resolve(doc.defaultView.paypal);
    };
    const timeout = setTimeout(() => finish(new Error('PayPal loading timed out')), 15000);
    script.onload = () => finish(doc.defaultView.paypal?.HostedButtons ? null : new Error('PayPal buttons unavailable'));
    script.onerror = () => finish(new Error('PayPal could not load'));
  });
  sdkLoads.set(doc, loading);
  doc.head.append(script);
  return loading;
}

export function mountPluginPayPal(root, plugin, preference = cookiePreference(root.ownerDocument)) {
  const ticket = ticketFor(plugin);
  const section = root.querySelector('[data-plugin-paypal]');
  if (!ticket || !section) return () => {};
  if (mounts.has(section)) return mounts.get(section);
  const doc = root.ownerDocument;
  const status = section.querySelector('[data-paypal-status]');
  const fallback = section.querySelector('[data-paypal-fallback]');
  const preview = section.querySelector('[data-paypal-preview]');
  let active = true, started = false, timeout;
  const isCurrent = () => active && section.isConnected;
  const showFallback = () => {
    if (!isCurrent()) return;
    status.hidden = false;
    status.textContent = 'PayPal could not load here. You can use the PayPal link, or continue to the download.';
    fallback.hidden = false;
  };
  const applyChoice = choice => {
    if (!isCurrent()) return;
    if (choice?.paypal !== true) {
      if (started) {
        // Dropping the script tag cannot stop executed third-party code.
        cleanup();
        doc.defaultView.location.reload();
      }
      return;
    }
    if (started) return;
    started = true;
    preview.hidden = true;
    fallback.hidden = true;
    status.hidden = false;
    status.textContent = 'Loading PayPal…';
    timeout = setTimeout(showFallback, 15000);
    loadSdk(doc).then(async paypal => {
      if (!isCurrent()) return;
      await paypal.HostedButtons({ hostedButtonId: ticket }).render(`#paypal-container-${ticket}`);
      if (isCurrent()) status.hidden = true;
    }).catch(showFallback).finally(() => clearTimeout(timeout));
  };
  const unsubscribe = preference.subscribe(applyChoice);
  const cleanup = () => { active = false; clearTimeout(timeout); unsubscribe(); };
  mounts.set(section, cleanup);
  // Only a valid sitewide choice can start the optional integration. A return
  // URL, hover, free download or unknown/expired choice cannot grant permission.
  applyChoice(preference.read());
  return cleanup;
}
