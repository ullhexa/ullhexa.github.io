import { startBackground } from "./bg.js?v=20260404b";
import { renderDndShowcase, mountDndShowcase } from "./dnd-showcase.js?v=20261113-gm-gallery";
import { createSiteNavigation, resolveSiteRoute } from "./site-navigation.js?v=20261121-plugins-direct";
import { renderPluginCatalogue } from "./plugin-catalogue.js?v=20261120-private-metadata";
import { mountContactForm } from "./contact-form.js?v=20261110-synth";
import { renderHomeNews, mountHomeNews } from "./home-news.js?v=20261121-plugins-direct";
import { bindPressActions } from "./press-action.js?v=20261120-touch-taps";
import { mountPreviewGate } from "./preview-gate.js?v=20261121-outside-footer";

const content = document.getElementById("content");
const updateSiteNavigation = createSiteNavigation();

const contactFormConfig = {
  "ullhexa.music@gmail.com": {
    label: "Ull Hexa Music",
    accessKey: "c7605148-53c9-4fc9-9bcd-93ecac1b4a23"
  }
};

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

const VISUALIZERS = [
  {
    family: "midi",
    title: "MIDI",
    modes: [
      { mode: "squares", title: "City", image: "City.webp", description: "Build a neon skyline with every note. Colourful towers rise and glow with the intensity of your playing." },
      { mode: "plane", title: "3D Plane", image: "3D_plane.webp", description: "Shape a floating wireframe with your notes. Pitch and velocity bend the surface into shifting geometric forms." },
      { mode: "plasma", title: "Plasma Sphere", image: "Plasma_sphere.webp", description: "Send glowing tendrils through a sphere of light. Notes spark new connections, while sustained playing keeps them moving." },
      { mode: "cube", title: "Cube", image: "Cube.webp", description: "Turn a familiar puzzle into a musical instrument. Notes twist rows, rotate the cube and pull its colours apart." }
    ]
  },
  {
    family: "audio",
    title: "Audio",
    modes: [
      { mode: "stereo-osc", title: "Quantum string", image: "Quantum_string.webp", description: "Trace sound through luminous, folding curves. Bass and treble shape the motion as the music changes." },
      { mode: "fractals", title: "Alien trees", image: "alien trees.webp", description: "Grow an otherworldly forest from sound. Branches, glowing fruit and drifting rain respond to the music." },
      { mode: "cat", title: "Space cat", image: "Space_cat.webp", description: "A cosmic cat with a feel for the groove. It dances to the beat amid shifting colours and occasional alien encounters." }
    ]
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
      <div>
        <p class="homeWelcome">Audio plugins and browser tools for music and play.</p>
        <section class="homeOverview" aria-label="Explore the tools and software">
          <a class="homeOverviewItem" href="#plugins">
            <div class="homeOverviewImage"><img src="./assets/news/products/micronudge.webp" alt="Ullhexa MicroNudge plugin" width="320" height="218" loading="lazy" decoding="async" /></div>
            <div class="homeOverviewCopy"><h2>Plugins <span aria-hidden="true">→</span></h2><p>Free audio plugins for notes, spatial audio, filtering and kick/bass alignment.</p></div>
          </a>
          <a class="homeOverviewItem" href="#visualizers">
            <div class="homeOverviewImage"><img src="./assets/products/visualizers/Quantum_string.webp" alt="Quantum String audio visualizer" width="320" height="218" loading="lazy" decoding="async" /></div>
            <div class="homeOverviewCopy"><h2>Visualizers <span aria-hidden="true">→</span></h2><p>Browser visuals that react to MIDI notes or incoming audio.</p></div>
          </a>
          <a class="homeOverviewItem" href="#dnd">
            <div class="homeOverviewImage"><img src="./assets/news/products/gm-console.webp" alt="Ull Hexa GM Console with maps and character tokens" width="320" height="218" loading="lazy" decoding="async" /></div>
            <div class="homeOverviewCopy"><h2>GM Console <span aria-hidden="true">→</span></h2><p>A browser-based Game Master console for Dungeons &amp; Dragons sessions.</p></div>
          </a>
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
          With Ull Hexa, I want to bring my musical taste and style into SYNC work as well, particularly
          for games. Feel free to <a href="#contact">contact me</a> if you have some interesting projects
          in the works that you'd like music for.
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

  dnd: renderDndShowcase,

  contact: () => `
    <section class="contactShell">
      <div class="contactGrid">
        <div class="contactPanel contactIdentity">
          <div class="contactIdentityGlow"></div>
          <p class="contactRole">Ull Hexa</p>
          <h3>Direct contact</h3>
          <div class="contactChips">
            <div class="contactChip">ullhexa.music@gmail.com</div>
          </div>
          <p class="contactNote">
            For music, licensing, or other inquiries, send a message through the form or directly by email.
          </p>
        </div>

        <div class="contactPanel">
          <form id="contactForm" class="contactForm" novalidate>
            <input id="contactRecipient" name="recipient" type="hidden" value="ullhexa.music@gmail.com" />

            <div class="contactFieldRow">
              <div class="contactField">
                <label for="contactName">Your name</label>
                <input id="contactName" name="name" type="text" autocomplete="name" maxlength="120" aria-describedby="contactNameLimit" placeholder="Your name" required />
                <small class="contactLimit" id="contactNameLimit" aria-live="polite"></small>
              </div>
              <div class="contactField">
                <label for="contactEmail">Your email</label>
                <input id="contactEmail" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required />
              </div>
            </div>

            <div class="contactField">
              <label for="contactSubject">Subject</label>
              <input id="contactSubject" name="subject" type="text" maxlength="180" aria-describedby="contactSubjectLimit" placeholder="Project, licensing, collaboration..." />
              <small class="contactLimit" id="contactSubjectLimit" aria-live="polite"></small>
            </div>

            <div class="contactField">
              <label for="contactMessage">Message</label>
              <textarea id="contactMessage" name="message" rows="7" maxlength="5000" aria-describedby="contactMessageLimit" placeholder="Write a short message..." required></textarea>
              <small class="contactLimit" id="contactMessageLimit" aria-live="polite"></small>
            </div>

            <div class="contactActions">
              <button type="submit" id="contactSubmitBtn" class="contactPrimaryBtn simpleBoxButton">Send message</button>
            </div>
            <p class="contactPrivacy">Your message is sent through Web3Forms to my email inbox. <a href="/privacy/#contact" target="_blank" rel="noopener">How your information is handled</a>.</p>
            <p id="contactStatus" class="contactStatus" role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>
  `
};

function routeFromHash() {
  return resolveSiteRoute((location.hash || "#home").slice(1).split("?")[0]);
}

let cleanupPage = null;

function render() {
  const route = routeFromHash();
  const holding = document.body.classList.contains("logoOnlyMode");
  const contactOnly = holding && route === "contact";
  document.body.classList.toggle("contactOnlyMode", contactOnly);
  cleanupPage?.();
  cleanupPage = null;
  // Allow the direct Contact link while the public homepage remains closed.
  // Other routes must not render or fetch the full site feed in holding mode.
  if (previewGate.isLocked() || (holding && !contactOnly)) {
    content.replaceChildren();
    return;
  }
  const page = pages[route] || pages.home;
  content.classList.toggle("homePage", page === pages.home);
  content.classList.toggle("categoryPage", updateSiteNavigation(route));
  content.classList.toggle("dndPage", route === "dnd");
  content.classList.toggle("pluginsPage", route === "plugins");
  content.innerHTML = page();
  if (page === pages.home) {
    const unmountNews = mountHomeNews(content);
    const unbindOverview = bindPressActions(content, { selector: ".homeOverviewItem" });
    cleanupPage = () => { unmountNews(); unbindOverview(); };
  }
  if (route === "music") {
    let cancelled = false;
    let unbind = null;
    cleanupPage = () => { cancelled = true; unbind?.(); };
    // Keep the catalogue and its stories off the homepage's initial download.
    import("./music-catalogue.js?v=20261121-licensing-copy").then(({ renderMusicCatalogue }) => {
      if (cancelled) return;
      content.innerHTML = renderMusicCatalogue();
      unbind = bindPressActions(content, { selector: ".musicCatalogue a, .musicStory summary" });
    }).catch(() => {
      if (!cancelled) content.innerHTML = '<p class="musicLoadStatus" role="status">The releases could not be loaded. Please reload the page to try again.</p>';
    });
  }
  if (route === "dnd") mountDndShowcase(content);

  if (route === "contact") {
    const params = new URLSearchParams(location.hash.split("?").slice(1).join("?"));
    const subject = content.querySelector("#contactSubject");
    // Use the field value, never HTML, and retain the form's normal validation.
    subject.value = (params.get("subject") || "").replace(/[\r\n]/g, " ").slice(0, subject.maxLength);
    cleanupPage = mountContactForm(content, contactFormConfig["ullhexa.music@gmail.com"]);
  }

}

const previewGate = mountPreviewGate(() => { startBackground(); render(); });
if (!previewGate.isLocked()) startBackground();
window.addEventListener("hashchange", render);
render();
