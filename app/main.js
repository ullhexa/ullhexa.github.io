import { startBackground } from "./bg.js?v=20260404b";
import { renderDndShowcase, mountDndShowcase } from "./dnd-showcase.js?v=20261013-dnd-root";
import { createSiteNavigation } from "./site-navigation.js?v=20261013-skins";
import { renderSerumSkins, mountSerumSkins } from "./serum-skins.js?v=20261013-publication";
startBackground();

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
    title: "TikTok",
    href: "https://www.tiktok.com/@ullhexa",
    img: "./assets/Brands/TikTok_Icon_Black_Circle.png",
    alt: "TikTok"
  },
  {
    title: "YouTube",
    href: "https://www.youtube.com/@ull_hexa",
    img: "./assets/Brands/yt_logo_fullcolor_white_digital.png",
    alt: "YouTube"
  }
];

const TOOL_RELEASES = {
  plugins: []
};

const VISUALIZERS = [
  {
    family: "midi",
    title: "MIDI",
    modes: [
      { mode: "squares", title: "City", image: "City.webp", description: "Build a neon skyline with every note. Colourful towers rise and glow with the intensity of your playing." },
      { mode: "plane", title: "3D Plane", image: "3D_plane.webp", description: "Shape a floating wireframe with your notes. Pitch and velocity bend the surface into shifting geometric forms." },
      { mode: "plasma", title: "Plasma Sphere", image: "Plasma_sphere.webp", description: "Send glowing tendrils through a sphere of light. Notes spark new connections, while sustained playing keeps them moving." },
      { mode: "rubik", title: "Rubik's Cube", image: "Rubiks_cube.webp", description: "Turn a familiar puzzle into a musical instrument. Notes twist rows, rotate the cube and pull its colours apart." }
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

const SYNC_RELEASES = [];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function logoLink({ href, img, alt, title }) {
  return `
    <a href="${href}" target="_blank" rel="noreferrer" class="brandLogoOnlyBtn" aria-label="${title}">
      <img src="${img}" alt="${alt}" class="brandIconImg" loading="lazy" />
    </a>
  `;
}

function actionButton({ href, label, external = false, active = false, disabled = false }) {
  const attrs = external ? 'target="_blank" rel="noreferrer"' : "";
  return `
    <a href="${disabled ? "#" : href}" class="softActionBtn${active ? " softActionBtnActive" : ""}${disabled ? " softActionBtnDisabled" : ""}" ${attrs} ${disabled ? 'aria-disabled="true" tabindex="-1"' : ""}>
      ${label}
    </a>
  `;
}

function renderImageStack(images, altBase) {
  if (!images || images.length === 0) {
    return `
      <div class="releaseImagePlaceholder">
        <span>Images coming soon</span>
      </div>
    `;
  }

  return `
    <div class="releaseImageScroller">
      ${images.map((src, index) => `<img src="${src}" alt="${altBase} image ${index + 1}" class="releaseImage" loading="lazy" />`).join("")}
    </div>
  `;
}

function downloadButtons(item) {
  return `
    <div class="releaseActions">
      ${actionButton({ href: item.macUrl || "#", label: "Download macOS", external: Boolean(item.macUrl), disabled: !item.macUrl })}
      ${actionButton({ href: item.windowsUrl || "#", label: "Download Windows", external: Boolean(item.windowsUrl), disabled: !item.windowsUrl })}
    </div>
  `;
}

function releaseSortValue(id) {
  const match = String(id || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function renderReleaseFeed(items, emptyMessage, variant = "tools") {
  const sortedItems = [...items].sort((a, b) => releaseSortValue(b.id) - releaseSortValue(a.id));

  if (sortedItems.length === 0) {
    return `
      <div class="releaseEmpty">
        <h3>Coming soon</h3>
        <p>${emptyMessage}</p>
      </div>
    `;
  }

  return `
    <div class="releaseFeed releaseFeed${variant === "sync" ? " releaseFeedSync" : ""}">
      ${sortedItems
        .map(item => `
          <article class="releaseCard releaseCard${variant === "sync" ? " releaseCardSync" : ""}">
            <div class="releaseVisual">
              ${renderImageStack(item.images, item.title)}
              ${variant === "sync"
                ? actionButton({
                    href: item.discoUrl || "https://ullhexa.com",
                    label: "Go to DISCO",
                    external: Boolean(item.discoUrl),
                    disabled: !item.discoUrl
                  })
                : downloadButtons(item)}
            </div>
            <div class="releaseCopy">
              <h3>${item.title}</h3>
              <p class="releaseDesc">${item.desc}</p>
            </div>
          </article>
        `)
        .join("")}
    </div>
  `;
}

function toolsSection(title, contentHtml) {
  return `
    <section class="contactShell" aria-labelledby="toolsPageTitle">
      <h2 id="toolsPageTitle" class="visuallyHidden">${title}</h2>
      ${contentHtml}
    </section>
  `;
}

function renderVisualizerBadges() {
  return `
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
    <div class="contactIntro">
      <h2>About Ull Hexa</h2>
    </div>

    <div class="bio">
      <img src="./assets/profile.png" alt="Profile photo" class="bio-img" />

      <div class="bio-text">
        <p>
          Ull Hexa is a TV- and game-music composer and sound sculptor from Norway, obsessed with
          crafting sounds that fuses the tribal instictual with the futuristic unknown. All sounds are made by hand and ear,
          using analog modular synthesizers, acoustic instruments, field recordings, and sounds taken from real objects and
          environments, and blended together with some of the best orchestral sample libraries available. The sonic experience
          draws the mind into abstract spaces and unseen worlds, beyond any single time or place.
        </p>

        <div class="homeQuickLinks">
          <p class="homeQuickLinksTitle">See more by Ull Hexa</p>
          <div class="homeBrandRow">
            ${SOCIAL_LINKS.map(logoLink).join("")}
          </div>
          <div class="homeDiscoRow">
            <span>For Sync licensing</span>
            ${actionButton({ href: "#sync", label: "Press here" })}
            <span>and continue to DISCO.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="contactGrid">
      <div class="contactPanel">
        <p class="contactRole">News / Projects</p>
        <h3 style="margin:0 0 14px;font-size:28px;line-height:1;">Coming soon</h3>
      </div>
    </div>
  `,

  sync: () => `
    <section class="pageStack">
      <div class="contactIntro">
        <h2>Music for Film, TV, & Games</h2>
        <p class="contactLead">Explore the musical releases by Ull Hexa</p>
      </div>

      <section class="flatSection">
        <h3>DISCO</h3>
        ${renderReleaseFeed(
          SYNC_RELEASES,
          "Album releases, artwork, notes, and DISCO links will be added here with the newest release at the top.",
          "sync"
        )}
      </section>
    </section>
  `,

  tools: () => toolsSection(
    "Plugins",
    renderReleaseFeed(
      TOOL_RELEASES.plugins,
      "Plugin releases will appear here with artwork, text, and download buttons for macOS and Windows."
    )
  ),

  plugins: () => toolsSection(
    "Plugins",
    renderReleaseFeed(
      TOOL_RELEASES.plugins,
      "Plugin releases will appear here with artwork, text, and download buttons for macOS and Windows."
    )
  ),

  skins: () => toolsSection("Serum 2 skins", renderSerumSkins()),

  visualizers: () => toolsSection(
    "Visualizers",
    renderVisualizerBadges()
  ),

  dnd: renderDndShowcase,

  contact: () => `
    <section class="contactShell">
      <div class="contactIntro">
        <h2>Ull Hexa</h2>
      </div>

      <div class="contactGrid">
        <div class="contactPanel contactIdentity">
          <div class="contactIdentityGlow"></div>
          <p class="contactRole">Ull Hexa</p>
          <h3>Direct contact</h3>
          <div class="contactChips">
            <div class="contactChip">ullhexa.music@gmail.com</div>
          </div>
          <p class="contactNote">
            For music, sound design, collaborations, licensing, or visualizer ideas, send a note here.
            The form is prepared for direct sending from the page, without opening a mail app.
          </p>
        </div>

        <div class="contactPanel">
          <form id="contactForm" class="contactForm">
            <input id="contactRecipient" name="recipient" type="hidden" value="ullhexa.music@gmail.com" />

            <div class="contactFieldRow">
              <div class="contactField">
                <label for="contactName">Your name</label>
                <input id="contactName" name="name" type="text" placeholder="Your name" required />
              </div>
              <div class="contactField">
                <label for="contactEmail">Your email</label>
                <input id="contactEmail" name="email" type="email" placeholder="you@example.com" required />
              </div>
            </div>

            <div class="contactField">
              <label for="contactSubject">Subject</label>
              <input id="contactSubject" name="subject" type="text" placeholder="Project, licensing, collaboration..." />
            </div>

            <div class="contactField">
              <label for="contactMessage">Message</label>
              <textarea id="contactMessage" name="message" rows="7" placeholder="Write a short message..." required></textarea>
            </div>

            <div class="contactActions">
              <button type="submit" id="contactSubmitBtn" class="contactPrimaryBtn">Send message</button>
            </div>
            <p id="contactStatus" class="contactStatus" role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>
  `
};

function routeFromHash() {
  return (location.hash || "#home").slice(1);
}

let cleanupPage = null;

function render() {
  cleanupPage?.();
  cleanupPage = null;
  const route = routeFromHash();
  const page = pages[route] || pages.home;
  content.classList.toggle("toolsPage", updateSiteNavigation(route));
  content.classList.toggle("dndPage", route === "dnd");
  content.classList.toggle("skinsPage", route === "skins");
  content.innerHTML = page();
  if (route === "skins") cleanupPage = mountSerumSkins(content);
  if (route === "dnd") mountDndShowcase(content);

  const contactForm = document.getElementById("contactForm");
  const contactRecipient = document.getElementById("contactRecipient");
  const contactName = document.getElementById("contactName");
  const contactEmail = document.getElementById("contactEmail");
  const contactSubject = document.getElementById("contactSubject");
  const contactMessage = document.getElementById("contactMessage");
  const contactSubmitBtn = document.getElementById("contactSubmitBtn");
  const contactStatus = document.getElementById("contactStatus");

  if (contactForm && contactRecipient && contactSubmitBtn && contactStatus) {
    const setContactStatus = (message, tone = "neutral") => {
      contactStatus.textContent = message;
      contactStatus.dataset.tone = tone;
    };

    const activeRecipientConfig = () => contactFormConfig[contactRecipient.value] || null;
    const hasAccessKey = () => {
      const config = activeRecipientConfig();
      return Boolean(config?.accessKey && !config.accessKey.startsWith("YOUR_WEB3FORMS_ACCESS_KEY"));
    };

    const formFieldsAreValid = () => {
      const nameValue = contactName?.value?.trim() || "";
      const emailValue = contactEmail?.value?.trim() || "";
      const messageValue = contactMessage?.value?.trim() || "";
      return Boolean(nameValue && messageValue && isValidEmail(emailValue));
    };

    const syncFormState = () => {
      const canSend = hasAccessKey() && formFieldsAreValid();
      contactSubmitBtn.disabled = !canSend;

      if (!hasAccessKey()) {
        setContactStatus("Form sending is not activated yet.", "warning");
        return;
      }

      if ((contactEmail?.value || "").trim() && !isValidEmail(contactEmail.value)) {
        setContactStatus("Please enter a valid email address.", "error");
        return;
      }

      if (!formFieldsAreValid()) {
        setContactStatus("Please fill in your name, email, and message before sending.", "warning");
        return;
      }

      setContactStatus("Ready to send.", "neutral");
    };

    [contactName, contactEmail, contactSubject, contactMessage].forEach(el => {
      if (el) el.addEventListener("input", syncFormState);
      if (el) el.addEventListener("change", syncFormState);
    });

    contactForm.addEventListener("submit", async e => {
      e.preventDefault();

      const recipientConfig = activeRecipientConfig();
      if (!recipientConfig || !hasAccessKey()) {
        syncFormState();
        return;
      }

      const payload = {
        access_key: recipientConfig.accessKey,
        subject: contactSubject?.value?.trim() || `New message for ${recipientConfig.label}`,
        from_name: contactName?.value?.trim() || "Website contact form",
        email: contactEmail?.value?.trim() || "",
        message: contactMessage?.value?.trim() || "",
        to_name: recipientConfig.label,
        botcheck: ""
      };

      if (!formFieldsAreValid()) {
        syncFormState();
        return;
      }

      contactSubmitBtn.disabled = true;
      contactSubmitBtn.textContent = "Sending...";
      setContactStatus("Sending message...", "neutral");

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Unable to send message.");
        }

        const selectedRecipient = contactRecipient.value;
        contactForm.reset();
        contactRecipient.value = selectedRecipient;
        setContactStatus("Message sent successfully.", "success");
      } catch (error) {
        setContactStatus(error.message || "Unable to send message right now.", "error");
      } finally {
        contactSubmitBtn.textContent = "Send message";
        syncFormState();
      }
    });

    syncFormState();
  }
}

window.addEventListener("hashchange", render);
render();
