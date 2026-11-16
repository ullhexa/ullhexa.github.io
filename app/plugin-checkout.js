import { mountPluginDocumentation } from './plugin-documentation-modal.js?v=20261115-installer-docs';
import { plugins } from './plugins-data.js?v=20261116-public-downloads';
import { escapeHTML as html } from './plugin-catalogue.js?v=20261116-public-downloads';
import { bindPressActions } from './press-action.js?v=20261110-link-fix';
import { isFreePlugin, renderPluginDownload, renderPluginDetails } from './plugin-download.js?v=20261116-public-downloads';
import { renderPluginPayPal, mountPluginPayPal } from './plugin-paypal.js?v=20261116-public-downloads';

function renderFinalDownload(plugin) {
  const paypal = renderPluginPayPal(plugin);
  return `<a class="pluginBack" href="/#home">← Back to Ull Hexa home</a>
    <header class="pluginFinalHeading">
      <h1>${html(plugin.title)}</h1>
      <p class="pluginVersion">Version ${html(plugin.version)}</p>
      <p>${html(plugin.subtitle)}</p>
    </header>
    <div class="pluginFinalLayout${paypal ? ' hasPayPal' : ''}">
      <div class="pluginFinalPayment">
        ${paypal || `<div class="pluginFinalImage"><img class="pluginFinalArtwork" src="${html(plugin.images[0].src)}" alt="${html(plugin.images[0].alt)}"></div>`}
      </div>
      <div class="pluginFinalInfo">
        ${renderPluginDetails(plugin)}
        <section class="pluginFinalDelivery" aria-label="${html(plugin.title)} download">
          ${paypal ? '<p class="pluginPayPalNote">Contributions are optional. The plugin is free to download.</p>' : ''}
          ${renderPluginDownload(plugin)}
        </section>
      </div>
    </div>`;
}

const root = document.getElementById('product');
const plugin = plugins.find(item => item.id === document.body.dataset.product);
if (plugin && isFreePlugin(plugin)) {
  root.innerHTML = renderFinalDownload(plugin);
  mountPluginDocumentation(root, plugin);
  // Keep PayPal's own input and payment controls on their native event handling.
  bindPressActions(root, { selector: '.pluginBack, .pluginDownload, [data-plugin-documentation], .pluginPayPalFallback' });
  mountPluginPayPal(root, plugin);
} else {
  root.innerHTML = '<h1>Download unavailable</h1><a href="/#plugins">All plugins</a>';
}
