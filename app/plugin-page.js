import { mountPluginDocumentation } from './plugin-documentation-modal.js?v=20261120-touch-taps';
import { mountGalleryZoom } from "./plugin-gallery-zoom.js?v=20261014-sticky-zoom";
import { plugins } from "./plugins-data.js?v=20261120-private-metadata";
import { escapeHTML as html } from "./plugin-catalogue.js?v=20261122-product-pricing";
import { startBackground } from "./bg.js?v=20260404b";
import { createSiteNavigation } from "./site-navigation.js?v=20261124-infomaniak";

import { bindPressActions } from "./press-action.js?v=20261120-touch-taps";
import { renderPluginTerms, renderCheckoutEntry, renderPluginDetails, renderPluginFooter } from "./plugin-download.js?v=20261123-email";

function renderGallery(plugin) {
  const first = plugin.images[0];
  if (!first) return '<div class="pluginGalleryPending">Plugin screenshots coming soon</div>';
  return `<section class="pluginGallery" aria-label="${html(plugin.title)} image gallery" aria-roledescription="carousel">
    <figure id="pluginSlide" class="pluginSlide" aria-roledescription="slide" aria-label="1 of ${plugin.images.length}">
      <button class="pluginGalleryImage" type="button" data-gallery-zoom aria-label="Zoom into screenshot: ${html(first.title)}" aria-pressed="false">
        <span class="pluginGalleryArtwork" data-gallery-image role="img" aria-label="${html(first.alt)}" style="background-image: url(${html(JSON.stringify(first.src))})"></span>
      </button>
      <figcaption aria-live="polite" aria-atomic="true"><h2 data-gallery-title>${html(first.title)}</h2><p data-gallery-caption>${html(first.caption)}</p></figcaption>
    </figure>
    <!-- Decorative backgrounds keep native image-text detection out of these controls. -->
    <div class="pluginThumbnails" aria-label="Choose a screenshot">
      ${plugin.images.map((slide, index) => `<button type="button" data-gallery-index="${index}" aria-label="Show ${html(slide.title)}" aria-pressed="${index === 0}"><span class="pluginThumbnailPreview" aria-hidden="true" style="background-image: url(${html(JSON.stringify(slide.thumb || slide.src))})"></span></button>`).join("")}
    </div>
  </section>`;
}

function renderProduct(plugin) {
  return `<a class="pluginBack" href="../../#plugins">← All plugins</a>
    <div class="pluginHero">
      ${renderGallery(plugin)}
      <section class="pluginOverview" aria-labelledby="productTitle">
        <p class="pluginEyebrow">${html(plugin.kind)}</p>
        <h1 id="productTitle">${html(plugin.title)}</h1>
        <p class="pluginVersion">Version ${html(plugin.version)}</p>
        <p class="pluginDescription">${html(plugin.description)}</p>
        <ul class="pluginFeatures">${plugin.features.map(feature => `<li>${html(feature)}</li>`).join("")}</ul>
        ${plugin.audioNote ? `<p class="pluginAudioNote">${html(plugin.audioNote)}</p>` : ""}
        ${renderPluginTerms(plugin)}
        ${renderCheckoutEntry(plugin)}
      </section>
    </div>
    ${renderPluginDetails(plugin)}
    ${renderPluginFooter(plugin)}`;
}

function mountGallery(plugin, root) {
  const gallery = root.querySelector(".pluginGallery");
  if (!gallery) return;
  const image = gallery.querySelector("[data-gallery-image]");
  const zoom = mountGalleryZoom(gallery.querySelector("[data-gallery-zoom]"), image, plugin.images[0]);
  window.addEventListener("resize", zoom.refresh);
  const thumbnails = [...gallery.querySelectorAll("[data-gallery-index]")];
  let index = 0;
  function show(next) {
    index = (next + plugin.images.length) % plugin.images.length;
    const slide = plugin.images[index];
    zoom.setImage(slide);
    gallery.querySelector("[data-gallery-title]").textContent = slide.title;
    gallery.querySelector("[data-gallery-caption]").textContent = slide.caption;
    gallery.querySelector("#pluginSlide").setAttribute("aria-label", `${index + 1} of ${plugin.images.length}`);
    thumbnails.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  }
  thumbnails.forEach((button, i) => {
    // Hover selects persistently; touch and keyboard activation still use click.
    button.addEventListener("pointerenter", event => {
      if (event.pointerType !== "touch" && i !== index) show(i);
    });
    button.addEventListener("click", () => show(i));
  });
  gallery.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: plugin.images.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    show(next);
  });

}

startBackground();
createSiteNavigation()("plugins");
document.querySelectorAll('.siteNavigation a[href^="#"]').forEach(link => {
  link.href = `../../${link.getAttribute("href")}`;
});
const root = document.getElementById("product");
const plugin = plugins.find(item => item.id === document.body.dataset.product);
if (plugin) {
  root.innerHTML = renderProduct(plugin);
  mountGallery(plugin, root);
  mountPluginDocumentation(root, plugin);
  bindPressActions(root, { selector: ".pluginBack, .pluginCheckoutLink, .pluginDocumentation a, .pluginFooter a" });
} else {
  root.innerHTML = '<h1>Plugin not found</h1><a href="../../#plugins">All plugins</a>';
}
