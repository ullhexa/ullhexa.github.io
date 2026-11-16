import { escapeHTML as html } from './plugin-catalogue.js?v=20261116-public-downloads';

// Public SDK identifier supplied by the owner. Each product owns its own ticket.
const sdkUrl = 'https://www.paypal.com/sdk/js?client-id=BAAeDIej6ICgC_DArq071R4PtdFHOr81DjJ22RhpshQ-JTc7czYm-gtYIvp2wcgJwX4d7MHrwVOioUOReE&components=hosted-buttons&disable-funding=venmo&currency=USD';
const sdkLoads = new WeakMap();
const mounts = new WeakMap();
const ticketFor = plugin => plugin.priceUSD === 0 && /^[A-Z0-9]+$/.test(plugin.paypal?.hostedButtonId || '') ? plugin.paypal.hostedButtonId : null;

export function renderPluginPayPal(plugin) {
  const ticket = ticketFor(plugin);
  if (!ticket) return '';
  return `<section class="pluginPayPal" aria-label="Optional contribution for ${html(plugin.title)}" data-plugin-paypal>
    <div class="pluginPayPalPanel">
      <div id="paypal-container-${ticket}" data-paypal-buttons></div>
      <p class="pluginPayPalStatus" role="status" data-paypal-status>Loading PayPal…</p>
      <a class="pluginPayPalFallback" data-paypal-fallback href="https://www.paypal.com/ncp/payment/${ticket}" target="_blank" rel="noopener noreferrer" hidden>Contribute on PayPal <span aria-hidden="true">↗</span></a>
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

export function mountPluginPayPal(root, plugin) {
  const ticket = ticketFor(plugin);
  const section = root.querySelector('[data-plugin-paypal]');
  if (!ticket || !section) return () => {};
  if (mounts.has(section)) return mounts.get(section);
  const status = section.querySelector('[data-paypal-status]');
  const fallback = section.querySelector('[data-paypal-fallback]');
  let active = true;
  const isCurrent = () => active && section.isConnected;
  const showFallback = () => {
    if (!isCurrent()) return;
    status.hidden = false;
    status.textContent = 'PayPal could not load here. You can contribute using the link below, or continue to the download.';
    fallback.hidden = false;
  };
  const timeout = setTimeout(showFallback, 15000);
  const cleanup = () => { active = false; clearTimeout(timeout); };
  mounts.set(section, cleanup);
  // Delivery is already rendered and never waits for this optional payment panel.
  loadSdk(root.ownerDocument).then(async paypal => {
    if (!isCurrent()) return;
    await paypal.HostedButtons({ hostedButtonId: ticket }).render(`#paypal-container-${ticket}`);
    if (isCurrent()) { status.hidden = true; fallback.hidden = true; }
  }).catch(showFallback).finally(() => clearTimeout(timeout));
  return cleanup;
}
