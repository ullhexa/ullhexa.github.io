import { plugins } from "./plugins-data.js?v=20261116-micronudge-gallery";

export const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

export function renderPluginCatalogue() {
  // New products are appended to the data; display them newest first in row order.
  const newestFirst = [...plugins].reverse();
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
          <span class="pluginBadgeMeta">Free · ${escapeHTML(plugin.formats)}</span>
        </div>
      </article>`;
    }).join("")}
  </div>`;
}
