import { plugins } from "./plugins-data.js?v=20261120-private-metadata";

export const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

export function formatPluginPrice(plugin, freeLabel = 'Free') {
  if (plugin.priceUSD === 0) return freeLabel;
  if (typeof plugin.priceUSD === 'number' && Number.isFinite(plugin.priceUSD) && plugin.priceUSD > 0)
    return `$${plugin.priceUSD.toFixed(2)} USD`;
  return 'Price pending';
}

export function renderPluginCatalogue(catalogue = plugins) {
  // New products are appended to the data; display them newest first in row order.
  const newestFirst = [...catalogue].reverse();
  return `<div class="pluginCatalogue">
    ${newestFirst.map(plugin => {
      const first = plugin.images[plugin.badgeImageIndex ?? 0] || plugin.images[0];
      return `<article class="pluginBadge">
        <a class="pluginBadgeImage" href="${plugin.page}" aria-label="Explore ${escapeHTML(plugin.title)}">
          ${first ? `<img src="${first.src}" alt="${escapeHTML(first.alt)}" width="${first.width}" height="${first.height}" loading="lazy" decoding="async" />` : '<span class="pluginImagePending">Image coming soon</span>'}
        </a>
        <div class="pluginBadgeCopy">
          <h3><a href="${plugin.page}">${escapeHTML(plugin.title)}</a></h3>
          <p>${escapeHTML(plugin.summary)}</p>
          <span class="pluginBadgeMeta">${formatPluginPrice(plugin)} · ${escapeHTML(plugin.formats)}</span>
        </div>
      </article>`;
    }).join("")}
  </div>`;
}
