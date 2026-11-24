import { startBackground } from "./bg.js?v=20260404b";
import { renderDndShowcase, mountDndShowcase } from "./dnd-showcase.js?v=20261113-gm-gallery";
import { createSiteNavigation, resolveSiteRoute } from "./site-navigation.js?v=20261124-bitcrush";
import { renderPluginCatalogue } from "./plugin-catalogue.js?v=20261122-product-pricing";
import { renderContact, mountContact } from "./contact.js?v=20261124-audio-extras";
import { renderHomeNews, mountHomeNews } from "./home-news.js?v=20261124-bitcrush";
import { bindPressActions } from "./press-action.js?v=20261120-touch-taps";
import { mountPreviewGate } from "./preview-gate.js?v=20261121-outside-footer";

import { VISUALIZERS } from "./visualizers-data.js?v=20261121-carousel";
import { renderHomeOverview, mountHomeOverview } from "./home-overview.js?v=20261124-bitcrush";

const content = document.getElementById("content");
const updateSiteNavigation = createSiteNavigation();

const SOCIAL_LINKS = [
  {
    title: "Spotify",
    href: "https://open.spotify.com/artist/2CBJIAXw4zQRDW0cul9HIn?si=6xXT4taoRBaWTvmcOs_YsQ",
    img: "./assets/Brands/Spotify_Primary_Logo_RGB_Green.png",
    alt: "Spotify"
  },
  {
    title: "YouTube Music",
    href: "https://music.youtube.com/channel/UCKDxFaro26Hm9jOwzqFShmg?si=qX4ibZl6tI216TS5",
    img: "./assets/Brands/youtube-music.webp",
    alt: "YouTube Music"
  },
  {
    title: "Tidal",
    href: "https://tidal.com/artist/72690695/u",
    img: "./assets/Brands/tidal.webp",
    alt: "Tidal",
    imageClass: "brandIconTidal"
  },
  {
    title: "TikTok",
    href: "https://www.tiktok.com/@ullhexa",
    img: "./assets/Brands/TikTok_Icon_Black_Circle.png",
    alt: "TikTok"
  }
];



function logoLink({ href, img, alt, title, imageClass = "" }) {
  return `
    <a href="${href}" target="_blank" rel="noreferrer" class="brandLogoOnlyBtn" aria-label="${title}">
      <img src="${img}" alt="${alt}" class="brandIconImg ${imageClass}" loading="lazy" />
    </a>
  `;
}

function catalogueSection(title, contentHtml) {
  return `
    <section class="contactShell" aria-labelledby="cataloguePageTitle">
      <h2 id="cataloguePageTitle" class="visuallyHidden">${title}</h2>
      ${contentHtml}
    </section>
  `;
}

