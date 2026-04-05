import { startBackground } from "./bg.js?v=20260404b";
startBackground();

const content = document.getElementById("content");
const contactFormConfig = {
  "ullhexa.music@gmail.com": {
    label: "Ull Hexa Music",
    accessKey: "c7605148-53c9-4fc9-9bcd-93ecac1b4a23"
  }
};

function packCard({ title, desc, img, url, buttonText = "Open Google Drive" }) {
  return `
    <div class="pack">
      <img class="pack-img" src="${img}" alt="${title}" loading="lazy" />
      <div class="pack-body">
        <h3 class="pack-title">${title}</h3>
        <p class="pack-desc">${desc}</p>
        <a class="pack-btn" href="${url}" target="_blank" rel="noreferrer">⬇ ${buttonText}</a>
      </div>
    </div>
  `;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const pages = {
  home: () => `
    <h2>Home</h2>

    <div class="bio">
      <img src="./assets/profile.png" alt="Profile photo" class="bio-img" />

      <div class="bio-text">
        <p><strong>Ull Hexa</strong></p>
        <p>
          Ull Hexa is a TV- and game-music composer and sound sculptor from Norway, obsessed with 
          crafting sounds that fuses the tribal instictual with the futuristic unknown. All sounds are made by hand and ear, using analog modular 
          synthesizers, acoustic instruments, field recordings, and sounds taken from 
          real objects and environments, and blended together with some of the best 
          orchestral sample libraries available. The sonic experience draws the mind 
          into abstract spaces and unseen worlds, beyond any single time or place. 
        </p>
        <p>
          Everything here is free and shared openly.
        </p>
      </div>
    </div>
  `,


  skins: () => `
    <h2>Skins</h2>
    <p>Free skin packs for synths.</p>

    ${packCard({
      title: "Serum — Dark Glass Skin Pack",
      desc: "High-contrast, minimal, night-friendly.",
      img: "./assets/skins/serum-dark-glass.png",
      url: "PASTE_YOUR_GOOGLE_DRIVE_FOLDER_LINK_HERE",
    })}

    ${packCard({
      title: "Vital — Mono UI Pack",
      desc: "Clean monochrome UI with subtle accents.",
      img: "./assets/skins/vital-mono.png",
      url: "PASTE_YOUR_GOOGLE_DRIVE_FOLDER_LINK_HERE",
    })}
  `,


  presets: () => `
    <h2>Presets</h2>
    <p>Free preset packs for synths.</p>

    ${packCard({
      title: "Serum — Psy / Tech Pack",
      desc: "Bass, leads, atmospheres. Clean + musical.",
      img: "./assets/presets/serum-pack.png",
      url: "PASTE_GOOGLE_DRIVE_LINK",
    })}

    ${packCard({
      title: "Pigments — Ambient Pack",
      desc: "Textures, pads, evolving sounds.",
      img: "./assets/presets/pigments-pack.png",
      url: "PASTE_GOOGLE_DRIVE_LINK",
    })}
  `,


  samples: () => `
    <h2>Samples</h2>
    <p>Free sample packs made during music sessions.</p>

    ${packCard({
      title: "Drum One-Shots",
      desc: "Kicks, snares, hats. Clean, punchy, usable.",
      img: "./assets/samples/drum-oneshots.png",
      url: "PASTE_GOOGLE_DRIVE_LINK",
    })}

    ${packCard({
      title: "Textures & Atmospheres",
      desc: "Organic noise, drones, field-style textures.",
      img: "./assets/samples/textures.png",
      url: "PASTE_GOOGLE_DRIVE_LINK",
    })}

    ${packCard({
      title: "FX & Risers",
      desc: "Impacts, sweeps, transitions.",
      img: "./assets/samples/fx-risers.png",
      url: "PASTE_GOOGLE_DRIVE_LINK",
    })}
  `,


  contact: () => `
    <section class="contactShell">
      <div class="contactIntro">
        <p class="contactEyebrow">Contact</p>
        <h2>Fredrik Gjerstad Støpamo</h2>
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
            <div class="contactChip">fstopamo@gmail.com</div>
            <div class="contactChip">ullhexa.music@gmail.com</div>
          </div>
          <p class="contactNote">
            Use the personal address for direct contact, or the Ull Hexa address for music-related inquiries.
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
  `,


  visualizers: () => `
    <h2>Visualizers</h2>
    <p>Choose input type:</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;max-width:680px;">
      <a href="./midi-visualizers.html?v=20260404b" target="_blank" rel="noreferrer" style="display:inline-block;text-align:center;text-decoration:none;color:#fff;border:1px solid #555;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.06);transition:background 0.06s ease;" onmouseover="this.style.transition='background 0s';this.style.background='rgba(220,220,220,0.28)'" onmouseout="this.style.transition='background 0.14s ease';this.style.background='rgba(255,255,255,0.06)'">MIDI Visualizers</a>
      <a href="./audio-visualizers.html?v=20260404b" target="_blank" rel="noreferrer" style="display:inline-block;text-align:center;text-decoration:none;color:#fff;border:1px solid #555;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.06);transition:background 0.06s ease;" onmouseover="this.style.transition='background 0s';this.style.background='rgba(220,220,220,0.28)'" onmouseout="this.style.transition='background 0.14s ease';this.style.background='rgba(255,255,255,0.06)'">Audio Visualizers</a>
    </div>
  `,
};

const mutedRoutes = new Set(["skins", "presets", "samples"]);


function routeFromHash() {
  const route = (location.hash || "#home").slice(1);
  return mutedRoutes.has(route) ? "home" : route;
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
