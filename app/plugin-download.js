import { escapeHTML as html } from './plugin-catalogue.js?v=20261116-public-downloads';

export const downloadPath = plugin => `${plugin.page}download/`;
export const isFreePlugin = plugin => plugin.priceUSD === 0;

export function renderPluginTerms(plugin) {
  return `<div class="pluginTerms"><p class="pluginDownloadAssurance">${html(plugin.download.assurance)}</p>
    <p class="pluginLicence">${html(plugin.licence)}</p></div>`;
}

export function renderCheckoutEntry(plugin) {
  const free = isFreePlugin(plugin);
  const price = free ? 'FREE' : `$${Number(plugin.priceUSD).toFixed(2)} USD`;
  // Paid fulfilment is deliberately deferred. A price alone must never enable
  // a free route, and the general homepage support ticket is not a purchase.
  const url = free ? downloadPath(plugin) : null;
  const button = url
    ? `<a class="softActionBtn pluginPriceButton pluginCheckoutLink" href="${html(url)}" target="_blank" rel="noopener" aria-label="${html(plugin.title)}: ${price}, proceed to download">${price}</a>`
    : `<button class="softActionBtn pluginPriceButton" type="button" disabled>${price}</button>`;
  return `<div class="pluginDownloadBlock pluginCheckoutEntry">${button}<span class="pluginProceed"><span aria-hidden="true">←</span> Proceed to download</span></div>`;
}

export function renderPluginDownload(plugin) {
  const download = plugin.download;
  const icon = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg>';
  const ready = isFreePlugin(plugin) && download.status === 'published';
  return `<div class="pluginDownloadBlock">
    ${ready ? `<a class="softActionBtn pluginDownload" href="${html(download.url)}" aria-label="Download ${html(plugin.title)} ${html(plugin.version)} for macOS (${html(download.size)} PKG)">${icon}<span>Download for macOS</span></a>` : `<button class="softActionBtn pluginDownload" disabled type="button">${icon}<span>Download for macOS</span></button>`}
    <p class="pluginDownloadMeta">Version ${html(plugin.version)} <span>·</span> ${html(download.size)} <span>·</span> ${html(plugin.formats)}</p>
    ${renderPluginTerms(plugin)}
  </div>`;
}

export function renderPluginDetails(plugin) {
  return `<div class="pluginDetails">
    <section aria-labelledby="requirementsTitle"><h2 id="requirementsTitle">System requirements</h2>
      <dl class="pluginSpecs">${plugin.specifications.map(([key, value]) => `<div><dt>${html(key)}</dt><dd>${html(value)}</dd></div>`).join('')}</dl>
    </section>
    <section aria-labelledby="installationTitle"><h2 id="installationTitle">Getting started</h2>
      <ol class="pluginInstallation">${plugin.installation.map(step => `<li>${html(step)}</li>`).join('')}</ol>
      <p class="pluginDocumentation"><a href="${html(plugin.page)}documentation/" data-plugin-documentation aria-haspopup="dialog" aria-controls="pluginDocumentationDialog">User guide and licence <span aria-hidden="true">→</span></a></p>
    </section>
  </div>`;
}

export function renderPluginFooter(plugin) {
  const contactURL = `/#contact?subject=${encodeURIComponent(plugin.title)}`;
  return `<footer class="pluginFooter">Questions or bug reports: <a href="${html(contactURL)}">Contact form <span aria-hidden="true">→</span></a></footer>`;
}

// Parse decimal strings to cents without rounding invalid fractions into a free
// download. Blank input requires an explicit choice; commas work as decimals.
export function parseContribution(raw) {
  const value = raw.trim().replace(',', '.');
  if (!value) return { kind: 'empty' };
  if (!/^(?:\d{1,6}(?:\.\d{0,2})?|\.\d{1,2})$/.test(value)) return { kind: 'invalid' };
  const [whole = '0', fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return { kind: cents === 0 ? 'zero' : 'positive', cents };
}
