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
      <div class="pluginPayPalConsent" data-paypal-consent>
        ${first ? `<img class="pluginPayPalPreview" src="${html(first.src)}" alt="${html(first.alt)}">` : ''}
        <h2>Optional contribution</h2>
        <p>PayPal stays off until you choose to load it. You can download the plugin without it.</p>
        <p id="paypal-privacy-${ticket}">Loading the panel connects to PayPal and allows its cookies and similar storage. PayPal receives your IP address and browser details. Its technologies support payments and security, and can also be used for personalisation, measurement and advertising, depending on your PayPal settings.</p>
        <p><a href="/privacy/#paypal" target="_blank" rel="noopener">Privacy &amp; cookies</a> · <a href="https://www.paypal.com/no/legalhub/paypal/cookie-full" target="_blank" rel="noopener noreferrer">PayPal cookie notice</a></p>
        <div class="pluginPayPalChoices">
          <button type="button" class="simpleBoxButton" data-paypal-enable aria-describedby="paypal-privacy-${ticket}">Allow and load PayPal</button>
          <button type="button" class="simpleBoxButton" data-paypal-decline>Keep PayPal off</button>
        </div>
      </div>
      <div id="paypal-container-${ticket}" data-paypal-buttons></div>
      <p class="pluginPayPalStatus" role="status" data-paypal-status hidden></p>
      <p class="pluginPayPalExternal"><a class="pluginPayPalFallback" data-paypal-fallback href="https://www.paypal.com/ncp/payment/${ticket}" target="_blank" rel="noopener noreferrer">Open on PayPal instead <span aria-hidden="true">↗</span></a></p>
      <button class="pluginPayPalDisable" type="button" data-paypal-disable hidden>Turn PayPal off and reload</button>
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
  const doc = root.ownerDocument;
  const status = section.querySelector('[data-paypal-status]');
  const fallback = section.querySelector('[data-paypal-fallback]');
  const consent = section.querySelector('[data-paypal-consent]');
  const enable = section.querySelector('[data-paypal-enable]');
  const decline = section.querySelector('[data-paypal-decline]');
  const disable = section.querySelector('[data-paypal-disable]');
  let active = true;
  let started = false;
  let timeout;
  const isCurrent = () => active && section.isConnected;
  const showFallback = () => {
    if (!isCurrent()) return;
    status.hidden = false;
    status.textContent = 'PayPal could not load here. You can use the PayPal link, or continue to the download.';
    fallback.hidden = false;
  };
  const onDecline = () => {
    if (!isCurrent() || started) return;
    status.hidden = false;
    status.textContent = 'PayPal is off. The free download is available.';
  };
  const onDisable = () => {
    if (!isCurrent() || !started) return;
    // Removing a script tag does not stop executed third-party code. A full
    // reload discards it and its frames; this page never remembers an opt-in.
    cleanup();
    doc.defaultView.location.reload();
  };
  const onEnable = () => {
    if (!isCurrent() || started) return;
    started = true;
    consent.hidden = true;
    disable.hidden = false;
    status.hidden = false;
    status.textContent = 'Loading PayPal…';
    // Only this explicit action permits the SDK request. No saved choice,
    // scrolling, hover, return URL or installer download may start PayPal.
    timeout = setTimeout(showFallback, 15000);
    loadSdk(doc).then(async paypal => {
      if (!isCurrent()) return;
      await paypal.HostedButtons({ hostedButtonId: ticket }).render(`#paypal-container-${ticket}`);
      if (isCurrent()) status.hidden = true;
    }).catch(showFallback).finally(() => clearTimeout(timeout));
  };
  const cleanup = () => {
    active = false;
    clearTimeout(timeout);
    enable.removeEventListener('click', onEnable);
    decline.removeEventListener('click', onDecline);
    disable.removeEventListener('click', onDisable);
    doc.defaultView.removeEventListener('pageshow', onPageShow);
  };
  // A back/forward-cache restoration is a new visit, not fresh permission.
  const onPageShow = event => { if (event.persisted && started) onDisable(); };
  enable.addEventListener('click', onEnable);
  decline.addEventListener('click', onDecline);
  disable.addEventListener('click', onDisable);
  doc.defaultView.addEventListener('pageshow', onPageShow);
  mounts.set(section, cleanup);
  return cleanup;
}
