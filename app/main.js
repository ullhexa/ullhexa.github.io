import { startBackground } from "./bg.js?v=20260404b";
startBackground();

const content = document.getElementById("content");

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
  plugins: [],
  skins: [],
  nks: [],
  visualizers: []
};

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

function toolsNav(activeKey = "") {
  const items = [
    { key: "plugins", label: "Plugins", href: "#plugins" },
    { key: "skins", label: "Skins", href: "#skins" },
    { key: "nks", label: "NKS Instruments", href: "#nks" },
    { key: "visualizers", label: "Visualizers", href: "#visualizers" }
  ];

  return `
    <div class="toolButtonRow">
      ${items.map(item => actionButton({ href: item.href, label: item.label, active: item.key === activeKey })).join("")}
    </div>
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

function toolsSection(title, activeKey, contentHtml) {
  return `
    <section class="contactShell">
      <div class="contactIntro">
        <p class="contactEyebrow">Tools</p>
      </div>
      ${toolsNav(activeKey)}
      <div class="contactIntro">
        <h2>${title}</h2>
      </div>
      ${contentHtml}
    </section>
  `;
}

const pages = {
  home: () => `
    <div class="contactIntro">
      <p class="contactEyebrow">Home</p>
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
        <p class="contactEyebrow">Sync</p>
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
    "plugins",
    renderReleaseFeed(
      TOOL_RELEASES.plugins,
      "Plugin releases will appear here with artwork, text, and download buttons for macOS and Windows."
    )
  ),

  plugins: () => toolsSection(
    "Plugins",
    "plugins",
    renderReleaseFeed(
      TOOL_RELEASES.plugins,
      "Plugin releases will appear here with artwork, text, and download buttons for macOS and Windows."
    )
  ),

  skins: () => toolsSection(
    "Skins",
    "skins",
    renderReleaseFeed(
      TOOL_RELEASES.skins,
      "Skin pack releases will appear here with artwork, text, and download buttons for macOS and Windows."
    )
  ),

  nks: () => toolsSection(
    "NKS Instruments",
    "nks",
    renderReleaseFeed(
      TOOL_RELEASES.nks,
      "NKS instrument releases will appear here with artwork, text, and download buttons for macOS and Windows."
    )
  ),

  visualizers: () => toolsSection(
    "Visualizers",
    "visualizers",
    `
      <section class="flatSection">
        <h3>Choose visualizer type:</h3>
        <div class="visualizerChooser">
          ${actionButton({ href: "./midi-visualizers.html?v=20260408a", label: "MIDI Visualizer", external: true })}
          ${actionButton({ href: "./audio-visualizers.html?v=20260408a", label: "Audio Visualizer", external: true })}
        </div>
      </section>

      <section class="flatSection">
        <h3>About the visualizers</h3>
        ${renderReleaseFeed(
          TOOL_RELEASES.visualizers,
          "Visualizer descriptions, screenshots, and release notes will appear here."
        )}
      </section>
    `
  ),

  contact: () => `
    <section class="contactShell">
      <div class="contactIntro">
        <p class="contactEyebrow">Contact</p>
        <h2>Ull Hexa</h2>
        <p class="contactLead">
          For music, sound design, collaborations, licensing, or visualizer ideas, send a note here.
          The form below is prepared for direct sending from the page, without opening a mail app.
        </p>
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
            Use the Ull Hexa address for music, sound design, licensing, collaboration, or visualizer inquiries.
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

function render() {
  const route = routeFromHash();
  const page = pages[route] || pages.home;
  content.innerHTML = page();

  document.querySelectorAll(".nav a").forEach(a => {
    const href = a.getAttribute("href").slice(1);
    a.classList.toggle("active", href === route);
  });

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
