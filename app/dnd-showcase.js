const imageRoot = "./assets/products/dnd/";

const slides = [
  {
    image: "citadel-console.png",
    title: "The adventure, at a glance",
    description: "The Blighted Citadel with a party and encounter loaded. Keep characters, enemies, initiative and hit points beside the map, ready for the next turn.",
    alt: "DM Control Center showing the Blighted Citadel, four player tokens, three enemies and the initiative panel."
  },
  {
    image: "conditions-initiative.png",
    title: "Keep track of every condition",
    description: "Open a character’s condition controls directly on the map. Poisoned, restrained and frightened markers help keep the state of the encounter visible, alongside the turn order.",
    alt: "Brom’s condition controls open over the Citadel, with Poisoned selected and condition markers visible in initiative."
  },
  {
    image: "spell-areas.png",
    title: "Give spells room to work",
    description: "Place, resize and rotate coloured circles, cones and squares to mark spell areas. On the Blighted Farm, a 15-foot radius, a cone, a square and a character aura make the battlefield easier to read.",
    alt: "The Blighted Farm with a red 15-foot spell radius, orange cone, blue square and blue character aura."
  },
  {
    image: "ruler-measurements.png",
    title: "Measure before you move",
    description: "Check distances directly on the map with the ruler. This measurement across the Blighted Ridge helps you judge movement and range before committing to an action.",
    alt: "A dashed ruler spanning the Blighted Ridge, displaying a distance of 83.1 feet."
  },
  {
    image: "autotrace.png",
    title: "Autotrace your movement",
    description: "Enable automatic movement measurement and drag a token: the ruler follows, showing the distance as you move. Here, Aria’s route through the Blighted Homestead measures 45.7 feet.",
    alt: "Aria being moved through the Blighted Homestead, with an automatic ruler tracing 45.7 feet from her starting position."
  },
  {
    image: "fog-of-war.png",
    title: "Reveal the world as you explore",
    description: "Paint and erase fog of war to control what the party can see. Mist covers the unexplored side of the Blighted Cavern while the DM keeps an overview of the encounter.",
    alt: "The Blighted Cavern with the party in a revealed passage and painted mist covering the eastern chambers."
  },
  {
    image: "dice-machine.png",
    title: "Roll without leaving the table",
    description: "The dice machine sits over the map, with dice from D4 to D100, individual results and a combined total. This roll at the Last Lantern combines a D20 and two D6s.",
    alt: "The dice machine over the Last Lantern map, showing a D20 result of 13 and two D6 results of 2 and 1, totalling 16."
  },
  {
    image: "citadel-floors.png",
    title: "There is more beneath the roof",
    description: "Uncover buildings and move between their available floors. The Citadel’s headquarters opens into its sewers, with the darkness control setting the mood for what waits below.",
    alt: "The Blighted Citadel’s headquarters on floor minus one, revealing its sewer interior with darkness set to 40 percent."
  }
];

export function renderDndShowcase() {
  const first = slides[0];
  return `
    <section class="dndShowcase">
      <div class="contactIntro dndIntro">
        <div class="dndTitleRow">
          <h2>Ull Hexa D&amp;D</h2>
          <a class="softActionBtn dndPlay" href="https://ullhexa.com/dnd/" target="_blank" rel="noopener noreferrer" aria-label="Play Ull Hexa D&D (opens in a new window)">Play <span aria-hidden="true">↗</span></a>
        </div>
        <p class="dndLead">A home for your next adventure. Run your Dungeons &amp; Dragons sessions with interactive maps, ready-to-load parties and encounters, and a DM console that keeps the action within reach.</p>
        <p class="dndDescription">Track initiative and conditions, place spell areas, measure movement and reveal the world with fog of war. Use the separate Player Display on a second screen while you manage the session from your console.</p>
        <p class="dndAvailability">Free to use. Runs in your browser.</p>
      </div>

      <section class="dndGallery" tabindex="0" aria-label="D&D feature gallery" aria-roledescription="carousel">
        <div class="dndGalleryControls">
          <button class="softActionBtn dndGalleryArrow" type="button" data-gallery-previous aria-label="Previous image" aria-controls="dndGallerySlide"><span aria-hidden="true">←</span></button>
          <p class="dndGalleryCount"><span data-gallery-count>01 / 08</span><span class="dndGalleryHint">Explore the console</span></p>
          <button class="softActionBtn dndGalleryArrow" type="button" data-gallery-next aria-label="Next image" aria-controls="dndGallerySlide"><span aria-hidden="true">→</span></button>
        </div>
        <figure id="dndGallerySlide" class="dndGallerySlide" aria-roledescription="slide" aria-label="1 of ${slides.length}">
          <a class="dndGalleryImageLink" data-gallery-fullsize href="${imageRoot}${first.image}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size screenshot (opens in a new window)">
            <img class="dndGalleryImage" data-gallery-image src="${imageRoot}${first.image}" alt="${first.alt}" width="1600" height="1000" decoding="async" />
          </a>
          <figcaption class="dndGalleryCaption" aria-live="polite" aria-atomic="true">
            <h3 data-gallery-title>${first.title}</h3>
            <p data-gallery-description>${first.description}</p>
          </figcaption>
        </figure>
      </section>
    </section>
  `;
}

export function mountDndShowcase(root) {
  const gallery = root.querySelector(".dndGallery");
  if (!gallery) return;
  const image = gallery.querySelector("[data-gallery-image]");
  const fullsize = gallery.querySelector("[data-gallery-fullsize]");
  const title = gallery.querySelector("[data-gallery-title]");
  const description = gallery.querySelector("[data-gallery-description]");
  const count = gallery.querySelector("[data-gallery-count]");
  const figure = gallery.querySelector(".dndGallerySlide");
  let index = 0;

  const show = next => {
    index = (next + slides.length) % slides.length;
    const slide = slides[index];
    image.src = fullsize.href = imageRoot + slide.image;
    image.alt = slide.alt;
    title.textContent = slide.title;
    description.textContent = slide.description;
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    figure.setAttribute("aria-label", `${index + 1} of ${slides.length}`);
  };

  gallery.querySelector("[data-gallery-previous]").addEventListener("click", () => show(index - 1));
  gallery.querySelector("[data-gallery-next]").addEventListener("click", () => show(index + 1));
  gallery.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: slides.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    show(next);
  });
}
