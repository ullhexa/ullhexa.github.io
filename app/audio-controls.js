// Each mode owns only the controls it exposes. Hidden sliders are never inputs.
export const MODE_DEFINITIONS = Object.freeze({
  "stereo-osc": {
    label: "Quantum string",
    defaults: { energy: 100, zoom: 100, speed: 5.45, phase: 66, phaseResponse: 74, bassEmphasis: 89, strobe: 48, strobeLfo: 102, warp: 100, fold: 68, foldResponse: 0 },
    extraControls: []
  },
  fractals: {
    label: "Alien trees",
    defaults: { energy: 100, shape: 50, shapeLfo: 0, fruits: 50, fruitsLfo: 0, rain: 40, dropSize: 0 },
    extraControls: []
  },
  cat: {
    label: "Space cat",
    defaults: { energy: 100 },
    extraControls: ["catFragmentSets"]
  },
  "bpm-lab": {
    label: "BPM Lab",
    defaults: {},
    extraControls: []
  }
});

export function numericValue(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export class ModeControls {
  constructor(elements, initialMode = "stereo-osc") {
    this.elements = elements;
    this.mode = initialMode;
    this.states = Object.fromEntries(Object.entries(MODE_DEFINITIONS).map(([mode, definition]) => [mode, { ...definition.defaults }]));
    this.apply();
  }

  get definition() { return MODE_DEFINITIONS[this.mode]; }
  get visible() { return new Set([...Object.keys(this.definition.defaults), ...this.definition.extraControls]); }

  value(key, fallback = 0) {
    if (!Object.hasOwn(this.definition.defaults, key)) return fallback;
    return numericValue(this.elements[key]?.value, this.definition.defaults[key]);
  }

  save() {
    for (const key of Object.keys(this.definition.defaults)) this.states[this.mode][key] = this.value(key);
  }

  apply() {
    for (const [key, value] of Object.entries(this.states[this.mode])) {
      if (this.elements[key]) this.elements[key].value = String(value);
    }
  }

  select(mode) {
    this.save();
    this.mode = Object.hasOwn(MODE_DEFINITIONS, mode) ? mode : "stereo-osc";
    this.apply();
    return this.mode;
  }

  reset() {
    this.states[this.mode] = { ...this.definition.defaults };
    this.apply();
  }

  randomize(random = Math.random) {
    for (const key of Object.keys(this.definition.defaults)) {
      if (key === "zoom") continue;
      const slider = this.elements[key];
      if (!slider) continue;
      const min = numericValue(slider.min);
      const max = numericValue(slider.max, 100);
      const step = numericValue(slider.step, 1) || 1;
      const ticks = Math.floor((max - min) / step);
      const value = min + Math.floor(random() * (ticks + 1)) * step;
      slider.value = String(Math.max(min, Math.min(max, value)));
    }
    this.save();
  }
}
