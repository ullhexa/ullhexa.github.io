const assetRoot = "./Serum_2_skins/";

const skins = [
  { title: "Banana", image: "banana.webp", zip: "Ull Hexa - Banana.zip" },
  { title: "Black Minimal", image: "black_minimal.webp", zip: "Ull Hexa - Black minimal.zip" },
  { title: "Deep Ocean", image: "deep_ocean.webp", zip: "Ull Hexa - Deep Ocean.zip" },
  { title: "Ember", image: "ember.webp", zip: "Ull Hexa - Ember.zip" },
  { title: "Fabric", image: "fabric.webp", zip: "Ull Hexa - Fabric.zip" },
  { title: "Forest", image: "forest.webp", zip: "Ull Hexa - Forest.zip" },
  { title: "Maple Wood", image: "maple_wood.webp", zip: "Ull Hexa - Maple Wood.zip" },
  { title: "Metal Black", image: "metal_black.webp", zip: "Ull Hexa - Metal black.zip" },
  { title: "Pastel Clay", image: "pastel_clay.webp", zip: "Ull Hexa - Pastel Clay.zip" },
  { title: "Red Crystal", image: "red_crystal.webp", zip: "Ull Hexa - Red crystal.zip" }
];

export function renderSerumSkins() {
  return `
    <div class="skinGrid">
      ${skins.map(({ title, image, zip }, index) => `
        <article class="skinBadge">
          <button class="skinBadgeImage" type="button" data-skin-preview="${index}" aria-label="Preview ${title}" aria-haspopup="dialog" aria-controls="skinPreview">
            <img src="${assetRoot}preview_image/${image}" alt="${title} Serum 2 skin" width="1785" height="1157" loading="lazy" decoding="async" />
          </button>
          <h3>${title}</h3>
          <a class="softActionBtn skinDownload" href="${assetRoot}zip/${encodeURIComponent(zip)}?v=20261013-publication" download="Ull Hexa - ${title}.zip" aria-label="Download ${title} skin (ZIP)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg>
            <span>Download</span>
          </a>
        </article>
      `).join("")}
    </div>
    <p class="skinLicenceNote">Free to use and share unchanged. No resale or rebranding.
      <a href="./Serum_2_skins/LICENSE%20-%20Ull%20Hexa%20Skins.txt?v=1.2" target="_blank" rel="noopener noreferrer">Read the licence</a> for permissions, support and liability terms.
    </p>
    <dialog class="skinPreview" id="skinPreview" aria-label="Skin preview">
      <button class="skinPreviewClose" type="button" aria-label="Close preview" autofocus>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="m5 5 14 14M19 5 5 19" /></svg>
      </button>
      <img class="skinPreviewImage" alt="" width="1785" height="1157" />
    </dialog>
  `;
}

export function mountSerumSkins(root) {
  const dialog = root.querySelector(".skinPreview");
  const image = dialog.querySelector(".skinPreviewImage");

  root.querySelectorAll("[data-skin-preview]").forEach(button => {
    button.addEventListener("click", () => {
      const skin = skins[Number(button.dataset.skinPreview)];
      image.src = `${assetRoot}preview_image/${skin.image}`;
      image.alt = `${skin.title} Serum 2 skin`;
      dialog.setAttribute("aria-label", `${skin.title} preview`);
      // Native modal behaviour handles focus trapping, Escape and focus restoration.
      dialog.showModal();
    });
  });

  dialog.querySelector(".skinPreviewClose").addEventListener("click", () => dialog.close());
  let pressedOutside = false;
  dialog.addEventListener("pointerdown", event => { pressedOutside = event.target === dialog; });
  dialog.addEventListener("click", event => {
    if (pressedOutside && event.target === dialog) dialog.close();
    pressedOutside = false;
  });

  // Close before a hash-route replaces the gallery, releasing its modal state.
  return () => { if (dialog.open) dialog.close(); };
}