function renderVisualizerBadges() {
  return `
    <div class="catalogueIntro">
      <p><strong>MIDI visualizers</strong> turn notes from your MIDI controller or computer keyboard into moving visuals.<br>
        Compatible desktop browsers: Google Chrome, Microsoft Edge, Opera and Firefox. Firefox requires a site permission add-on for MIDI.</p>
      <p><strong>Audio visualizers</strong> react to sound from your microphone or a shared browser tab.<br>
        Browser tab audio (desktop): Google Chrome, Microsoft Edge and Opera. Microphone input also works in Safari.</p>
    </div>
    <div class="visualizerColumns">
      ${VISUALIZERS.map(({ family, title, modes }) => `
        <section class="visualizerColumn" aria-labelledby="${family}VisualizersTitle">
          <h3 id="${family}VisualizersTitle">${title}</h3>
          <div class="visualizerBadges">
            ${modes.map(({ mode, title: modeTitle, image, description }) => {
              const href = `./visualizers.html?family=${family}&mode=${mode}`;
              return `
                <article class="visualizerBadge">
                  <a class="visualizerBadgeImage" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Open ${modeTitle} (opens in a new window)">
                    <img src="./assets/products/visualizers/${encodeURIComponent(image)}" alt="${modeTitle} visualizer preview" width="1080" height="1080" loading="lazy" decoding="async" />
                  </a>
                  <div class="visualizerBadgeCopy">
                    <h4><a href="${href}" target="_blank" rel="noopener noreferrer" title="Opens in a new window">${modeTitle}</a></h4>
                    <p>${description}</p>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

const pages = {
  home: () => `
    <section class="homeBio homeIntro" aria-label="Ull Hexa tools and software">
      <div class="homePanelArt" aria-hidden="true"><span class="homePanelHead"><span class="homePanelRibbon"></span></span><span class="homePanelBody"></span><span class="homePanelFoot"></span></div>
      <div>
        <p class="homeWelcome">Audio tools for the nerds</p>
        <section class="homeOverview" aria-label="Explore the tools and software">
          ${renderHomeOverview()}
        </section>
      </div>
    </section>
    <section class="homeQuickLinks homeMoreLinks" aria-label="More by Ull Hexa">
      <p class="homeQuickLinksTitle">See more by Ull Hexa</p>
      <div class="homeBrandRow">
        <div class="homeSocialIcons">${SOCIAL_LINKS.map(logoLink).join("")}</div>
      </div>
    </section>
    ${renderHomeNews()}
  `,

  about: () => `
    <section class="aboutBio" aria-labelledby="aboutBioTitle">
    <div class="contactIntro">
      <h2 id="aboutBioTitle">About Ull Hexa</h2>
    </div>

    <div class="bio">
      <div class="bio-portrait">
        <img src="./assets/profile.png" alt="Profile photo" class="bio-img" />
        ${renderContact()}
      </div>

      <div class="bio-text">
        <p>
          Hi, I’m Ull Hexa, a composer, sound sculptor and audio software developer from Norway.
          I’ve worked with music composition for most of my life, and more seriously in production,
          mixing and mastering since 2017, when I built my first music studio. I now work from my third
          and definitely my favorite studio.
        </p>
        <p>
          The music I create fuses the tribal side of human nature with modern sound synthesis. I shape it by hand
          and ear, using analog synthesizers, Euroracks, field recordings and sounds from real objects
          and orchestral samples. I do not use AI in any aspect of my music.
        </p>
        <p>
          Ull Hexa is a new artist and brand, but is founded on plenty of experience in the music field.
        </p>
        <p>
          Over the years, I have also garnered a lot of technical abilities, a sense of acoustic quality,
          and the need for custom solutions that feeds my passion for art and technology. Therefore I
          started developing plugins that I would love to use in my own production. I craft tools
          that I deem unique, that serve a purpose, and that are worth the time and effort. If you like these tools too, even better!
        </p>
        <p>
          If you like what I do and enjoy using the plugins that I develop, please consider leaving
          a little tip in the link below:
        </p>

        <p class="homeSupportLink"><a href="https://www.paypal.com/ncp/payment/SJ4SW8M8N3NS2" target="_blank" rel="noopener noreferrer">Support Ull Hexa on PayPal <span aria-hidden="true">↗</span></a></p>

      </div>
    </div>

    </section>
  `,

  music: () => '<p class="musicLoadStatus" role="status">Loading releases…</p>',

  plugins: () => catalogueSection("Plugins", renderPluginCatalogue()),


  visualizers: () => catalogueSection(
    "Visualizers",
    renderVisualizerBadges()
  ),

  dnd: renderDndShowcase
};

function routeFromHash() {
  return resolveSiteRoute((location.hash || "#home").slice(1).split("?")[0]);
}

let cleanupPage = null;

function render() {
  const route = routeFromHash();
  const holding = document.body.classList.contains("logoOnlyMode");
  const contactOnly = holding && route === "about";
  document.body.classList.toggle("contactOnlyMode", contactOnly);
  cleanupPage?.();
  cleanupPage = null;
  // Legacy holding mode exposes only contact details through About.
  // Other routes must not render or fetch the full site feed in holding mode.
  if (previewGate.isLocked() || (holding && !contactOnly)) {
    content.replaceChildren();
    return;
  }
  const page = contactOnly ? renderContact : pages[route] || pages.home;
  content.classList.toggle("homePage", page === pages.home);
  content.classList.toggle("categoryPage", updateSiteNavigation(route));
  content.classList.toggle("dndPage", route === "dnd");
  content.classList.toggle("pluginsPage", route === "plugins");
  content.innerHTML = page();
  if (page === pages.home) {
    const unmountNews = mountHomeNews(content);
    const unmountOverview = mountHomeOverview(content);
    const unbindOverview = bindPressActions(content, { selector: ".homeOverviewItem, .homeOverviewImageLink" });
    cleanupPage = () => { unmountOverview(); unmountNews(); unbindOverview(); };
  }
  if (route === "music") {
    let cancelled = false;
    let unbind = null;
    cleanupPage = () => { cancelled = true; unbind?.(); };
    // Keep the catalogue and its stories off the homepage's initial download.
    import("./music-catalogue.js?v=20261123-email").then(({ renderMusicCatalogue }) => {
      if (cancelled) return;
      content.innerHTML = renderMusicCatalogue();
      unbind = bindPressActions(content, { selector: ".musicCatalogue a, .musicStory summary" });
    }).catch(() => {
      if (!cancelled) content.innerHTML = '<p class="musicLoadStatus" role="status">The releases could not be loaded. Please reload the page to try again.</p>';
    });
  }
  if (route === "dnd") mountDndShowcase(content);

  if (route === "about") cleanupPage = mountContact(content);

}

const previewGate = mountPreviewGate(() => { startBackground(); render(); });
if (!previewGate.isLocked()) startBackground();
window.addEventListener("hashchange", render);
render();
