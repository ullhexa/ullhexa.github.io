import { startBackground } from "./bg.js";
startBackground();

const content = document.getElementById("content");

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

const pages = {
  home: () => `
    <h2>Home</h2>

    <div class="bio">
      <img src="./assets/profile.png" alt="Profile photo" class="bio-img" />

      <div class="bio-text">
        <p><strong>Ull Hexa</strong></p>
        <p>
          Ull Hexa is a TV- and game-music composer and sound sculptor from Norway, obsessed with 
          shaping sounds that flip your mind into deep rooted yet unexplored sonic 
          landscapes. All sounds are made by hand and ear, using analog modular 
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
    <h2>Contact</h2>
    <p>Links and basic contact info.</p>
    <ul>
      <li>Email: <a href="mailto:you@domain.com">you@domain.com</a></li>
      <li>Linktree: <a href="#" target="_blank" rel="noreferrer">add link</a></li>
      <li>Instagram: <a href="#" target="_blank" rel="noreferrer">add link</a></li>
      <li>Spotify: <a href="#" target="_blank" rel="noreferrer">add link</a></li>
    </ul>
  `,
};



function routeFromHash() {
  return (location.hash || "#home").slice(1);
}

function render() {
  const route = routeFromHash();
  const page = pages[route] || pages.home;
  content.innerHTML = page();
}

window.addEventListener("hashchange", render);
render();

