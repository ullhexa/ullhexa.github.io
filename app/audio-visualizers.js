import { ModeControls } from "./audio-controls.js?v=20260927";
import { AudioInputSession, isSafari } from "./audio-input.js";
import { BeatSession } from "./beat-session.js?v=groove-2";
import { beatMotion } from "./beat-motion.js";
import { CatBounce } from "./cat-bounce.js?v=2";

// Reversible comparison: ?catBounce=previous retains the exact prior bounce.
const catBounceVersion = new URLSearchParams(window.location.search).get("catBounce");
const useSmoothCatBounce = catBounceVersion !== "previous";
const catBounce = new CatBounce();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const inputHelpEl = document.getElementById("inputHelp");
const viewBtn = document.getElementById("viewBtn");
const viewExitBtn = document.getElementById("viewExitBtn");
const settingsToggleBtn = document.getElementById("settingsToggle");
const settingsResetBtn = document.getElementById("settingsReset");
const settingsRandomizeBtn = document.getElementById("settingsRandomize");
const helpToggleBtn = document.getElementById("helpToggleBtn");
const helpBubble = document.getElementById("helpBubble");
const settingsPanel = document.getElementById("settingsPanel");
const micBtn = document.getElementById("micBtn");
const speakerBtn = document.getElementById("speakerBtn");
const xMultControls = document.getElementById("xMultControls");
const energySlider = document.getElementById("energySlider");
const energyValue = document.getElementById("energyValue");
const zoomSlider = document.getElementById("zoomSlider");
const zoomValue = document.getElementById("zoomValue");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const phaseSlider = document.getElementById("phaseSlider");
const phaseValue = document.getElementById("phaseValue");
const phaseResponseSlider = document.getElementById("phaseResponseSlider");
const phaseResponseValue = document.getElementById("phaseResponseValue");
const shapeSlider = document.getElementById("shapeSlider");
const shapeValue = document.getElementById("shapeValue");
const modeSelect = document.getElementById("modeSelect");
const shapeControl = document.getElementById("shapeControl");
const shapeLfoRange = document.getElementById("shapeLfoRange");
const shapeLfoLine = document.getElementById("shapeLfoLine");
const shapeLfoDot = document.getElementById("shapeLfoDot");
const bassEmphasisSlider = document.getElementById("bassEmphasisSlider");
const bassEmphasisValue = document.getElementById("bassEmphasisValue");
const shapeLfoSlider = document.getElementById("shapeLfoSlider");
const shapeLfoValue = document.getElementById("shapeLfoValue");
const fruitControl = document.getElementById("fruitControl");
const fruitsSlider = document.getElementById("fruitsSlider");
const fruitsValue = document.getElementById("fruitsValue");
const rainSlider = document.getElementById("rainSlider");
const rainValue = document.getElementById("rainValue");
const dropSizeSlider = document.getElementById("dropSizeSlider");
const dropSizeValue = document.getElementById("dropSizeValue");
const fruitsLfoSlider = document.getElementById("fruitsLfoSlider");
const fruitsLfoValue = document.getElementById("fruitsLfoValue");
const fruitLfoRange = document.getElementById("fruitLfoRange");
const fruitLfoLine = document.getElementById("fruitLfoLine");
const fruitLfoDot = document.getElementById("fruitLfoDot");
const strobeSlider = document.getElementById("strobeSlider");
const strobeValue = document.getElementById("strobeValue");
const strobeLfoSlider = document.getElementById("strobeLfoSlider");
const strobeLfoValue = document.getElementById("strobeLfoValue");
const strobeLfoDot = document.getElementById("strobeLfoDot");
const strobeLfoLine = document.getElementById("strobeLfoLine");
const warpSlider = document.getElementById("warpSlider");
const warpValue = document.getElementById("warpValue");
const foldSlider = document.getElementById("foldSlider");
const foldValue = document.getElementById("foldValue");
const foldResponseSlider = document.getElementById("foldResponseSlider");
const foldResponseValue = document.getElementById("foldResponseValue");
const settingsMenu = document.getElementById("settingsMenu");
const bpmLabPanel = document.getElementById("bpmLabPanel");
const bpmReadout = document.getElementById("bpmReadout");
const bpmState = document.getElementById("bpmState");
const bpmCandidate = document.getElementById("bpmCandidate");
const bpmEvidence = document.getElementById("bpmEvidence");
const bpmExplanation = document.getElementById("bpmExplanation");
const bpmHold = document.getElementById("bpmHold");
const bpmHalf = document.getElementById("bpmHalf");
const bpmDouble = document.getElementById("bpmDouble");
const bpmTap = document.getElementById("bpmTap");
const bpmRelearn = document.getElementById("bpmRelearn");
const bpmPhase = document.getElementById("bpmPhase");
const beatSession = new BeatSession();
const catSetButtons = Array.from(document.querySelectorAll(".catSetBtn[data-disco-group]"));
const xMultButtons = Array.from(document.querySelectorAll(".xMultBtn"));
const sliderRows = Array.from(document.querySelectorAll(".sliderRow[data-control]"));
const helpEntries = Array.from(document.querySelectorAll("#helpBubble [data-help-control]"));

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const sliderKeyToEl = {
  energy: energySlider,
  shape: shapeSlider,
  zoom: zoomSlider,
  speed: speedSlider,
  phase: phaseSlider,
  phaseResponse: phaseResponseSlider,
  bassEmphasis: bassEmphasisSlider,
  shapeLfo: shapeLfoSlider,
  fruits: fruitsSlider,
  rain: rainSlider,
  dropSize: dropSizeSlider,
  fruitsLfo: fruitsLfoSlider,
  strobe: strobeSlider,
  strobeLfo: strobeLfoSlider,
  warp: warpSlider,
  fold: foldSlider,
  foldResponse: foldResponseSlider
};
const modeControls = new ModeControls(sliderKeyToEl);
let currentMode = ["smooth", "previous"].includes(catBounceVersion) ? "cat" : modeControls.mode;
const controlRowMap = new Map(sliderRows.map(row => [row.dataset.control, row]));
let visibleControls = modeControls.visible;
const modeAssetLoads = new Map();

function ensureModeAssets(mode) {
  const loader = { fractals: preloadFractalTextures, cat: preloadCatV2Textures }[mode];
  if (loader && !modeAssetLoads.has(mode)) modeAssetLoads.set(mode, loader());
}

function setMode(mode) {
  currentMode = modeControls.select(mode);
  modeSelect.value = currentMode;
  visibleControls = modeControls.visible;
  applyControlVisibility();
  updateModeSpecificUI();
  // Canvas drawing state and pixels from another engine must not leak across modes.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  oscLastTimeSec = performance.now() * 0.001;
  fractalRuntime.lastNowMs = performance.now();
  catV2Runtime.lastMs = performance.now();
  rainRuntime.lastMs = performance.now();
  ensureModeAssets(currentMode);
  updateInputUI();
}

// 8 fast feature lanes (speed-first):
// 1) volumeRms, 2) peak, 3) spectralCentroid,
// 4) bassEnergy, 5) midEnergy, 6) highEnergy,
// 7) spectralFlux, 8) zeroCrossingRate
const features = {
  volumeRms: 0,
  rmsDb: -60,
  peak: 0,
  spectralCentroid: 0,
  bassEnergy: 0,
  lowBass: 0,
  lowBand110: 0,
  lowBand150: 0,
  lowBand60250: 0,
  kickBand: 0,
  midEnergy: 0,
  highEnergy: 0,
  highAir: 0,
  spectralFlux: 0,
  zeroCrossingRate: 0,
  onset: 0,
  lowSub: 0,
  detectorRms: 0,
  detectorPeak: 0,
  detectorLowBand60250: 0,
  detectorKickBand: 0,
  detectorOnset: 0
};

const quadratureTraceX = new Float32Array(1400);
const quadratureTraceY = new Float32Array(1400);

let audioReady = false;
let audioCtx = null;
let analyser = null;
let timeData = null;
let freqData = null;
let prevFreq = null;
let prevFreqDet = null;
let fluxEma = 0;
let fluxDetEma = 0;
let microtuneNormEma = 0;
let oscSizeEma = 0;
let bassBandEma = 0;
let lowPhaseLagEma = 0;
let oscPhaseX = 0;
let oscPhaseY = 0;
let oscLastTimeSec = performance.now() * 0.001;
const microtuneAdaptive = { floor: 0.01, ceil: 0.10 };
const colorAdaptive = {
  rms: { floor: 0.01, ceil: 0.18 },
  low: { floor: 0.003, ceil: 0.10 },
  mid: { floor: 0.003, ceil: 0.09 },
  high: { floor: 0.003, ceil: 0.09 }
};
let xFreqMultiplier = 1;
let phaseOffsetCycles = 0;
let currentStream = null;
let currentInputType = "none"; // none | mic | speaker
let isViewOnly = false;
let viewExitHideTimer = null;
const fractalTextures = {
  base: null,
  low: null,
  high: null,
  readyCount: 0
};
const fractalRuntime = {
  frameIndex: 0,
  lastNowMs: performance.now(),
  dtEmaMs: 16.7,
  baseAlphaEma: 0,
  lowAlphaEma: 0,
  highAlphaEma: 0,
  highFastEma: 0,
  highSlowEma: 0,
  highPeakEma: 0,
  highGateOpen: 0
};
const coverDrawCache = {
  w: 0,
  h: 0,
  base: null,
  low: null,
  high: null
};
const rainRuntime = {
  particles: [],
  lastMs: performance.now()
};
const CAT_WALLPAPER_SOURCES = Array.from({ length: 6 }, (_, i) => `assets/CAT_Project/Wallpapers/wall${i + 1}.webp`);
const CAT_DRIFT_SOURCES = {
  planetWhite: "assets/CAT_Project/Drift/Planet_white.webp",
  planetRed: "assets/CAT_Project/Drift/Planet_red.webp",
  planetRings: "assets/CAT_Project/Drift/Planet_rings.webp",
  planetIce: "assets/CAT_Project/Drift/Planet_ice copy.webp",
  planetLava: "assets/CAT_Project/Drift/Planet_lava copy.webp",
  planetPoison: "assets/CAT_Project/Drift/Planet_poison copy.webp?v=20260315a",
  planetAcid: "assets/CAT_Project/Drift/Planet_acid.webp",
  moon: "assets/CAT_Project/Drift/Moon.webp",
  planetWhiteDistance: "assets/CAT_Project/Drift/Planet_white_distance.webp",
  planetRedDistance: "assets/CAT_Project/Drift/Planet_red_distance.webp",
  planetRingsDistance: "assets/CAT_Project/Drift/Planet_rings_distance.webp",
  planetIceDistance: "assets/CAT_Project/Drift/Planet_ice_distance.webp",
  planetLavaDistance: "assets/CAT_Project/Drift/Planet_lava_distance.webp",
  planetPoisonDistance: "assets/CAT_Project/Drift/Planet_poison_distance.webp",
  planetAcidDistance: "assets/CAT_Project/Drift/Planet_acid_distance.webp",
  moonDistance: "assets/CAT_Project/Drift/Moon_distance.webp"
};
const CAT_DRIFT_PLANET_TYPES = ["red", "white", "rings", "ice", "lava", "poison", "acid"];
const CAT_GLOW_SOURCE = "assets/CAT_Project/Glow.webp";
const CAT_FACE_SOURCE = "assets/CAT_Project/Face.webp";
const CAT_EYE_SOURCES = {
  l1: "assets/CAT_Project/Eyes/L1_eyesocket.webp",
  l2: "assets/CAT_Project/Eyes/L2_eyeball.webp",
  l3: "assets/CAT_Project/Eyes/L3_Iris.webp",
  l4: "assets/CAT_Project/Eyes/L4_pupil.webp"
};
const CAT_PUPIL_LEVELS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4];
function catPupilSource(level) {
  if (level === 0) return "assets/CAT_Project/Eyes/pupils_dilate/Default_pupil.webp";
  const sign = level > 0 ? "+" : "";
  return `assets/CAT_Project/Eyes/pupils_dilate/${sign}${level}_pupil.webp`;
}
const CAT_EYELID_SOURCES = Array.from({ length: 3 }, (_, i) => `assets/CAT_Project/Eyelids/lid${i + 1}.webp`);
const CAT_WHISKER_SOURCES = Array.from({ length: 6 }, (_, i) => `assets/CAT_Project/Whiskers/whisk${i + 1}.webp`);
const CAT_OBJECT_SOURCES = {
  evilL: "assets/CAT_Project/Objects/alien_evil_L.webp",
  evilR: "assets/CAT_Project/Objects/alien_evil_R.webp",
  nice: "assets/CAT_Project/Objects/nice_alien.webp",
  plasmaEvil: "assets/CAT_Project/Objects/plasma_evil.webp",
  plasmaNice: "assets/CAT_Project/Objects/nice_plasma.webp",
  shield: "assets/CAT_Project/Objects/shield.webp",
  shieldImpact: "assets/CAT_Project/Objects/shield_impact.webp",
  missile: "assets/CAT_Project/Objects/missile.webp",
  missileHit: [
    "assets/CAT_Project/Objects/missile_hit1.webp",
    "assets/CAT_Project/Objects/missile_hit2.webp",
    "assets/CAT_Project/Objects/missile_hit3.webp",
    "assets/CAT_Project/Objects/missile_hit4.webp"
  ]
};
const CAT_FRAGMENT_DISCO_GROUPS = {
  Metals: ["Set_4", "Set_5", "Set_7"],
  Pulses: ["Set_8", "Set_9"]
};
const CAT_FRAGMENT_SET_SPECS = [
  { folder: "Set_4", prefix: "d" },
  { folder: "Set_5", prefix: "e" },
  { folder: "Set_7", prefix: "g" },
  { folder: "Set_8", prefix: "h" },
  { folder: "Set_9", prefix: "i" }
];
const CAT_FRAGMENT_RESPONSE_STATIC = 0.90;
const CAT_FRAGMENT_POOL_STATIC = 24;
function buildCatFragmentSources() {
  const out = [];
  for (const set of CAT_FRAGMENT_SET_SPECS) {
    for (let n = 1; n <= 82; n++) {
      out.push({
        src: `assets/CAT_Project/Fragments/${set.folder}/${set.prefix}-${n}.webp`,
        prefix: set.prefix,
        groupKey: String(n),
        setFolder: set.folder
      });
    }
  }
  return out;
}
const CAT_FRAGMENT_SOURCES = buildCatFragmentSources();
const catV2Textures = {
  wallpapers: [],
  glow: null,
  eyes: { l1: null, l2: null, l3: null, l4: null },
  pupils: {},
  face: null,
  fragments: [],
  fragmentGroups: [],
  eyelids: [],
  whiskers: [],
  drift: {
    planetWhite: null,
    planetRed: null,
    planetRings: null,
    planetIce: null,
    planetLava: null,
    planetPoison: null,
    planetAcid: null,
    moon: null,
    planetWhiteDistance: null,
    planetRedDistance: null,
    planetRingsDistance: null,
    planetIceDistance: null,
    planetLavaDistance: null,
    planetPoisonDistance: null,
    planetAcidDistance: null,
    moonDistance: null
  },
  objects: {
    evilL: null,
    evilR: null,
    nice: null,
    plasmaEvil: null,
    plasmaNice: null,
    shield: null,
    shieldImpact: null,
    missile: null,
    missileHit: []
  },
  readyCount: 0,
  totalCount: 0
};
const catV2Runtime = {
  lastMs: performance.now(),
  wallpaperA: 0,
  wallpaperB: 1,
  wallpaperFade: 0,
  wallpaperFadeDur: 6,
  wallpaperHoldSec: 7,
  stars: [],
  starsW: 0,
  starsH: 0,
  starsInitialized: false,
  driftBodies: [],
  driftSpawnSec: 4 + Math.random() * 8,
  catScaleEma: 1,
  alienCombatActive: false,
  alienCombatEntering: false,
  alienPreShrinkTimer: 0,
  preCombatStage: "idle",
  preCombatTimer: 0,
  catPreScaleTarget: null,
  combatSettleTimer: 0,
  alienCombatExiting: false,
  alienCombatTimer: 0,
  alienCombatElapsed: 0,
  alienEscapeStartSec: 30,
  alienEnterTimer: 0,
  alienEnterDuration: 0,
  alienEntryStartNX: 0,
  alienEntryStartNY: 0,
  alienEntryStartEX: 0,
  alienEntryStartEY: 0,
  alienEntryTargetNX: 0,
  alienEntryTargetNY: 0,
  alienEntryTargetEX: 0,
  alienEntryTargetEY: 0,
  alienCombatCooldown: 4 + Math.random() * 8,
  alienExitDirX: 1,
  alienExitDirY: 0,
  alienExitFollowDelay: 0,
  alienExitTimer: 0,
  reactionDelaySec: 0.30,
  evil: {
    x: 0, y: 0, vx: 0, vy: 0, hurt: 0,
    dropCooldown: 0.4 + Math.random() * 0.8,
    missileCredit: 0,
    shieldActive: false,
    shieldTimer: 0,
    shieldCooldown: 4 + Math.random() * 8,
    shieldImpactTimer: 0
  },
  nice: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, hurt: 0, fireCooldown: 0.2 + Math.random() * 0.4, burstShots: 0, burstGap: 0, burstTimer: 0, evadeAngle: 0, evadeTimer: 0, aiming: false, aimTimer: 0, sideSign: 1, tacticMode: "level", tacticTimer: 0 },
  niceShotSide: 1,
  combatOrbitAngle: Math.random() * Math.PI * 2,
  niceHistory: [],
  evilHistory: [],
  niceShots: [],
  evilShots: [],
  evilMissiles: [],
  missileBursts: [],
  glowEma: 0,
  irisX: 0,
  irisY: 0,
  irisTargetX: 0,
  irisTargetY: 0,
  irisTargetTimer: 0,
  eyeFocusTarget: "nice",
  eyeFocusSwitchSec: 2.5 + Math.random() * 3.5,
  activeFragments: [],
  activeFragmentSetFolders: new Set(CAT_FRAGMENT_SET_SPECS.map(s => s.folder)),
  fragmentSpawnCooldown: 0,
  blinkActive: false,
  blinkSeq: [],
  blinkStep: 0,
  blinkStepTimer: 0,
  nextBlinkSec: 3 + Math.random() * 8,
  whiskActive: false,
  whiskDir: 1,
  whiskIndex: 1,
  whiskStepTimer: 0,
  whiskNextSec: 4 + Math.random() * 10,
  bobEma: 0,
  thumpFast: 0,
  thumpSlow: 0,
  beatNormFast: 0,
  beatNormSlow: 0,
  bassPresenceEma: 0,
  bassHoldSec: 0,
  quietSec: 0,
  driftX: 0,
  driftY: 0,
  driftTargetX: 0,
  driftTargetY: 0,
  driftTimer: 0,
  danceBurstSec: 0,
  tiltDeg: 0,
  tiltTargetDeg: 0,
  cuteTiltSec: 0,
  cuteTiltTotalSec: 0,
  cuteTiltAmpDeg: 0,
  cuteTiltDir: 1,
  queuedDoubleBlink: false,
  pupilCurrent: 0,
  pupilTarget: 0,
  pupilMode: "idle", // idle | cascade | hold | return
  pupilModeSec: 0,
  pupilRoamSec: 0,
  pupilRoamMin: -1,
  pupilRoamMax: 1,
  pupilCascadeEdge: 0,
  pupilCascadeStepSec: 0,
  pupilHighBassSec: 0,
  pupilReturnToDefault: true,
  nextPupilEventSec: 26 + Math.random() * 38,
  pupilExtreme: false
};

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function preloadFractalTextures() {
  const targets = [
    { key: "base", src: "assets/Neon_trees_1.webp" },
    { key: "low", src: "assets/Neon_trees_2.webp" },
    { key: "high", src: "assets/Neon_trees_3.webp" }
  ];
  const loaded = await Promise.allSettled(targets.map(t => loadImage(t.src)));
  loaded.forEach((res, idx) => {
    const key = targets[idx].key;
    if (res.status === "fulfilled") {
      fractalTextures[key] = res.value;
      fractalTextures.readyCount++;
    } else {
      // Keep running without blocking if an image fails.
      fractalTextures[key] = null;
    }
  });
}

async function preloadCatV2Textures() {
  const targets = [];
  CAT_WALLPAPER_SOURCES.forEach((src, i) => targets.push({ key: `wall_${i}`, src }));
  targets.push({ key: "glow", src: CAT_GLOW_SOURCE });
  targets.push({ key: "face", src: CAT_FACE_SOURCE });
  targets.push({ key: "eye_l1", src: CAT_EYE_SOURCES.l1 });
  targets.push({ key: "eye_l2", src: CAT_EYE_SOURCES.l2 });
  targets.push({ key: "eye_l3", src: CAT_EYE_SOURCES.l3 });
  targets.push({ key: "eye_l4", src: CAT_EYE_SOURCES.l4 });
  CAT_PUPIL_LEVELS.forEach(level => targets.push({ key: `pupil_${level}`, src: catPupilSource(level), level }));
  CAT_EYELID_SOURCES.forEach((src, i) => targets.push({ key: `lid_${i + 1}`, src }));
  CAT_WHISKER_SOURCES.forEach((src, i) => targets.push({ key: `whisk_${i + 1}`, src }));
  targets.push({ key: "drift_planetWhite", src: CAT_DRIFT_SOURCES.planetWhite });
  targets.push({ key: "drift_planetRed", src: CAT_DRIFT_SOURCES.planetRed });
  targets.push({ key: "drift_planetRings", src: CAT_DRIFT_SOURCES.planetRings });
  targets.push({ key: "drift_planetIce", src: CAT_DRIFT_SOURCES.planetIce });
  targets.push({ key: "drift_planetLava", src: CAT_DRIFT_SOURCES.planetLava });
  targets.push({ key: "drift_planetPoison", src: CAT_DRIFT_SOURCES.planetPoison });
  targets.push({ key: "drift_planetAcid", src: CAT_DRIFT_SOURCES.planetAcid });
  targets.push({ key: "drift_moon", src: CAT_DRIFT_SOURCES.moon });
  targets.push({ key: "drift_planetWhite_distance", src: CAT_DRIFT_SOURCES.planetWhiteDistance });
  targets.push({ key: "drift_planetRed_distance", src: CAT_DRIFT_SOURCES.planetRedDistance });
  targets.push({ key: "drift_planetRings_distance", src: CAT_DRIFT_SOURCES.planetRingsDistance });
  targets.push({ key: "drift_planetIce_distance", src: CAT_DRIFT_SOURCES.planetIceDistance });
  targets.push({ key: "drift_planetLava_distance", src: CAT_DRIFT_SOURCES.planetLavaDistance });
  targets.push({ key: "drift_planetPoison_distance", src: CAT_DRIFT_SOURCES.planetPoisonDistance });
  targets.push({ key: "drift_planetAcid_distance", src: CAT_DRIFT_SOURCES.planetAcidDistance });
  targets.push({ key: "drift_moon_distance", src: CAT_DRIFT_SOURCES.moonDistance });
  targets.push({ key: "obj_evilL", src: CAT_OBJECT_SOURCES.evilL });
  targets.push({ key: "obj_evilR", src: CAT_OBJECT_SOURCES.evilR });
  targets.push({ key: "obj_nice", src: CAT_OBJECT_SOURCES.nice });
  targets.push({ key: "obj_plasmaEvil", src: CAT_OBJECT_SOURCES.plasmaEvil });
  targets.push({ key: "obj_plasmaNice", src: CAT_OBJECT_SOURCES.plasmaNice });
  targets.push({ key: "obj_shield", src: CAT_OBJECT_SOURCES.shield });
  targets.push({ key: "obj_shieldImpact", src: CAT_OBJECT_SOURCES.shieldImpact });
  targets.push({ key: "obj_missile", src: CAT_OBJECT_SOURCES.missile });
  CAT_OBJECT_SOURCES.missileHit.forEach((src, i) => targets.push({ key: `obj_missileHit_${i}`, src }));
  CAT_FRAGMENT_SOURCES.forEach((f, i) => targets.push({ key: `frag_${i}`, src: f.src, meta: f }));

  catV2Textures.totalCount = targets.length;
  const loaded = await Promise.allSettled(targets.map(t => loadImage(t.src)));
  loaded.forEach((res, idx) => {
    const target = targets[idx];
    if (res.status !== "fulfilled") return;
    const img = res.value;
    if (target.key.startsWith("wall_")) catV2Textures.wallpapers.push(img);
    else if (target.key === "glow") catV2Textures.glow = img;
    else if (target.key === "face") catV2Textures.face = img;
    else if (target.key === "eye_l1") catV2Textures.eyes.l1 = img;
    else if (target.key === "eye_l2") catV2Textures.eyes.l2 = img;
    else if (target.key === "eye_l3") catV2Textures.eyes.l3 = img;
    else if (target.key === "eye_l4") catV2Textures.eyes.l4 = img;
    else if (target.key.startsWith("pupil_")) catV2Textures.pupils[String(target.level)] = img;
    else if (target.key.startsWith("lid_")) catV2Textures.eyelids.push(img);
    else if (target.key.startsWith("whisk_")) catV2Textures.whiskers.push(img);
    else if (target.key === "drift_planetWhite") catV2Textures.drift.planetWhite = img;
    else if (target.key === "drift_planetRed") catV2Textures.drift.planetRed = img;
    else if (target.key === "drift_planetRings") catV2Textures.drift.planetRings = img;
    else if (target.key === "drift_planetIce") catV2Textures.drift.planetIce = img;
    else if (target.key === "drift_planetLava") catV2Textures.drift.planetLava = img;
    else if (target.key === "drift_planetPoison") catV2Textures.drift.planetPoison = img;
    else if (target.key === "drift_planetAcid") catV2Textures.drift.planetAcid = img;
    else if (target.key === "drift_moon") catV2Textures.drift.moon = img;
    else if (target.key === "drift_planetWhite_distance") catV2Textures.drift.planetWhiteDistance = img;
    else if (target.key === "drift_planetRed_distance") catV2Textures.drift.planetRedDistance = img;
    else if (target.key === "drift_planetRings_distance") catV2Textures.drift.planetRingsDistance = img;
    else if (target.key === "drift_planetIce_distance") catV2Textures.drift.planetIceDistance = img;
    else if (target.key === "drift_planetLava_distance") catV2Textures.drift.planetLavaDistance = img;
    else if (target.key === "drift_planetPoison_distance") catV2Textures.drift.planetPoisonDistance = img;
    else if (target.key === "drift_planetAcid_distance") catV2Textures.drift.planetAcidDistance = img;
    else if (target.key === "drift_moon_distance") catV2Textures.drift.moonDistance = img;
    else if (target.key === "obj_evilL") catV2Textures.objects.evilL = img;
    else if (target.key === "obj_evilR") catV2Textures.objects.evilR = img;
    else if (target.key === "obj_nice") catV2Textures.objects.nice = img;
    else if (target.key === "obj_plasmaEvil") catV2Textures.objects.plasmaEvil = img;
    else if (target.key === "obj_plasmaNice") catV2Textures.objects.plasmaNice = img;
    else if (target.key === "obj_shield") catV2Textures.objects.shield = img;
    else if (target.key === "obj_shieldImpact") catV2Textures.objects.shieldImpact = img;
    else if (target.key === "obj_missile") catV2Textures.objects.missile = img;
    else if (target.key.startsWith("obj_missileHit_")) catV2Textures.objects.missileHit.push(img);
    else if (target.key.startsWith("frag_")) {
      catV2Textures.fragments.push({
        img,
        groupKey: target.meta.groupKey,
        prefix: target.meta.prefix,
        setFolder: target.meta.setFolder
      });
    }
    catV2Textures.readyCount++;
  });

  const groupMap = new Map();
  for (const fragment of catV2Textures.fragments) {
    if (!groupMap.has(fragment.groupKey)) groupMap.set(fragment.groupKey, []);
    groupMap.get(fragment.groupKey).push(fragment);
  }
  catV2Textures.fragmentGroups = Array.from(groupMap.values());

}

function drawImageCover(img, alpha = 1) {
  if (!img || !img.complete || alpha <= 0) return;
  const w = canvas.width;
  const h = canvas.height;
  if (coverDrawCache.w !== w || coverDrawCache.h !== h) {
    coverDrawCache.w = w;
    coverDrawCache.h = h;
    coverDrawCache.base = null;
    coverDrawCache.low = null;
    coverDrawCache.high = null;
  }
  let slot = null;
  if (img === fractalTextures.base) slot = "base";
  else if (img === fractalTextures.low) slot = "low";
  else if (img === fractalTextures.high) slot = "high";

  let geom = slot ? coverDrawCache[slot] : null;
  if (!geom) {
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (w - dw) * 0.5;
    const dy = (h - dh) * 0.5;
    geom = { dx, dy, dw, dh };
    if (slot) coverDrawCache[slot] = geom;
  }
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, geom.dx, geom.dy, geom.dw, geom.dh);
  ctx.globalAlpha = 1;
}

function drawImageCoverOffset(img, alpha = 1, dx = 0, dy = 0) {
  if (!img || !img.complete || alpha <= 0) return;
  ctx.save();
  ctx.translate(dx, dy);
  drawImageCover(img, alpha);
  ctx.restore();
}

function spawnCatStar(w, h, edgeBias = 1) {
  const edgeRadiusMin = 0.78;
  const edgeRadiusMax = 1.08;
  const innerRadiusMin = 0.18;
  const useEdge = Math.random() < edgeBias;
  const r = useEdge
    ? edgeRadiusMin + Math.random() * (edgeRadiusMax - edgeRadiusMin)
    : innerRadiusMin + Math.random() * (edgeRadiusMax - innerRadiusMin);
  return {
    angle: Math.random() * Math.PI * 2,
    r,
    z: Math.random(), // depth plane
    brightJitter: 0.62 + Math.random() * 0.90,
    twinkle: 0
  };
}

function ensureCatStars(w, h) {
  const count = Math.max(180, Math.floor((w * h) / 7200));
  if (!catV2Runtime.starsInitialized || catV2Runtime.starsW !== w || catV2Runtime.starsH !== h || catV2Runtime.stars.length !== count) {
    catV2Runtime.stars = [];
    for (let i = 0; i < count; i++) {
      catV2Runtime.stars.push(spawnCatStar(w, h, 0.9));
    }
    catV2Runtime.starsW = w;
    catV2Runtime.starsH = h;
    catV2Runtime.starsInitialized = true;
  }
}

function getCatSpaceMotionScale() {
  // Only two motion states: normal (1x) and combat (0.5x), with smooth zoom-based transition.
  const t = clamp01((catV2Runtime.catScaleEma - 0.20) / 0.80); // 0 at 20% cat scale, 1 at full scale.
  return 0.5 + 0.5 * t; // 0.5x .. 1.0x
}

function drawCatStarfield(dt) {
  const w = canvas.width;
  const h = canvas.height;
  ensureCatStars(w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const rMax = Math.hypot(w, h) * 0.62;
  const speedScale = getCatSpaceMotionScale();
  const combatSlowMul = catV2Runtime.catScaleEma <= 0.21 ? 0.5 : 1; // during combat zoomed-out state: 2x slower
  const speedBase = 0.28 * speedScale * speedScale * speedScale * combatSlowMul; // normal speed unchanged at full cat scale

  for (let i = 0; i < catV2Runtime.stars.length; i++) {
    const s = catV2Runtime.stars[i];
    const depth = 0.25 + s.z * 0.75;
    // Log distance profile: faster near frame, progressively slower toward center.
    const distLog = Math.log1p(9 * clamp01(s.r)) / Math.log1p(9); // 0..1
    const inward = speedBase * depth * (0.16 + distLog * 0.84);
    const prevR = s.r;
    const prevA = s.angle;

    s.r -= inward * dt;
    // No swirl: pure inward travel toward center.
    s.angle = prevA;
    // No brightness oscillation.

    if (s.r <= 0.012 || s.r > 1.1) {
      catV2Runtime.stars[i] = spawnCatStar(w, h, 1);
      continue;
    }

    const px = cx + Math.cos(prevA) * (prevR * rMax);
    const py = cy + Math.sin(prevA) * (prevR * rMax);
    const x = cx + Math.cos(s.angle) * (s.r * rMax);
    const y = cy + Math.sin(s.angle) * (s.r * rMax);

    const centerFade = clamp01((s.r - 0.006) / 0.16); // reduce fade amount (holds brightness longer)
    const edgeBoost = clamp01((s.r - 0.35) / 0.65);
    const alpha = clamp01((0.18 + depth * 0.60 + edgeBoost * 0.30) * centerFade * (s.brightJitter || 1));
    const radius = 0.5 + depth * 1.7 + edgeBoost * 0.5;

    ctx.beginPath();
    ctx.fillStyle = `rgba(236,244,255,${alpha.toFixed(3)})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    const trailAlpha = alpha * 0.56;
    ctx.strokeStyle = `rgba(200,225,255,${trailAlpha.toFixed(3)})`;
    ctx.lineWidth = 0.5 + depth * 0.9;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function chooseCatDriftBodyType() {
  const active = {};
  for (const type of CAT_DRIFT_PLANET_TYPES) active[type] = 0;
  for (const b of catV2Runtime.driftBodies) {
    if (b && Object.prototype.hasOwnProperty.call(active, b.type)) {
      active[b.type]++;
    }
  }
  const missing = Object.keys(active).filter(k => active[k] === 0);
  if (missing.length > 0) return missing[Math.floor(Math.random() * missing.length)];
  return CAT_DRIFT_PLANET_TYPES[Math.floor(Math.random() * CAT_DRIFT_PLANET_TYPES.length)];
}

function spawnCatDriftBody(w, h, forcedType = null) {
  const minDim = Math.min(w, h);
  const sideAngle = Math.random() * Math.PI * 2; // random edge position, movement is always center-directed.
  const bodyType = forcedType || chooseCatDriftBodyType();
  const rStart = 1.06 + Math.random() * 0.16;
  // Rotation is intentionally subtle-to-moderate: 0..40 degrees total across a full travel journey.
  const rotTravelDeg = 40 * Math.pow(Math.random(), 1.35);
  return {
    type: bodyType,
    hasMoon: bodyType === "red" && Math.random() < 0.5, // moon on 50% of red-planet events
    angle: sideAngle,
    r: rStart, // starts slightly off-screen edge
    rStart,
    speed: 0.24 + Math.random() * 0.15, // faster entry
    angleDrift: 0,
    sizeBase: 0.03 + Math.random() * 0.61, // ~2x wider entry-size window: both smaller and larger arrivals
    alphaBase: 0.60 + Math.random() * 0.22,
    moonPhase: Math.random() * Math.PI * 2,
    moonSpeed: 0.18 + Math.random() * 0.24,
    moonRadiusMul: 1.25 + Math.random() * 1.45, // orbit path stays larger than planet image size
    moonSizeMul: 0.18 + Math.random() * 0.28,
    moonAlpha: 0.58 + Math.random() * 0.28,
    rotStart: (Math.random() * 2 - 1) * (Math.PI / 10), // up to +/-18 deg initial tilt
    rotDir: Math.random() < 0.5 ? -1 : 1,
    rotTravelRad: rotTravelDeg * (Math.PI / 180),
    parallax: 0.92 + Math.random() * 0.24,
    minDim
  };
}

function drawCatDriftBodies(dt) {
  const w = canvas.width;
  const h = canvas.height;
  const minDim = Math.min(w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const rMax = Math.hypot(w, h) * 0.62;
  const planetImgByType = {
    red: catV2Textures.drift.planetRed,
    white: catV2Textures.drift.planetWhite,
    rings: catV2Textures.drift.planetRings,
    ice: catV2Textures.drift.planetIce,
    lava: catV2Textures.drift.planetLava,
    poison: catV2Textures.drift.planetPoison,
    acid: catV2Textures.drift.planetAcid
  };
  const planetDistImgByType = {
    red: catV2Textures.drift.planetRedDistance,
    white: catV2Textures.drift.planetWhiteDistance,
    rings: catV2Textures.drift.planetRingsDistance,
    ice: catV2Textures.drift.planetIceDistance,
    lava: catV2Textures.drift.planetLavaDistance,
    poison: catV2Textures.drift.planetPoisonDistance,
    acid: catV2Textures.drift.planetAcidDistance
  };
  const moonImg = catV2Textures.drift.moon;
  const moonDistImg = catV2Textures.drift.moonDistance;

  const speedScale = getCatSpaceMotionScale();
  const starSpeedScale = speedScale * speedScale * speedScale;
  const speedNorm = clamp01((starSpeedScale - 0.125) / 0.875); // combat-slow..fast-normal
  const planetSpeedScale = 1 + speedNorm * 2; // 1x in slow combat state, 3x at fast outside-combat state
  if (!Object.values(planetImgByType).some(Boolean)) return;

  catV2Runtime.driftSpawnSec -= dt;
  if (catV2Runtime.driftSpawnSec <= 0 && catV2Runtime.driftBodies.length < 3) {
    catV2Runtime.driftBodies.push(spawnCatDriftBody(w, h));
    catV2Runtime.driftSpawnSec = 9 + Math.random() * 18; // not too often
  }

  const out = [];
  for (let i = 0; i < catV2Runtime.driftBodies.length; i++) {
    const b = catV2Runtime.driftBodies[i];
    // Perspective deceleration tied to apparent size:
    // large/near -> fast, then exponentially slower as objects shrink/recede.
    const sizeNow = 0.22 + b.r * 1.08;
    const sizeStart = 0.22 + (Number.isFinite(b.rStart) ? b.rStart : 1.12) * 1.08;
    const sizeNorm = clamp01(sizeNow / Math.max(1e-6, sizeStart));
    const depthSlow = Math.exp((sizeNorm - 1) * 3.2); // 1.0 at entry, ~0.04 near center
    b.r -= b.speed * dt * planetSpeedScale * depthSlow;
    // Keep heading fixed toward center (no random path drift).
    b.angle += 0;
    b.moonPhase += b.moonSpeed * dt;

    const x = cx + Math.cos(b.angle) * (b.r * rMax) * b.parallax;
    const y = cy + Math.sin(b.angle) * (b.r * rMax) * b.parallax;
    const travelProgress = clamp01(
      ((Number.isFinite(b.rStart) ? b.rStart : 1.12) - b.r)
      / Math.max(1e-6, Number.isFinite(b.rStart) ? b.rStart : 1.12)
    );
    const rotAngle = (Number.isFinite(b.rotStart) ? b.rotStart : 0)
      + (Number.isFinite(b.rotDir) ? b.rotDir : 1)
      * (Number.isFinite(b.rotTravelRad) ? b.rotTravelRad : 0)
      * travelProgress;
    const pSize = minDim * b.sizeBase * (0.22 + b.r * 1.08); // starts large at edges, shrinks inward
    // Distance-darkening is hard-locked to apparent size only (not travel progress).
    const planetBrightSize = minDim * 0.22;
    const planetDarkSize = minDim * 0.055;
    const planetSizeDark = clamp01((planetBrightSize - pSize) / Math.max(1e-6, planetBrightSize - planetDarkSize));
    // Only fade when width drops below 10px, then fade slowly.
    const alpha = pSize >= 10
      ? 1
      : clamp01(Math.pow(Math.max(0, pSize) / 10, 0.45));
    // Cull only when visually tiny (size-based), not by radial value, to avoid sudden disappear.
    if (pSize <= 0.35) continue;
    const recede = clamp01((b.r - 0.04) / 1.08);
    const img = planetImgByType[b.type] || planetImgByType.white || planetImgByType.red || planetImgByType.rings;
    const distImg = planetDistImgByType[b.type] || null;
    if (img) {
      const ar = Math.max(1e-6, (img.width || 1) / (img.height || 1));
      const drawW = ar >= 1 ? pSize : pSize * ar;
      const drawH = ar >= 1 ? pSize / ar : pSize;
      drawCombatSprite(img, x, y, drawW, drawH, rotAngle, 0, alpha);
      if (distImg && distImg.complete) {
        const dar = Math.max(1e-6, (distImg.width || 1) / (distImg.height || 1));
        const dW = dar >= 1 ? pSize : pSize * dar;
        const dH = dar >= 1 ? pSize / dar : pSize;
        const distAlpha = alpha * Math.pow(planetSizeDark, 1.02) * 0.92;
        drawCombatSprite(distImg, x, y, dW, dH, rotAngle, 0, distAlpha);
      }
    }

    // Moon orbits only some red-planet events, upright sprite (no self-rotation).
    if (b.type === "red" && b.hasMoon && moonImg) {
      const mSize = pSize * b.moonSizeMul * (0.8 + 0.6 * recede);
      const moonRBase = pSize * b.moonRadiusMul;
      const moonR = Math.max(moonRBase, pSize * 0.56 + mSize * 0.72); // keep clear separation, avoid overlap
      const mx = x + Math.cos(b.moonPhase) * moonR;
      const my = y + Math.sin(b.moonPhase) * moonR * 0.88;
      const mar = Math.max(1e-6, (moonImg.width || 1) / (moonImg.height || 1));
      const mW = mar >= 1 ? mSize : mSize * mar;
      const mH = mar >= 1 ? mSize / mar : mSize;
      drawCombatSprite(moonImg, mx, my, mW, mH, 0, 0, 1);
      if (moonDistImg && moonDistImg.complete) {
        const mdar = Math.max(1e-6, (moonDistImg.width || 1) / (moonDistImg.height || 1));
        const mdW = mdar >= 1 ? mSize : mSize * mdar;
        const mdH = mdar >= 1 ? mSize / mdar : mSize;
        const moonBrightSize = minDim * 0.06;
        const moonDarkSize = minDim * 0.018;
        const moonSizeDark = clamp01((moonBrightSize - mSize) / Math.max(1e-6, moonBrightSize - moonDarkSize));
        const moonDistAlpha = Math.pow(moonSizeDark, 1.0) * 0.86;
        drawCombatSprite(moonDistImg, mx, my, mdW, mdH, 0, 0, moonDistAlpha);
      }
    }

    out.push(b);
  }
  catV2Runtime.driftBodies = out;
}

function drawCombatSprite(img, x, y, w, h, angle = 0, hurt = 0, alpha = 1) {
  if (!img || !img.complete || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
  if (hurt > 0.001) {
    // Damage cue: soft red circular glow with feathered edges, clipped to sprite.
    ctx.globalCompositeOperation = "source-atop";
    const radius = Math.min(w, h) * 0.62;
    const g = ctx.createRadialGradient(0, 0, radius * 0.06, 0, 0, radius);
    g.addColorStop(0, `rgba(255, 54, 54, ${Math.min(0.78, hurt * 0.85).toFixed(3)})`);
    g.addColorStop(0.52, `rgba(255, 38, 38, ${Math.min(0.42, hurt * 0.45).toFixed(3)})`);
    g.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

function combatDepthScale(y, h) {
  // Perspective illusion: lower on screen feels closer (larger), upper feels farther.
  const t = Math.max(0, Math.min(1, y / Math.max(1, h)));
  const curve = t * t * (3 - 2 * t); // smoothstep
  return 0.78 + curve * 0.44; // 0.78x .. 1.22x
}

function pushActorHistory(history, t, x, y) {
  history.push({ t, x, y });
  while (history.length > 2 && (t - history[0].t) > 2.4) history.shift();
}

function sampleActorHistory(history, targetT, fallbackX, fallbackY) {
  if (!history.length) return { x: fallbackX, y: fallbackY };
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].t <= targetT) return history[i];
  }
  return history[0];
}

function updateAndDrawCatAlienCombat(dt) {
  const w = canvas.width;
  const h = canvas.height;
  const minDim = Math.min(w, h);
  const alienFlightSpeedScale = 0.38;
  const alienMaxSpeedScale = 0.65;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const orbitR = minDim * 0.30;
  const arenaR = minDim * 0.46;
  const niceImg = catV2Textures.objects.nice;
  const evilImgL = catV2Textures.objects.evilL;
  const evilImgR = catV2Textures.objects.evilR;
  const evilShotImg = catV2Textures.objects.plasmaEvil;
  const niceShotImg = catV2Textures.objects.plasmaNice;
  const shieldImg = catV2Textures.objects.shield;
  const shieldImpactImg = catV2Textures.objects.shieldImpact;
  const missileImg = catV2Textures.objects.missile;
  const missileHitImgs = catV2Textures.objects.missileHit;
  const haveActors = !!(niceImg && evilImgL && evilImgR);

  if (!catV2Runtime.alienCombatActive) {
    catV2Runtime.alienCombatCooldown -= dt;
    if (catV2Runtime.alienCombatCooldown <= 0) {
      catV2Runtime.alienCombatActive = true;
      catV2Runtime.alienCombatEntering = false;
      catV2Runtime.alienPreShrinkTimer = 0;
      catV2Runtime.preCombatStage = "shrink15";
      catV2Runtime.preCombatTimer = 0.68;
      catV2Runtime.catPreScaleTarget = 0.15;
      catV2Runtime.combatSettleTimer = 0;
      catV2Runtime.alienCombatExiting = false;
      catV2Runtime.alienCombatTimer = 60; // hard 1-minute combat cycle
      catV2Runtime.alienCombatElapsed = 0;
      catV2Runtime.alienEscapeStartSec = 20 + Math.random() * 30; // trigger escape after 20..50s
      catV2Runtime.alienEnterTimer = 0;
      catV2Runtime.combatOrbitAngle = Math.random() * Math.PI * 2;
      const outR = Math.max(w, h) * 0.72;
      catV2Runtime.nice.x = cx - outR;
      catV2Runtime.nice.y = cy - outR;
      catV2Runtime.evil.x = cx + outR;
      catV2Runtime.evil.y = cy + outR;
      catV2Runtime.alienEntryTargetNX = cx;
      catV2Runtime.alienEntryTargetNY = cy;
      catV2Runtime.alienEntryTargetEX = cx;
      catV2Runtime.alienEntryTargetEY = cy;
      catV2Runtime.evil.vx = 0;
      catV2Runtime.evil.vy = 0;
      catV2Runtime.evil.dropCooldown = 0.4 + Math.random() * 0.8;
      catV2Runtime.evil.missileCredit = 0;
      catV2Runtime.evil.shieldActive = false;
      catV2Runtime.evil.shieldTimer = 0;
      catV2Runtime.evil.shieldCooldown = 4 + Math.random() * 8;
      catV2Runtime.evil.shieldImpactTimer = 0;
      catV2Runtime.nice.vx = 0;
      catV2Runtime.nice.vy = 0;
      catV2Runtime.nice.angle = 0;
      catV2Runtime.niceShotSide = Math.random() < 0.5 ? -1 : 1;
      catV2Runtime.nice.sideSign = Math.random() < 0.5 ? -1 : 1;
      catV2Runtime.nice.tacticMode = "level";
      catV2Runtime.nice.tacticTimer = 2.0 + Math.random() * 2.2;
      catV2Runtime.nice.evadeAngle = Math.random() * Math.PI * 2;
      catV2Runtime.nice.evadeTimer = 0.5 + Math.random() * 1.3;
      catV2Runtime.nice.aiming = false;
      catV2Runtime.nice.aimTimer = 0.25 + Math.random() * 1.1;
      catV2Runtime.nice.fireCooldown = 0.15 + Math.random() * 0.35;
      catV2Runtime.nice.burstShots = 0;
      catV2Runtime.niceHistory = [];
      catV2Runtime.evilHistory = [];
      catV2Runtime.niceShots = [];
      catV2Runtime.evilShots = [];
      catV2Runtime.evilMissiles = [];
      catV2Runtime.missileBursts = [];
    }
  } else {
    if (catV2Runtime.preCombatStage !== "idle") {
      catV2Runtime.preCombatTimer -= dt;
      if (catV2Runtime.preCombatTimer <= 0) {
        if (catV2Runtime.preCombatStage === "shrink15") {
          catV2Runtime.preCombatStage = "rebound20";
          catV2Runtime.preCombatTimer = 0.84;
          catV2Runtime.catPreScaleTarget = 0.20;
        } else if (catV2Runtime.preCombatStage === "rebound20") {
          catV2Runtime.preCombatStage = "hold20";
          catV2Runtime.preCombatTimer = 2.0;
          catV2Runtime.catPreScaleTarget = 0.20;
        } else if (catV2Runtime.preCombatStage === "hold20") {
          catV2Runtime.preCombatStage = "idle";
          catV2Runtime.catPreScaleTarget = null;
          catV2Runtime.combatSettleTimer = 0.95;
          catV2Runtime.alienCombatEntering = true;
          catV2Runtime.alienEnterDuration = 1.6 + Math.random() * 1.4;
          catV2Runtime.alienEnterTimer = catV2Runtime.alienEnterDuration;
          const fromLeft = Math.random() < 0.5;
          const off = Math.max(w, h) * 0.24;
          const laneY = cy + (Math.random() * 2 - 1) * minDim * 0.18;
          catV2Runtime.alienEntryStartNX = fromLeft ? -off : (w + off);
          catV2Runtime.alienEntryStartNY = laneY + (Math.random() * 2 - 1) * minDim * 0.07;
          catV2Runtime.alienEntryStartEX = fromLeft ? (w + off) : -off;
          catV2Runtime.alienEntryStartEY = laneY + (Math.random() * 2 - 1) * minDim * 0.07;
          catV2Runtime.nice.x = catV2Runtime.alienEntryStartNX;
          catV2Runtime.nice.y = catV2Runtime.alienEntryStartNY;
          catV2Runtime.evil.x = catV2Runtime.alienEntryStartEX;
          catV2Runtime.evil.y = catV2Runtime.alienEntryStartEY;
          catV2Runtime.alienEntryTargetNX = cx + (fromLeft ? -1 : 1) * minDim * 0.18;
          catV2Runtime.alienEntryTargetNY = laneY - minDim * 0.02;
          catV2Runtime.alienEntryTargetEX = cx + (fromLeft ? 1 : -1) * minDim * 0.18;
          catV2Runtime.alienEntryTargetEY = laneY - minDim * 0.08;
          catV2Runtime.nice.vx = 0;
          catV2Runtime.nice.vy = 0;
          catV2Runtime.evil.vx = 0;
          catV2Runtime.evil.vy = 0;
        }
      }
    } else if (catV2Runtime.alienPreShrinkTimer > 0) {
      catV2Runtime.alienPreShrinkTimer -= dt;
      if (catV2Runtime.alienPreShrinkTimer <= 0) {
        catV2Runtime.alienCombatEntering = true;
        catV2Runtime.alienEnterDuration = 1.6 + Math.random() * 1.4;
        catV2Runtime.alienEnterTimer = catV2Runtime.alienEnterDuration;
        const fromLeft = Math.random() < 0.5;
        const off = Math.max(w, h) * 0.24;
        const laneY = cy + (Math.random() * 2 - 1) * minDim * 0.18;
        catV2Runtime.alienEntryStartNX = fromLeft ? -off : (w + off);
        catV2Runtime.alienEntryStartNY = laneY + (Math.random() * 2 - 1) * minDim * 0.07;
        catV2Runtime.alienEntryStartEX = fromLeft ? (w + off) : -off;
        catV2Runtime.alienEntryStartEY = laneY + (Math.random() * 2 - 1) * minDim * 0.07;
        catV2Runtime.nice.x = catV2Runtime.alienEntryStartNX;
        catV2Runtime.nice.y = catV2Runtime.alienEntryStartNY;
        catV2Runtime.evil.x = catV2Runtime.alienEntryStartEX;
        catV2Runtime.evil.y = catV2Runtime.alienEntryStartEY;
        catV2Runtime.alienEntryTargetNX = cx + (fromLeft ? -1 : 1) * minDim * 0.18;
        catV2Runtime.alienEntryTargetNY = laneY - minDim * 0.02;
        catV2Runtime.alienEntryTargetEX = cx + (fromLeft ? 1 : -1) * minDim * 0.18;
        catV2Runtime.alienEntryTargetEY = laneY - minDim * 0.08;
        catV2Runtime.nice.vx = 0;
        catV2Runtime.nice.vy = 0;
        catV2Runtime.evil.vx = 0;
        catV2Runtime.evil.vy = 0;
      }
    } else if (catV2Runtime.alienCombatEntering) {
      catV2Runtime.alienEnterTimer -= dt;
      if (catV2Runtime.alienEnterTimer <= 0) {
        catV2Runtime.alienCombatEntering = false;
      }
    } else if (!catV2Runtime.alienCombatExiting) {
      catV2Runtime.alienCombatTimer -= dt;
      catV2Runtime.alienCombatElapsed += dt;
      if (catV2Runtime.alienCombatElapsed >= catV2Runtime.alienEscapeStartSec || catV2Runtime.alienCombatTimer <= 0) {
        catV2Runtime.alienCombatExiting = true;
        catV2Runtime.alienExitTimer = 0;
        const exAng = Math.random() * Math.PI * 2;
        catV2Runtime.alienExitDirX = Math.cos(exAng);
        catV2Runtime.alienExitDirY = Math.sin(exAng);
        catV2Runtime.alienExitFollowDelay = 0.6 + Math.random() * 1.2;
      }
    }
  }

  if (!haveActors || (!catV2Runtime.alienCombatActive
    && catV2Runtime.niceShots.length === 0
    && catV2Runtime.evilShots.length === 0
    && catV2Runtime.evilMissiles.length === 0
    && catV2Runtime.missileBursts.length === 0)) {
    catV2Runtime.nice.hurt += (0 - catV2Runtime.nice.hurt) * (1 - Math.exp(-7 * dt));
    catV2Runtime.evil.hurt += (0 - catV2Runtime.evil.hurt) * (1 - Math.exp(-7 * dt));
    return;
  }
  if (catV2Runtime.preCombatStage !== "idle") {
    // During cat zoom-out sequence, suppress alien rendering entirely.
    return;
  }

  catV2Runtime.evil.shieldImpactTimer = Math.max(0, catV2Runtime.evil.shieldImpactTimer - dt);

  if (catV2Runtime.alienCombatActive) {
    const n = catV2Runtime.nice;
    const e = catV2Runtime.evil;
    const nowCombatSec = performance.now() * 0.001;
    pushActorHistory(catV2Runtime.niceHistory, nowCombatSec, n.x, n.y);
    pushActorHistory(catV2Runtime.evilHistory, nowCombatSec, e.x, e.y);
    const reactionTime = nowCombatSec - catV2Runtime.reactionDelaySec;
    const seenN = sampleActorHistory(catV2Runtime.niceHistory, reactionTime, n.x, n.y);
    const seenE = sampleActorHistory(catV2Runtime.evilHistory, reactionTime, e.x, e.y);
    const dxNSeenE = n.x - seenE.x;
    const dyNSeenE = n.y - seenE.y;
    const distNSeenE = Math.max(1e-4, Math.hypot(dxNSeenE, dyNSeenE));
    const dxNE = n.x - e.x;
    const dyNE = n.y - e.y;
    const distNE = Math.max(1e-4, Math.hypot(dxNE, dyNE));
    let settleScale = 1;

    if (catV2Runtime.alienCombatEntering) {
      // Enter sequence: both aliens fly into frame from outside.
      const n = catV2Runtime.nice;
      const e = catV2Runtime.evil;
      const dur = Math.max(0.2, catV2Runtime.alienEnterDuration || 1.8);
      const t = clamp01(1 - (catV2Runtime.alienEnterTimer / dur));
      const ease = 1 - Math.pow(1 - t, 3);
      const prevNX = n.x;
      const prevNY = n.y;
      const prevEX = e.x;
      const prevEY = e.y;
      n.x = catV2Runtime.alienEntryStartNX + (catV2Runtime.alienEntryTargetNX - catV2Runtime.alienEntryStartNX) * ease;
      n.y = catV2Runtime.alienEntryStartNY + (catV2Runtime.alienEntryTargetNY - catV2Runtime.alienEntryStartNY) * ease;
      e.x = catV2Runtime.alienEntryStartEX + (catV2Runtime.alienEntryTargetEX - catV2Runtime.alienEntryStartEX) * ease;
      e.y = catV2Runtime.alienEntryStartEY + (catV2Runtime.alienEntryTargetEY - catV2Runtime.alienEntryStartEY) * ease;
      n.vx = (n.x - prevNX) / Math.max(1e-4, dt);
      n.vy = (n.y - prevNY) / Math.max(1e-4, dt);
      e.vx = (e.x - prevEX) / Math.max(1e-4, dt);
      e.vy = (e.y - prevEY) / Math.max(1e-4, dt);
      if (catV2Runtime.alienEnterTimer <= 0 || t >= 0.999) {
        catV2Runtime.alienCombatEntering = false;
        catV2Runtime.combatSettleTimer = Math.max(catV2Runtime.combatSettleTimer, 0.95);
        n.vx = 0;
        n.vy = 0;
        e.vx = 0;
        e.vy = 0;
        catV2Runtime.niceHistory = [];
        catV2Runtime.evilHistory = [];
      }
    } else if (!catV2Runtime.alienCombatExiting) {
      const nPrevVX = n.vx;
      const nPrevVY = n.vy;
      const ePrevVX = e.vx;
      const ePrevVY = e.vy;
      if (catV2Runtime.combatSettleTimer > 0) {
        catV2Runtime.combatSettleTimer = Math.max(0, catV2Runtime.combatSettleTimer - dt);
      }
      const settleMix = catV2Runtime.combatSettleTimer > 0 ? (1 - (catV2Runtime.combatSettleTimer / 0.95)) : 1;
      settleScale = 0.35 + 0.65 * clamp01(settleMix);
      catV2Runtime.combatOrbitAngle += dt * (0.22 + Math.sin(performance.now() * 0.0004) * 0.05);

      // Nice alien: prefers side lanes and level firing lines, with occasional under-pass tactic.
      n.tacticTimer -= dt;
      if (n.tacticTimer <= 0) {
        if (n.tacticMode === "under") {
          n.tacticMode = "level";
          n.tacticTimer = 2.2 + Math.random() * 2.8;
        } else {
          n.tacticMode = Math.random() < 0.34 ? "under" : "level";
          n.tacticTimer = n.tacticMode === "under"
            ? (1.6 + Math.random() * 2.2)
            : (2.2 + Math.random() * 3.2);
          if (Math.random() < 0.45 || Math.abs(n.x - e.x) < minDim * 0.11) {
            n.sideSign = n.sideSign >= 0 ? -1 : 1;
          }
        }
      }
      n.evadeTimer -= dt;
      if (n.evadeTimer <= 0) {
        n.evadeAngle += (Math.random() * 2 - 1) * (0.45 + Math.random() * 0.75);
        n.evadeTimer = 0.70 + Math.random() * 1.80;
      }
      const evadeAmp = minDim * 0.72;
      const fleeAmp = minDim * 1.10;
      const fleeStrength = clamp01((orbitR * 1.75 - distNSeenE) / (orbitR * 1.75));
      const sideOffset = minDim * 0.38 * n.sideSign;
      const desiredNX = seenE.x + sideOffset;
      const desiredNY = (n.tacticMode === "under")
        ? (seenE.y + minDim * 0.22)
        : (seenE.y + minDim * 0.015);
      n.vx += (desiredNX - n.x) * dt * 0.032 * settleScale;
      n.vy += (desiredNY - n.y) * dt * (n.tacticMode === "under" ? 0.030 : 0.024) * settleScale;
      n.vx += Math.cos(n.evadeAngle) * evadeAmp * dt * 0.010 * settleScale;
      n.vy += Math.sin(n.evadeAngle) * evadeAmp * dt * 0.010 * settleScale;
      n.vx += (dxNSeenE / distNSeenE) * fleeAmp * fleeStrength * dt * 0.013 * settleScale;
      n.vy += (dyNSeenE / distNSeenE) * fleeAmp * fleeStrength * dt * 0.013 * settleScale;
      n.vx += Math.cos(catV2Runtime.combatOrbitAngle * 1.5 + 1.1) * minDim * 0.0011 * dt * settleScale;
      n.vy += Math.sin(catV2Runtime.combatOrbitAngle * 1.2 - 0.9) * minDim * 0.0011 * dt * settleScale;
      // Avoid incoming evil plasma (predictive local dodge field).
      for (const p of catV2Runtime.evilShots) {
        const rx = n.x - p.x;
        const ry = n.y - p.y;
        const d = Math.hypot(rx, ry);
        const threatR = minDim * 0.18;
        if (d < threatR && d > 1e-5) {
          const repel = (1 - d / threatR) * minDim * 0.026;
          n.vx += (rx / d) * repel * dt * settleScale;
          n.vy += (ry / d) * repel * dt * settleScale;
          // Side-step across bullet direction to avoid getting stuck in line.
          const bdn = Math.hypot(p.vx, p.vy) || 1;
          const bx = p.vx / bdn;
          const by = p.vy / bdn;
          n.vx += -by * repel * 0.28 * dt * settleScale;
          n.vy += bx * repel * 0.28 * dt * settleScale;
        }
      }
      // Flight-path aim assist: while aiming, move tangentially to bring enemy into gun arc.
      const lineAngNow = Math.atan2(seenE.y - n.y, seenE.x - n.x);
      let lineErr = lineAngNow - n.angle;
      while (lineErr > Math.PI) lineErr -= Math.PI * 2;
      while (lineErr < -Math.PI) lineErr += Math.PI * 2;
      if (n.aiming) {
        const tangentSign = lineErr >= 0 ? 1 : -1;
        const tx = -(seenE.y - n.y) / distNSeenE;
        const ty = (seenE.x - n.x) / distNSeenE;
        const assist = clamp01(Math.abs(lineErr) / 0.9) * minDim * 0.012;
        n.vx += tx * tangentSign * assist * dt * settleScale;
        n.vy += ty * tangentSign * assist * dt * settleScale;
      } else {
        // Stabilize non-shooting movement: favor sustained horizontal cruise and less side-slip.
        const cruiseVX = n.sideSign * minDim * 0.017;
        n.vx += (cruiseVX - n.vx) * dt * 0.75 * settleScale;
        n.vy += (0 - n.vy) * dt * 0.48 * settleScale;
      }
      n.vx *= Math.exp(-1.75 * dt); // drag
      n.vy *= Math.exp(-1.75 * dt);
      // Favor continuity of direction over tiny frame-to-frame corrections.
      const nDirHold = 0.62;
      n.vx = nPrevVX + (n.vx - nPrevVX) * nDirHold;
      n.vy = nPrevVY + (n.vy - nPrevVY) * nDirHold;
      const niceMaxSpeed = minDim * 0.24 * alienMaxSpeedScale;
      const nSpeed = Math.hypot(n.vx, n.vy);
      if (nSpeed > niceMaxSpeed) {
        const k = niceMaxSpeed / nSpeed;
        n.vx *= k;
        n.vy *= k;
      }
      n.x += n.vx * alienFlightSpeedScale;
      n.y += n.vy * alienFlightSpeedScale;

      // Evil alien: stabilize above nice alien, with stronger overhead positioning.
      const desiredEX = seenN.x;
      const desiredEY = seenN.y - minDim * 0.20;
      const exErr = desiredEX - e.x;
      const eyErr = desiredEY - e.y;
      e.vx += exErr * dt * 0.026 * settleScale;
      e.vy += eyErr * dt * 0.031 * settleScale;
      e.vx += Math.cos(catV2Runtime.combatOrbitAngle * 0.7) * minDim * 0.0012 * dt * settleScale;
      e.vy += Math.sin(catV2Runtime.combatOrbitAngle * 0.6) * minDim * 0.0011 * dt * settleScale;
      // Evil also avoids nice plasma.
      for (const p of catV2Runtime.niceShots) {
        const rx = e.x - p.x;
        const ry = e.y - p.y;
        const d = Math.hypot(rx, ry);
        const threatR = minDim * 0.20;
        if (d < threatR && d > 1e-5) {
          const repel = (1 - d / threatR) * minDim * 0.030;
          e.vx += (rx / d) * repel * dt * settleScale;
          e.vy += (ry / d) * repel * dt * settleScale;
        }
      }
      e.vx *= Math.exp(-1.90 * dt); // drag
      e.vy *= Math.exp(-1.90 * dt);
      const eDirHold = 0.58;
      e.vx = ePrevVX + (e.vx - ePrevVX) * eDirHold;
      e.vy = ePrevVY + (e.vy - ePrevVY) * eDirHold;
      const evilMaxSpeed = minDim * 0.135 * alienMaxSpeedScale;
      const eSpeed = Math.hypot(e.vx, e.vy);
      if (eSpeed > evilMaxSpeed) {
        const k = evilMaxSpeed / eSpeed;
        e.vx *= k;
        e.vy *= k;
      }
      e.x += e.vx * alienFlightSpeedScale;
      e.y += e.vy * alienFlightSpeedScale;

      // Anti-stall nudges: keep both in motion even when forces momentarily cancel.
      if (Math.hypot(n.vx, n.vy) < minDim * 0.006) {
        n.vx += (Math.random() * 2 - 1) * minDim * 0.00035;
        n.vy += (Math.random() * 2 - 1) * minDim * 0.00035;
      }
      if (Math.hypot(e.vx, e.vy) < minDim * 0.005) {
        e.vx += (Math.random() * 2 - 1) * minDim * 0.00028;
        e.vy += (Math.random() * 2 - 1) * minDim * 0.00028;
      }
    } else {
      // End of sequence: nice flies out, evil follows after delay.
      catV2Runtime.alienExitTimer += dt;
      const exitDist = Math.max(w, h) * 1.65;
      const targetNX = cx + catV2Runtime.alienExitDirX * exitDist;
      const targetNY = cy + catV2Runtime.alienExitDirY * exitDist;
      const ndx = targetNX - n.x;
      const ndy = targetNY - n.y;
      const nd = Math.max(1e-4, Math.hypot(ndx, ndy));
      const nExitSpeed = minDim * 0.24 * alienMaxSpeedScale;
      n.vx += ((ndx / nd) * nExitSpeed - n.vx) * (1 - Math.exp(-2.4 * dt));
      n.vy += ((ndy / nd) * nExitSpeed - n.vy) * (1 - Math.exp(-2.4 * dt));
      n.x += n.vx * alienFlightSpeedScale;
      n.y += n.vy * alienFlightSpeedScale;

      catV2Runtime.alienExitFollowDelay -= dt;
      if (catV2Runtime.alienExitFollowDelay <= 0) {
        const edx = n.x - e.x;
        const edy = n.y - e.y;
        const ed = Math.max(1e-4, Math.hypot(edx, edy));
        const eExitSpeed = minDim * 0.19 * alienMaxSpeedScale;
        e.vx += ((edx / ed) * eExitSpeed - e.vx) * (1 - Math.exp(-2.0 * dt));
        e.vy += ((edy / ed) * eExitSpeed - e.vy) * (1 - Math.exp(-2.0 * dt));
      }
      e.x += e.vx * alienFlightSpeedScale;
      e.y += e.vy * alienFlightSpeedScale;
    }

    const clampArena = (obj) => {
      const dx = obj.x - cx;
      const dy = obj.y - cy;
      const rr = Math.hypot(dx, dy);
      const softEdge = arenaR * 0.92;
      if (rr > softEdge) {
        const nx = dx / Math.max(1e-5, rr);
        const ny = dy / Math.max(1e-5, rr);
        const over = rr - softEdge;
        const push = over / Math.max(1, arenaR - softEdge);
        obj.vx -= nx * minDim * (0.006 + push * 0.010);
        obj.vy -= ny * minDim * (0.006 + push * 0.010);
        if (rr > arenaR * 1.03) {
          const hardK = (arenaR * 1.03) / rr;
          obj.x = cx + dx * hardK;
          obj.y = cy + dy * hardK;
        }
      }
    };
    if (!catV2Runtime.alienCombatExiting && !catV2Runtime.alienCombatEntering) {
      clampArena(catV2Runtime.nice);
      clampArena(catV2Runtime.evil);
    }

    // Keep aliens on separate paths and prevent overlap by enforcing minimum spacing.
    const sepDX = catV2Runtime.evil.x - catV2Runtime.nice.x;
    const sepDY = catV2Runtime.evil.y - catV2Runtime.nice.y;
    const sepDist = Math.hypot(sepDX, sepDY);
      const minSep = minDim * 0.16;
    if (sepDist < minSep) {
      const nx = sepDist > 1e-5 ? (sepDX / sepDist) : Math.cos(catV2Runtime.combatOrbitAngle);
      const ny = sepDist > 1e-5 ? (sepDY / sepDist) : Math.sin(catV2Runtime.combatOrbitAngle);
      const push = (minSep - sepDist) * 0.5;
      catV2Runtime.evil.x += nx * push * 0.08;
      catV2Runtime.evil.y += ny * push * 0.08;
      catV2Runtime.nice.x -= nx * push * 0.08;
      catV2Runtime.nice.y -= ny * push * 0.08;
      catV2Runtime.evil.vx += nx * push * 0.20 * settleScale;
      catV2Runtime.evil.vy += ny * push * 0.20 * settleScale;
      catV2Runtime.nice.vx -= nx * push * 0.20 * settleScale;
      catV2Runtime.nice.vy -= ny * push * 0.20 * settleScale;
      if (!catV2Runtime.alienCombatExiting) {
        clampArena(catV2Runtime.nice);
        clampArena(catV2Runtime.evil);
      }
    }

    // Hard speed limits (post-force clamp): fast but bounded.
    const clampVel = (obj, maxSpeed) => {
      const s = Math.hypot(obj.vx, obj.vy);
      if (s > maxSpeed) {
        const k = maxSpeed / s;
        obj.vx *= k;
        obj.vy *= k;
      }
    };
    clampVel(catV2Runtime.nice, minDim * 0.215 * alienMaxSpeedScale);
    clampVel(catV2Runtime.evil, minDim * 0.145 * alienMaxSpeedScale);

    const aimDX = seenE.x - catV2Runtime.nice.x;
    const aimDY = seenE.y - catV2Runtime.nice.y;
    const aimAng = Math.atan2(aimDY, aimDX);
    let angErr = aimAng - catV2Runtime.nice.angle;
    while (angErr > Math.PI) angErr -= Math.PI * 2;
    while (angErr < -Math.PI) angErr += Math.PI * 2;

    // Nice aiming is intermittent and slower than enemy movement.
    catV2Runtime.nice.aimTimer -= dt;
    const fleeingHard = distNSeenE < orbitR * 0.9;
    if (catV2Runtime.nice.aimTimer <= 0) {
      if (!catV2Runtime.alienCombatExiting && distNSeenE < orbitR * 2.0) {
        catV2Runtime.nice.aiming = !(fleeingHard && Math.random() < 0.35);
      } else {
        catV2Runtime.nice.aiming = false;
      }
      catV2Runtime.nice.aimTimer = 0.22 + Math.random() * 0.85;
    }
    let orientTarget = catV2Runtime.nice.angle;
    if (catV2Runtime.nice.aiming && !catV2Runtime.alienCombatExiting) {
      // Prefer near-horizontal aiming posture while still tracking target.
      orientTarget = aimAng * 0.85;
    } else {
      const velAngle = Math.atan2(catV2Runtime.nice.vy, catV2Runtime.nice.vx + 1e-5);
      // Keep a stronger neutral horizontal pose when not planning to shoot.
      orientTarget = velAngle * 0.20;
    }
    let orientErr = orientTarget - catV2Runtime.nice.angle;
    while (orientErr > Math.PI) orientErr -= Math.PI * 2;
    while (orientErr < -Math.PI) orientErr += Math.PI * 2;
    const maxTurn = (catV2Runtime.nice.aiming ? 1.9 : 1.15) * dt;
    catV2Runtime.nice.angle += Math.max(-maxTurn, Math.min(maxTurn, orientErr));
    catV2Runtime.nice.angle = Math.max(-1.308996939, Math.min(1.308996939, catV2Runtime.nice.angle)); // +/-75deg

    if (!catV2Runtime.alienCombatExiting && !catV2Runtime.alienCombatEntering) {
      catV2Runtime.nice.fireCooldown -= dt;
      catV2Runtime.nice.burstTimer -= dt;
      const canStartBurst = Math.abs(angErr) < 0.42 && distNSeenE < orbitR * 2.10;
      if (catV2Runtime.nice.burstShots <= 0 && catV2Runtime.nice.fireCooldown <= 0 && canStartBurst) {
        catV2Runtime.nice.burstShots = 3 + Math.floor(Math.random() * 4);
        catV2Runtime.nice.burstGap = 0.05 + Math.random() * 0.09;
        catV2Runtime.nice.burstTimer = 0;
        catV2Runtime.nice.fireCooldown = 0.22 + Math.random() * 0.45;
      }
      if (catV2Runtime.nice.burstShots > 0 && catV2Runtime.nice.burstTimer <= 0 && Math.abs(angErr) < 0.55) {
        const fx = Math.cos(catV2Runtime.nice.angle);
        const fy = Math.sin(catV2Runtime.nice.angle);
        const px = -fy;
        const py = fx;
        const side = minDim * 0.017;
        const fwd = minDim * 0.010;
        const speed = minDim * (0.64 + Math.random() * 0.16);
        let emitters;
        if (Math.random() < 0.22) {
          emitters = [-1, 1];
        } else {
          catV2Runtime.niceShotSide = (catV2Runtime.niceShotSide >= 0) ? -1 : 1;
          emitters = [catV2Runtime.niceShotSide];
        }
        for (const sgn of emitters) {
          const mx = catV2Runtime.nice.x + px * side * sgn + fx * fwd;
          const my = catV2Runtime.nice.y + py * side * sgn + fy * fwd;
          const spread = (Math.random() * 2 - 1) * 0.14;
          const ang = catV2Runtime.nice.angle + spread;
          catV2Runtime.niceShots.push({
            x: mx,
            y: my,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            ttl: 2.1
          });
        }
        catV2Runtime.nice.burstShots--;
        catV2Runtime.nice.burstTimer = catV2Runtime.nice.burstGap;
      }
    }

    if (!catV2Runtime.alienCombatExiting && !catV2Runtime.alienCombatEntering) {
      if (catV2Runtime.evil.shieldActive) {
        catV2Runtime.evil.shieldTimer = Math.max(0, catV2Runtime.evil.shieldTimer - dt);
        if (catV2Runtime.evil.shieldTimer <= 0) {
          catV2Runtime.evil.shieldActive = false;
          catV2Runtime.evil.shieldCooldown = 20 + Math.random() * 4;
        }
      } else {
        catV2Runtime.evil.shieldCooldown = Math.max(0, catV2Runtime.evil.shieldCooldown - dt);
        if (catV2Runtime.evil.shieldCooldown <= 0 && Math.random() < dt * 0.28) {
          catV2Runtime.evil.shieldActive = true;
          catV2Runtime.evil.shieldTimer = 10.0;
        }
      }
    }
    catV2Runtime.evil.dropCooldown -= dt;
    const niceAboveEvil = seenN.y < (catV2Runtime.evil.y - minDim * 0.012);
    const tryLaunchMissile = (launchAng, chance) => {
      if (catV2Runtime.evil.missileCredit < 1) return;
      if (Math.random() >= chance) return;
      const mSpeed = minDim * (0.44 + Math.random() * 0.10);
      catV2Runtime.evilMissiles.push({
        x: catV2Runtime.evil.x,
        y: catV2Runtime.evil.y + minDim * 0.031,
        vx: Math.cos(launchAng) * mSpeed,
        vy: Math.sin(launchAng) * mSpeed,
        ang: launchAng,
        speed: mSpeed,
        turnRate: 1.45 + Math.random() * 0.55,
        ttl: 7.0,
        trail: [],
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleRate: 2.6 + Math.random() * 1.8,
        wobbleAmp: minDim * (0.0018 + Math.random() * 0.0015)
      });
      catV2Runtime.evil.missileCredit -= 1;
    };
    if (!catV2Runtime.alienCombatExiting && !catV2Runtime.alienCombatEntering && !catV2Runtime.evil.shieldActive && !niceAboveEvil && catV2Runtime.evil.dropCooldown <= 0) {
      const mx = catV2Runtime.evil.x;
      const my = catV2Runtime.evil.y + minDim * 0.024;
      const dx = seenN.x - catV2Runtime.evil.x;
      const ang = Math.PI * 0.5 + Math.max(-0.25, Math.min(0.25, dx / Math.max(1, minDim * 0.18)));
      const speed = minDim * (0.35 + Math.random() * 0.14);
      catV2Runtime.evilShots.push({
        x: mx,
        y: my,
        vx: Math.cos(ang) * speed * 0.22,
        vy: Math.sin(ang) * speed,
        ttl: 2.4
      });
      // Missile budget tracks 10% of evil plasma shots over time.
      catV2Runtime.evil.missileCredit = Math.min(6, catV2Runtime.evil.missileCredit + 0.10);
      // Normal (evil above) case: missile is possible but less likely.
      tryLaunchMissile(ang, 0.08);
      catV2Runtime.evil.dropCooldown = 0.42 + Math.random() * 0.85;
    } else if (!catV2Runtime.alienCombatExiting && !catV2Runtime.alienCombatEntering && !catV2Runtime.evil.shieldActive && niceAboveEvil && catV2Runtime.evil.dropCooldown <= 0) {
      // Opposite of plasma-drop logic: when evil is under nice, prefer missile attack.
      const dx = seenN.x - catV2Runtime.evil.x;
      const missileAng = Math.PI * 0.5 + Math.max(-0.30, Math.min(0.30, dx / Math.max(1, minDim * 0.18)));
      tryLaunchMissile(missileAng, 0.72);
      catV2Runtime.evil.dropCooldown = 0.10;
    }

    if (catV2Runtime.alienCombatExiting) {
      const margin = 80;
      const nOff = (catV2Runtime.nice.x < -margin || catV2Runtime.nice.x > w + margin || catV2Runtime.nice.y < -margin || catV2Runtime.nice.y > h + margin);
      const eOff = (catV2Runtime.evil.x < -margin || catV2Runtime.evil.x > w + margin || catV2Runtime.evil.y < -margin || catV2Runtime.evil.y > h + margin);
      if ((nOff && eOff
        && catV2Runtime.niceShots.length === 0
        && catV2Runtime.evilShots.length === 0
        && catV2Runtime.evilMissiles.length === 0
        && catV2Runtime.missileBursts.length === 0)
        || catV2Runtime.alienExitTimer > 14) {
        catV2Runtime.alienCombatActive = false;
        catV2Runtime.alienCombatExiting = false;
        catV2Runtime.alienCombatCooldown = 8 + Math.random() * 14;
      }
    }
  }

  const niceHitR = minDim * 0.05;
  const evilHitR = minDim * 0.052;
  const missileHitR = minDim * 0.032;
  const shieldR = minDim * 0.078;
  for (const m of catV2Runtime.evilMissiles) {
    // Predictive homing helps missile re-acquire instead of orbiting.
    const leadSec = 0.16;
    const targetX = catV2Runtime.nice.x + catV2Runtime.nice.vx * leadSec;
    const targetY = catV2Runtime.nice.y + catV2Runtime.nice.vy * leadSec;
    const dxT = targetX - m.x;
    const dyT = targetY - m.y;
    const targetAng = Math.atan2(dyT, dxT);
    let err = targetAng - m.ang;
    while (err > Math.PI) err -= Math.PI * 2;
    while (err < -Math.PI) err += Math.PI * 2;
    const errNorm = clamp01(Math.abs(err) / Math.PI);
    const maxStep = m.turnRate * (0.55 + errNorm * 0.95) * dt;
    m.ang += Math.max(-maxStep, Math.min(maxStep, err));
    m.vx = Math.cos(m.ang) * m.speed;
    m.vy = Math.sin(m.ang) * m.speed;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (!Array.isArray(m.trail)) m.trail = [];
    m.trail.push({ x: m.x, y: m.y });
    const maxTrailPoints = 34;
    if (m.trail.length > maxTrailPoints) {
      m.trail.splice(0, m.trail.length - maxTrailPoints);
    }
    m.ttl -= dt;
    if (m.ttl <= 0) {
      m.ttl = -1;
      catV2Runtime.missileBursts.push({
        x: m.x,
        y: m.y,
        age: 0
      });
      continue;
    }
    if (Math.hypot(m.x - catV2Runtime.nice.x, m.y - catV2Runtime.nice.y) <= niceHitR) {
      m.ttl = -1;
      catV2Runtime.nice.hurt = Math.min(1, catV2Runtime.nice.hurt + 0.20);
      catV2Runtime.missileBursts.push({
        x: m.x,
        y: m.y,
        age: 0
      });
    }
  }

  for (const p of catV2Runtime.niceShots) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.ttl -= dt;
    if (catV2Runtime.evil.shieldActive) {
      const sx = p.x - catV2Runtime.evil.x;
      const sy = p.y - catV2Runtime.evil.y;
      const sd = Math.hypot(sx, sy);
      if (sd <= shieldR && sd > 1e-5) {
        const nx = sx / sd;
        const ny = sy / sd;
        const tx = -ny;
        const ty = nx;
        const speed = Math.max(1e-5, Math.hypot(p.vx, p.vy));
        const tangentSign = Math.sign(p.vx * tx + p.vy * ty) || 1;
        p.vx = tx * tangentSign * speed * 0.92 + nx * speed * 0.25;
        p.vy = ty * tangentSign * speed * 0.92 + ny * speed * 0.25;
        p.x = catV2Runtime.evil.x + nx * (shieldR + 2);
        p.y = catV2Runtime.evil.y + ny * (shieldR + 2);
        p.ttl = Math.max(0, p.ttl - 0.05);
        catV2Runtime.evil.shieldImpactTimer = 0.26;
        continue;
      }
    }
    for (const m of catV2Runtime.evilMissiles) {
      if (m.ttl > 0 && Math.hypot(p.x - m.x, p.y - m.y) <= missileHitR) {
        p.ttl = -1;
        m.ttl = -1;
        catV2Runtime.missileBursts.push({
          x: m.x,
          y: m.y,
          age: 0
        });
        break;
      }
    }
    if (p.ttl <= 0) continue;
    if (Math.hypot(p.x - catV2Runtime.evil.x, p.y - catV2Runtime.evil.y) <= evilHitR) {
      p.ttl = -1;
      catV2Runtime.evil.hurt = 1;
    }
  }
  for (const p of catV2Runtime.evilShots) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.ttl -= dt;
    if (Math.hypot(p.x - catV2Runtime.nice.x, p.y - catV2Runtime.nice.y) <= niceHitR) {
      p.ttl = -1;
      catV2Runtime.nice.hurt = 1;
    }
  }
  catV2Runtime.niceShots = catV2Runtime.niceShots.filter(p => p.ttl > 0 && p.x > -40 && p.x < w + 40 && p.y > -40 && p.y < h + 40);
  catV2Runtime.evilShots = catV2Runtime.evilShots.filter(p => p.ttl > 0 && p.x > -40 && p.x < w + 40 && p.y > -40 && p.y < h + 40);
  catV2Runtime.evilMissiles = catV2Runtime.evilMissiles.filter(m => m.ttl > 0 && m.x > -90 && m.x < w + 90 && m.y > -90 && m.y < h + 90);

  catV2Runtime.nice.hurt += (0 - catV2Runtime.nice.hurt) * (1 - Math.exp(-6.8 * dt));
  catV2Runtime.evil.hurt += (0 - catV2Runtime.evil.hurt) * (1 - Math.exp(-6.8 * dt));

  for (const p of catV2Runtime.evilShots) {
    const ds = combatDepthScale(p.y, h);
    drawCombatSprite(evilShotImg, p.x, p.y, minDim * 0.015 * ds, minDim * 0.015 * ds, 0, 0, 0.92);
  }
  // Draw missile exhaust behind missile sprite for depth.
  for (const m of catV2Runtime.evilMissiles) {
    if (!Array.isArray(m.trail) || m.trail.length < 2) continue;
    const segTotal = m.trail.length - 1;
    const wobbleT = performance.now() * 0.001 * m.wobbleRate + m.wobblePhase;
    const logDen = Math.log1p(16);
    for (let i = 0; i < segTotal; i++) {
      const a = m.trail[i];
      const b = m.trail[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const nx = len > 1e-5 ? (-dy / len) : 0;
      const ny = len > 1e-5 ? (dx / len) : 0;
      const t = (i + 1) / segTotal;
      const age = 1 - t;
      const wobble = Math.sin(wobbleT + i * 0.52) * m.wobbleAmp * (0.35 + age * 0.65);
      const ax = a.x + nx * wobble;
      const ay = a.y + ny * wobble;
      const bx = b.x + nx * wobble;
      const by = b.y + ny * wobble;
      const taper = 1 - (Math.log1p(age * 16) / logDen);
      const ds = combatDepthScale((a.y + b.y) * 0.5, h);
      const alpha = (0.10 + 0.22 * taper) * ds;
      const width = (minDim * 0.0045 * ds) * (0.55 + 0.7 * taper);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = `rgba(168,168,176,${alpha.toFixed(3)})`;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  for (const m of catV2Runtime.evilMissiles) {
    const ds = combatDepthScale(m.y, h);
    // Missile art points "forward" from the image bottom.
    drawCombatSprite(missileImg, m.x, m.y, minDim * 0.036 * ds, minDim * 0.036 * ds, m.ang - Math.PI * 0.5, 0, 0.97);
  }
  for (const p of catV2Runtime.niceShots) {
    const ds = combatDepthScale(p.y, h);
    drawCombatSprite(niceShotImg, p.x, p.y, minDim * 0.012 * ds, minDim * 0.012 * ds, 0, 0, 0.95);
  }
  for (const b of catV2Runtime.missileBursts) {
    b.age += dt;
    const frameDur = 0.048;
    const seqDur = frameDur * 4;
    const fadeDur = 0.26;
    const totalDur = seqDur + fadeDur;
    const age = b.age;
    let frameIdx = Math.min(3, Math.floor(age / frameDur));
    if (frameIdx < 0) frameIdx = 0;
    const img = missileHitImgs[frameIdx] || missileHitImgs[missileHitImgs.length - 1];
    if (!img) continue;
    let alpha = 1;
    let scale = 1;
    if (age > seqDur) {
      const t = Math.min(1, (age - seqDur) / fadeDur);
      alpha = Math.pow(1 - t, 1.5);
      scale = 1 + t * 0.42;
      frameIdx = Math.min(3, missileHitImgs.length - 1);
    }
    const ds = combatDepthScale(b.y, h);
    drawCombatSprite(img, b.x, b.y, minDim * 0.070 * scale * ds, minDim * 0.070 * scale * ds, 0, 0, alpha * 0.98);
    b.ttl = totalDur - age;
  }
  catV2Runtime.missileBursts = catV2Runtime.missileBursts.filter(b => (b.ttl || 0) > 0);

  const niceOnRight = catV2Runtime.nice.x > catV2Runtime.evil.x;
  const sidePreferredImg = niceOnRight ? evilImgR : evilImgL;
  const movingImg = catV2Runtime.evil.vx >= 0 ? evilImgR : evilImgL;
  const moveStrong = Math.abs(catV2Runtime.evil.vx) > minDim * 0.002;
  const evilImg = moveStrong ? (movingImg === sidePreferredImg ? movingImg : sidePreferredImg) : sidePreferredImg;
  const evilDepth = combatDepthScale(catV2Runtime.evil.y, h);
  drawCombatSprite(evilImg, catV2Runtime.evil.x, catV2Runtime.evil.y, minDim * 0.115 * evilDepth, minDim * 0.115 * evilDepth, 0, catV2Runtime.evil.hurt, 0.96);
  if (catV2Runtime.evil.shieldActive) {
    drawCombatSprite(shieldImg, catV2Runtime.evil.x, catV2Runtime.evil.y, minDim * 0.162 * evilDepth, minDim * 0.162 * evilDepth, 0, 0, 0.90);
    if (shieldImpactImg && catV2Runtime.evil.shieldImpactTimer > 0) {
      const impactDur = 0.26;
      const attackDur = 0.05;
      const elapsed = impactDur - catV2Runtime.evil.shieldImpactTimer;
      const decayT = clamp01((elapsed - attackDur) / Math.max(1e-4, impactDur - attackDur));
      const impactAlpha = elapsed <= attackDur
        ? clamp01(elapsed / attackDur)
        : Math.pow(1 - decayT, 0.72);
      drawCombatSprite(shieldImpactImg, catV2Runtime.evil.x, catV2Runtime.evil.y, minDim * 0.171 * evilDepth, minDim * 0.171 * evilDepth, 0, 0, impactAlpha * 0.98);
    }
  }
  const niceDepth = combatDepthScale(catV2Runtime.nice.y, h);
  drawCombatSprite(niceImg, catV2Runtime.nice.x, catV2Runtime.nice.y, minDim * 0.1025 * niceDepth, minDim * 0.1025 * niceDepth, catV2Runtime.nice.angle, catV2Runtime.nice.hurt, 0.96);
}

function updateAdaptiveRange(range, value) {
  const fast = 0.08;
  const slow = 0.003;
  if (value < range.floor) range.floor += (value - range.floor) * fast;
  else range.floor += (value - range.floor) * slow;
  if (value > range.ceil) range.ceil += (value - range.ceil) * fast;
  else range.ceil += (value - range.ceil) * slow;
  if (range.ceil - range.floor < 1e-4) range.ceil = range.floor + 1e-4;
}

function normalizeAdaptive(range, value) {
  return clamp01((value - range.floor) / (range.ceil - range.floor));
}

function smooth(name, target, alpha = 0.2) {
  features[name] += (target - features[name]) * alpha;
}

function getInputGain() {
  const t = modeControls.value("energy", 100) / 100;
  return Math.max(0, Math.min(2, t));
}

function getZoomFactor() {
  return modeControls.value("zoom", 90) / 100;
}

function getBaseSpeedHz() {
  const hz = modeControls.value("speed", 5.45);
  return Math.max(0.1, Math.min(10, hz));
}

function getPhaseRateMaxCyclesPerSec() {
  return modeControls.value("phase", 50) * 0.1; // 0..10 cycles/s
}

function getPhaseResponse() {
  const t = clamp01(modeControls.value("phaseResponse", 50) / 100);
  return Math.pow(t, 1.7); // exponential response: stronger effect in upper range
}

function getBassEmphasis() {
  return clamp01(modeControls.value("bassEmphasis", 50) / 100);
}

function getShapeAmount() {
  return clamp01(modeControls.value("shape", 50) / 100);
}

function getBassBandScale() {
  // Full-range mapping: 0..100% -> 0.0x..2.0x (50% stays neutral at 1.0x).
  return (currentMode === "fractals" ? getShapeAmount() : getBassEmphasis()) * 2;
}

function getBassRetuneDepth() {
  // Full-range damping depth for quadrature retune: 0..100% -> 0..1.
  return getBassEmphasis();
}

function getFruitsPresence() {
  return clamp01(modeControls.value("fruits", 50) / 100);
}

function getRainAmount() {
  return clamp01(modeControls.value("rain", 0) / 100);
}

function getDropSizeScale() {
  return 1 + clamp01(modeControls.value("dropSize", 0) / 100) * 4;
}

function getCatFragmentResponse() {
  return CAT_FRAGMENT_RESPONSE_STATIC;
}

function getCatFragmentPoolSize() {
  return CAT_FRAGMENT_POOL_STATIC;
}

function getShapeLfoRateHz() {
  return clamp01(modeControls.value("shapeLfo", 0) / 500) * 0.5;
}

function getFruitsLfoRateHz() {
  return clamp01(modeControls.value("fruitsLfo", 0) / 500) * 0.5;
}

function updateShapeLfoIndicator(lfo, lfoRateHz, shapeDepthNorm) {
  if (currentMode !== "fractals") return;

  const depthPct = clamp01(shapeDepthNorm) * 50;
  const minPct = 50 - depthPct;
  const maxPct = 50 + depthPct;
  const dotPct = 50 + lfo * depthPct;
  const distPct = Math.abs(dotPct - 50);
  shapeLfoRange.style.left = `${minPct}%`;
  shapeLfoRange.style.width = `${Math.max(0, maxPct - minPct)}%`;
  shapeLfoDot.style.left = `${dotPct}%`;
  shapeLfoLine.style.width = `${distPct}%`;
  shapeLfoLine.style.transform = dotPct >= 50 ? "scaleX(1)" : "scaleX(-1)";
  const active = lfoRateHz > 0.0001;
  shapeLfoRange.style.opacity = active ? "1" : "0";
  shapeLfoDot.style.opacity = active ? "1" : "0.2";
  shapeLfoLine.style.opacity = active ? "0.95" : "0.2";
  shapeControl.classList.toggle("lfo-active", active);
}

function updateFruitLfoIndicator(lfo, lfoRateHz, fruitsDepthNorm) {
  const depthPct = clamp01(fruitsDepthNorm) * 50;
  const minPct = 50 - depthPct;
  const maxPct = 50 + depthPct;
  const dotPct = 50 + lfo * depthPct;
  const distPct = Math.abs(dotPct - 50);
  fruitLfoRange.style.left = `${minPct}%`;
  fruitLfoRange.style.width = `${Math.max(0, maxPct - minPct)}%`;
  fruitLfoDot.style.left = `${dotPct}%`;
  fruitLfoLine.style.width = `${distPct}%`;
  fruitLfoLine.style.transform = dotPct >= 50 ? "scaleX(1)" : "scaleX(-1)";
  const active = lfoRateHz > 0.0001;
  fruitLfoRange.style.opacity = active ? "1" : "0";
  fruitLfoDot.style.opacity = active ? "1" : "0.2";
  fruitLfoLine.style.opacity = active ? "0.95" : "0.2";
  fruitControl.classList.toggle("lfo-active", active);
}

function ensureRainParticles(targetCount, w, h) {
  const ps = rainRuntime.particles;
  while (ps.length < targetCount) {
    ps.push({
      x: Math.random() * w,
      y: -Math.random() * h,
      speed: 22 + Math.random() * 42,
      drift: (Math.random() * 2 - 1) * 14,
      size: 1 + Math.random() * 1.2,
      hueOffset: Math.random() * 360,
      phase: Math.random() * Math.PI * 2
    });
  }
  if (ps.length > targetCount) ps.length = targetCount;
}

function drawRainLayer(nowMs, low2060, vol) {
  const rainAmt = getRainAmount();
  const targetCount = Math.round(rainAmt * 160);
  if (targetCount <= 0) {
    rainRuntime.particles.length = 0;
    rainRuntime.lastMs = nowMs;
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  let dt = (nowMs - rainRuntime.lastMs) * 0.001;
  rainRuntime.lastMs = nowMs;
  if (!Number.isFinite(dt) || dt < 0) dt = 0.016;
  if (dt > 0.05) dt = 0.05;
  ensureRainParticles(targetCount, w, h);
  const dropSizeScale = getDropSizeScale();
  const lowGreenPull = clamp01(low2060 * 1.3);
  const baseAlpha = 0.10 + rainAmt * 0.22 + vol * 0.34;
  const tNow = nowMs * 0.001;
  for (let i = 0; i < rainRuntime.particles.length; i++) {
    const p = rainRuntime.particles[i];
    const vy = p.speed * (0.72 + rainAmt * 0.9);
    p.y += vy * dt;
    p.x += Math.sin(tNow * 0.5 + p.phase) * p.drift * dt;
    if (p.y > h + 8 || p.x < -12 || p.x > w + 12) {
      p.y = -8 - Math.random() * h * 0.2;
      p.x = Math.random() * w;
    }
    const hueMorph = (p.hueOffset + tNow * 36 + Math.sin(tNow * 0.8 + p.phase) * 24) % 360;
    const hue = hueMorph + (102 - hueMorph) * lowGreenPull;
    const sat = 72 + lowGreenPull * 24;
    const light = 58 + vol * 24 + lowGreenPull * 10;
    const aCore = clamp01(baseAlpha * (0.75 + Math.sin(tNow * 2.2 + p.phase) * 0.25));
    const aSide = aCore * 0.26;
    const px = p.x;
    const py = p.y;
    const s = p.size * dropSizeScale;
    ctx.fillStyle = `hsla(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%, ${aSide.toFixed(3)})`;
    ctx.fillRect(px - s, py, s, s);
    ctx.fillRect(px + s, py, s, s);
    ctx.fillRect(px, py - s, s, s);
    ctx.fillRect(px, py + s, s, s);
    ctx.fillStyle = `hsla(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${Math.min(98, light + 18).toFixed(1)}%, ${aCore.toFixed(3)})`;
    ctx.fillRect(px, py, s, s);
  }
}

function getStrobeInfluence() {
  return clamp01(modeControls.value("strobe", 0) / 100);
}

function getStrobeLfoRateHz() {
  const raw = modeControls.value("strobeLfo", 0);
  if (raw <= 0) return 0;
  const t = clamp01(raw / 300);
  const minHz = 0.01;
  const maxHz = 3.0;
  // Log mapping for finer control at low frequencies.
  return Math.exp(Math.log(minHz) + t * (Math.log(maxHz) - Math.log(minHz)));
}

function getWarpWaveInfluence() {
  const t = clamp01(modeControls.value("warp", 50) / 100);
  // Perceptual curve: gives more response in low/mid slider positions.
  return Math.pow(t, 0.55);
}

function getFoldInfluence() {
  return clamp01(modeControls.value("fold", 0) / 100);
}

function getFoldResponseBias() {
  const t = clamp01(modeControls.value("foldResponse", 50) / 100);
  return (t - 0.5) * 2; // -1..1 (left=low brake, right=high brake)
}

function setPhaseVisual() {
  phaseValue.textContent = `${getPhaseRateMaxCyclesPerSec().toFixed(2)}c/s`;
}

function updateStrobeLfoIndicator(lfo, lfoRateHz) {
  const pct = ((lfo + 1) * 0.5) * 100;
  const centerPct = 50;
  const distPct = Math.abs(pct - centerPct);
  strobeLfoDot.style.left = `${pct}%`;
  strobeLfoLine.style.width = `${distPct}%`;
  strobeLfoLine.style.transform = pct >= centerPct ? "scaleX(1)" : "scaleX(-1)";
  const strength = lfoRateHz > 0 ? 1 : 0.2;
  strobeLfoDot.style.opacity = `${strength}`;
  strobeLfoLine.style.opacity = `${0.3 + strength * 0.7}`;
}

function pickUniqueRandomIndices(count, maxExclusive) {
  const n = Math.max(0, Math.min(count, maxExclusive));
  const picked = [];
  const used = new Set();
  while (picked.length < n && used.size < maxExclusive) {
    const idx = Math.floor(Math.random() * maxExclusive);
    if (used.has(idx)) continue;
    used.add(idx);
    picked.push(idx);
  }
  return picked;
}

function pickCatFragmentVariant(poolSize, blockedGroupKeys, preferPrefix = "", preferChance = 0) {
  const groups = catV2Textures.fragmentGroups;
  const activeSetFolders = catV2Runtime.activeFragmentSetFolders;
  const total = groups.length;
  if (total <= 0) return null;
  const effectivePool = Math.max(1, Math.min(poolSize, total));
  const poolIndices = effectivePool >= total ? [...Array(total).keys()] : pickUniqueRandomIndices(effectivePool, total);

  let candidates = [];
  for (const idx of poolIndices) {
    const group = groups[idx];
    if (!group || group.length === 0) continue;
    const groupKey = group[0].groupKey;
    if (blockedGroupKeys && blockedGroupKeys.has(groupKey)) continue;
    const activeVariants = group.filter(v => activeSetFolders.has(v.setFolder));
    if (activeVariants.length > 0) candidates.push(activeVariants);
  }
  if (candidates.length === 0) {
    for (const group of groups) {
      if (!group || group.length === 0) continue;
      const groupKey = group[0].groupKey;
      if (blockedGroupKeys && blockedGroupKeys.has(groupKey)) continue;
      const activeVariants = group.filter(v => activeSetFolders.has(v.setFolder));
      if (activeVariants.length > 0) candidates.push(activeVariants);
    }
  }
  if (candidates.length === 0) return null;
  const group = candidates[Math.floor(Math.random() * candidates.length)];
  let variants = group;
  if (preferPrefix && preferChance > 0 && Math.random() < preferChance) {
    const pref = group.filter(v => v.prefix === preferPrefix || v.folder === preferPrefix);
    if (pref.length > 0) variants = pref;
  }
  return variants[Math.floor(Math.random() * variants.length)] || null;
}

function setXMultiplier(mult) {
  xFreqMultiplier = mult;
  xMultButtons.forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.mult) === mult);
  });
}

function updateCatSetButtonsUI() {
  if (!catSetButtons || catSetButtons.length === 0) return;
  catSetButtons.forEach(btn => {
    const groupName = btn.dataset.discoGroup;
    const groupFolders = CAT_FRAGMENT_DISCO_GROUPS[groupName] || [];
    const isActive = groupFolders.length > 0 && groupFolders.every(folder => catV2Runtime.activeFragmentSetFolders.has(folder));
    btn.classList.toggle("active", isActive);
  });
}

function applyControlVisibility() {
  controlRowMap.forEach((row, key) => {
    row.style.display = visibleControls.has(key) ? "flex" : "none";
  });
  helpEntries.forEach(entry => {
    const key = entry.dataset.helpControl;
    entry.style.display = visibleControls.has(key) ? "block" : "none";
  });
}

function updateModeSpecificUI() {
  const isBpm = currentMode === "bpm-lab";
  settingsMenu.style.display = isBpm ? "none" : "";
  bpmLabPanel.hidden = !isBpm;
  updateBpmPanel();
  xMultControls.style.display = currentMode === "stereo-osc" ? "flex" : "none";
}

function resetCurrentModeSliders() {
  modeControls.reset();
  if (currentMode === "stereo-osc") { resetQuadratureDynamics(); setXMultiplier(1); }
  if (currentMode === "cat") catV2Runtime.activeFragmentSetFolders = new Set(CAT_FRAGMENT_SET_SPECS.map(set => set.folder));
  updateInputUI();
}

function randomizeAllSliders() {
  modeControls.randomize();
  if (currentMode === "stereo-osc") resetQuadratureDynamics();
  updateInputUI();
}

function resetQuadratureDynamics() {
  microtuneNormEma = 0;
  bassBandEma = 0;
  lowPhaseLagEma = 0;
  oscSizeEma = 0;
  phaseOffsetCycles = 0;
  microtuneAdaptive.floor = 0.01;
  microtuneAdaptive.ceil = 0.10;
}

function showViewExitTemporarily() {
  if (!isViewOnly) return;
  viewExitBtn.classList.add("show");
  if (viewExitHideTimer) clearTimeout(viewExitHideTimer);
  viewExitHideTimer = setTimeout(() => {
    viewExitBtn.classList.remove("show");
  }, 1300);
}

function enterViewMode() {
  isViewOnly = true;
  document.body.classList.add("view-only");
  showViewExitTemporarily();
}

function exitViewMode() {
  isViewOnly = false;
  document.body.classList.remove("view-only");
  viewExitBtn.classList.remove("show");
  if (viewExitHideTimer) {
    clearTimeout(viewExitHideTimer);
    viewExitHideTimer = null;
  }
}

function computeFeatures() {
  if (!audioReady || !analyser) return;

  analyser.getFloatTimeDomainData(timeData);
  analyser.getByteFrequencyData(freqData);
  const inputGain = getInputGain();

  // volume + peak
  let sum = 0;
  let sumDet = 0;
  let peak = 0;
  let peakDet = 0;
  let crossings = 0;
  for (let i = 0; i < timeData.length; i++) {
    const raw = timeData[i];
    const v = raw * inputGain;
    sum += v * v;
    sumDet += raw * raw;
    if (Math.abs(v) > peak) peak = Math.abs(v);
    if (Math.abs(raw) > peakDet) peakDet = Math.abs(raw);
    if (i > 0 && ((timeData[i - 1] <= 0 && v > 0) || (timeData[i - 1] >= 0 && v < 0))) crossings++;
  }
  const rms = Math.sqrt(sum / timeData.length);
  const rmsDet = Math.sqrt(sumDet / timeData.length);
  const rmsDb = Math.max(-60, Math.min(0, 20 * Math.log10(rms + 1e-8)));
  const zcr = crossings / timeData.length;

  // frequency lanes + centroid + flux
  const nyquist = (audioCtx.sampleRate || 48000) / 2;
  const hzPerBin = nyquist / freqData.length;
  const bassBandScale = getBassBandScale();

  let bass = 0, mid = 0, high = 0, highAir = 0, lowSub = 0, lowBass = 0, lowBand110 = 0, lowBand150 = 0, lowBand60250 = 0, kickBand = 0;
  let lowBand60250Det = 0, kickBandDet = 0;
  let weighted = 0, total = 0;
  let flux = 0;
  let fluxDet = 0;

  for (let i = 0; i < freqData.length; i++) {
    const magBase = (freqData[i] / 255);
    const mag = magBase * inputGain;
    const hz = i * hzPerBin;

    // Linear low-frequency boost: strongest at low Hz, weakest at high Hz.
    const lowBoost = 1 + 1.1 * (1 - Math.min(hz, 20000) / 20000);
    const magW = mag * lowBoost;

    total += magW;
    weighted += magW * hz;

    if (hz >= 20 && hz < 250) lowSub += magW * 1.35 * bassBandScale;
    if (hz >= 20 && hz < 60) lowBass += magW * 1.45;
    if (hz >= 20 && hz < 110) lowBand110 += magW * 1.26;
    if (hz >= 20 && hz < 150) lowBand150 += magW * 1.2;
    if (hz >= 60 && hz < 250) lowBand60250 += magW * 1.22;
    if (hz >= 35 && hz < 95) kickBand += magW * 1.5;
    const magDetW = magBase * lowBoost;
    if (hz >= 60 && hz < 250) lowBand60250Det += magDetW * 1.22;
    if (hz >= 35 && hz < 95) kickBandDet += magDetW * 1.5;
    if (hz >= 150 && hz < 350) bass += magW * 1.25 * bassBandScale;
    else if (hz >= 350 && hz < 2500) mid += magW;
    else if (hz >= 2500 && hz <= 20000) high += magW;
    if (hz >= 4000 && hz <= 20000) highAir += magW;

    const prev = prevFreq[i] || 0;
    const d = mag - prev;
    if (d > 0) flux += d;
    prevFreq[i] = mag;
    const prevDet = prevFreqDet[i] || 0;
    const dDet = magBase - prevDet;
    if (dDet > 0) fluxDet += dDet;
    prevFreqDet[i] = magBase;
  }

  const centroid = total > 1e-6 ? (weighted / total) / nyquist : 0;
  const bassN = clamp01(bass / (freqData.length * 0.02));
  const midN  = clamp01(mid  / (freqData.length * 0.10));
  const highN = clamp01(high / (freqData.length * 0.11));
  const fluxN = clamp01(flux * 0.9);
  const lowSubN = clamp01(lowSub / (freqData.length * 0.04));
  const lowBassN = clamp01(lowBass / (freqData.length * 0.02));
  const lowBand110N = clamp01(lowBand110 / (freqData.length * 0.05));
  const lowBand150N = clamp01(lowBand150 / (freqData.length * 0.06));
  const lowBand60250N = clamp01(lowBand60250 / (freqData.length * 0.07));
  const kickBandN = clamp01(kickBand / (freqData.length * 0.028));
  const lowBand60250DetN = clamp01(lowBand60250Det / (freqData.length * 0.07));
  const kickBandDetN = clamp01(kickBandDet / (freqData.length * 0.028));
  const highAirN = clamp01(highAir / (freqData.length * 0.08));

  fluxEma = fluxEma * 0.86 + fluxN * 0.14;
  const fluxDetN = clamp01(fluxDet * 0.9);
  fluxDetEma = fluxDetEma * 0.86 + fluxDetN * 0.14;
  const onset = clamp01((fluxN - fluxEma) * 5.45 + rms * 0.6);
  const onsetDet = clamp01((fluxDetN - fluxDetEma) * 5.45 + rmsDet * 0.6);

  smooth("volumeRms", clamp01(rms * 4.2), 0.2);
  smooth("rmsDb", rmsDb, 0.16);
  smooth("peak", clamp01(peak * 2.4), 0.22);
  smooth("spectralCentroid", centroid, 0.18);
  smooth("bassEnergy", bassN, 0.2);
  smooth("lowBass", lowBassN, 0.28);
  smooth("lowBand110", lowBand110N, 0.28);
  smooth("lowBand150", lowBand150N, 0.28);
  smooth("lowBand60250", lowBand60250N, 0.28);
  smooth("kickBand", kickBandN, 0.32);
  smooth("midEnergy", midN, 0.2);
  smooth("highEnergy", highN, 0.2);
  smooth("highAir", highAirN, 0.24);
  smooth("spectralFlux", fluxN, 0.2);
  smooth("zeroCrossingRate", clamp01(zcr * 8), 0.2);
  smooth("onset", onset, 0.25);
  smooth("lowSub", lowSubN, 0.24);
  smooth("detectorRms", clamp01(rmsDet * 4.2), 0.2);
  smooth("detectorPeak", clamp01(peakDet * 2.4), 0.22);
  smooth("detectorLowBand60250", lowBand60250DetN, 0.28);
  smooth("detectorKickBand", kickBandDetN, 0.32);
  smooth("detectorOnset", onsetDet, 0.25);
}

function drawFractals() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w * 0.5;
  const cy = h * 0.96;
  const nowMs = performance.now();
  let dtMs = nowMs - fractalRuntime.lastNowMs;
  fractalRuntime.lastNowMs = nowMs;
  if (!Number.isFinite(dtMs) || dtMs < 1) dtMs = 16.7;
  if (dtMs > 100) dtMs = 100;
  fractalRuntime.dtEmaMs += (dtMs - fractalRuntime.dtEmaMs) * 0.1;
  fractalRuntime.frameIndex++;
  const perfNorm = clamp01((28 - fractalRuntime.dtEmaMs) / 12); // ~1 near 60fps, ~0 when struggling
  const quality = 0.55 + perfNorm * 0.45;

  const vol = features.volumeRms;
  const bass = features.bassEnergy;
  const lowBass = features.lowBass;
  const mid = features.midEnergy;
  const high = features.highEnergy;
  const highAir = features.highAir;
  const onset = features.onset;
  const shapeBaseNorm = getShapeAmount();
  const shapeLfoRateHz = getShapeLfoRateHz();
  const shapeLfoActive = shapeLfoRateHz > 0.0001;
  const shapeLfo = shapeLfoActive ? Math.sin(2 * Math.PI * shapeLfoRateHz * nowMs * 0.001) : 0;
  const shapeDepthNorm = shapeBaseNorm;
  const shapeEffectiveNorm = shapeLfoActive
    ? clamp01(0.5 + shapeLfo * (shapeDepthNorm * 0.5))
    : shapeBaseNorm;
  updateShapeLfoIndicator(shapeLfo, shapeLfoRateHz, shapeDepthNorm);
  const bassScale = 0.7 + shapeEffectiveNorm * 0.9;
  const treeCount = 1;
  const low2060 = clamp01(lowBass * 1.15 + onset * 0.22);
  const fruitsBaseNorm = getFruitsPresence();
  const fruitsLfoRateHz = getFruitsLfoRateHz();
  const fruitsLfoActive = fruitsLfoRateHz > 0.0001;
  const lfo = fruitsLfoActive ? Math.sin(2 * Math.PI * fruitsLfoRateHz * nowMs * 0.001) : 0;
  // Fruits acts as LFO amount VCA around midpoint. 100% => full 0..100 sweep.
  const fruitsDepthNorm = fruitsBaseNorm;
  const fruitsEffectiveNorm = fruitsLfoActive
    ? clamp01(0.5 + lfo * (fruitsDepthNorm * 0.5))
    : fruitsBaseNorm;
  updateFruitLfoIndicator(lfo, fruitsLfoRateHz, fruitsDepthNorm);

  // Persistent dark wash with slight audio pulse.
  const bgA = 0.08 + vol * 0.05;
  ctx.fillStyle = `rgba(4, 8, 14, ${bgA})`;
  ctx.fillRect(0, 0, w, h);

  // Preloaded image layers:
  // Layer 1 (base) reacts to global RMS.
  // Layer 2 overlays on 20-60Hz low-end.
  // Layer 3 overlays on 4k-20kHz high frequencies with gated envelope logic.
  const baseAlphaTarget = clamp01(0.01 + Math.pow(vol, 1.45) * 0.82);
  const lowAlphaTarget = clamp01(Math.pow(low2060, 1.2) * 0.78);
  const dtSec = Math.max(0.001, dtMs * 0.001);
  // High detector: transient-based (fast minus slow) + a lighter absolute high-band term.
  const highFastK = 1 - Math.exp(-26 * dtSec);
  const highSlowK = 1 - Math.exp(-3.8 * dtSec);
  fractalRuntime.highFastEma += (highAir - fractalRuntime.highFastEma) * highFastK;
  fractalRuntime.highSlowEma += (highAir - fractalRuntime.highSlowEma) * highSlowK;
  const highTransient = clamp01((fractalRuntime.highFastEma - fractalRuntime.highSlowEma) * 9.6);
  const highLevel = clamp01((highAir - 0.10) / 0.55);
  const highDet = clamp01(highTransient * 0.82 + highLevel * 0.34 + features.spectralFlux * 0.24 * highLevel);
  const peakAttack = 1 - Math.exp(-42 * dtSec);
  const peakRelease = 1 - Math.exp(-7.2 * dtSec);
  fractalRuntime.highPeakEma += (highDet - fractalRuntime.highPeakEma) *
    (highDet > fractalRuntime.highPeakEma ? peakAttack : peakRelease);
  const gateOpenThr = 0.16;
  const gateCloseThr = 0.10;
  if (!fractalRuntime.highGateOpen && fractalRuntime.highPeakEma >= gateOpenThr) {
    fractalRuntime.highGateOpen = 1;
  } else if (fractalRuntime.highGateOpen && fractalRuntime.highPeakEma <= gateCloseThr) {
    fractalRuntime.highGateOpen = 0;
  }
  // Envelope amount is proportional to peak above gate threshold.
  const highEnv = clamp01((fractalRuntime.highPeakEma - gateOpenThr) / Math.max(1e-6, 1 - gateOpenThr));
  const highFlicker = clamp01(highTransient * 1.15 + features.spectralFlux * 0.35 * highLevel);
  const fruitsGain = fruitsEffectiveNorm * 2; // 50% keeps current level, 0% hides image 3.
  const fruitsBoost = Math.max(0, (fruitsBaseNorm - 0.5) * 2); // >50% boosts dynamics/decay speed
  const highAlphaTarget = fractalRuntime.highGateOpen
    ? clamp01((Math.pow(highEnv, 0.92) * (1.06 + fruitsBoost * 0.8) + highFlicker * (0.42 + fruitsBoost * 0.38)) * fruitsGain)
    : 0;
  // Fast attack + slower release to keep snappy feel without flicker.
  fractalRuntime.baseAlphaEma += (baseAlphaTarget - fractalRuntime.baseAlphaEma) * (baseAlphaTarget > fractalRuntime.baseAlphaEma ? 0.24 : 0.12);
  fractalRuntime.lowAlphaEma += (lowAlphaTarget - fractalRuntime.lowAlphaEma) * (lowAlphaTarget > fractalRuntime.lowAlphaEma ? 0.34 : 0.16);
  const highAttack = 1 - Math.exp(-52 * dtSec); // very fast attack
  const highRelease = 1 - Math.exp(-(9.2 + fruitsBoost * 8.5) * dtSec); // faster decay at higher Fruits
  fractalRuntime.highAlphaEma += (highAlphaTarget - fractalRuntime.highAlphaEma) *
    (highAlphaTarget > fractalRuntime.highAlphaEma ? highAttack : highRelease);
  const baseAlpha = fractalRuntime.baseAlphaEma;
  const lowAlpha = fractalRuntime.lowAlphaEma;
  const highAlpha = fractalRuntime.highAlphaEma;
  drawImageCover(fractalTextures.base, baseAlpha);
  if ((fractalRuntime.frameIndex & 1) === 0 && lowAlpha > 0.02) {
    drawImageCover(fractalTextures.low, lowAlpha);
  }
  if (highAlpha > 0.01) {
    drawImageCover(fractalTextures.high, highAlpha);
  }
  drawRainLayer(nowMs, low2060, vol);

  if (!audioReady) return;

  const maxDepthBase = 5 + Math.floor(clamp01(mid * 1.2 + onset * 0.8) * (2 + quality)); // adaptive ~5..8
  const complexityScale = 0.78 + quality * 0.16;
  // Adaptive budget: scales down when frame time rises.
  let branchBudget = Math.floor(950 + quality * 1150); // ~950..2100
  const trunkLen = Math.min(w, h) * (0.14 + vol * 0.18);
  const baseAngle = 0.28 + bass * 0.7 * bassScale;
  const sway = Math.sin(nowMs * 0.0017) * (0.05 + high * 0.25);
  const branchDecay = 0.66 + high * 0.10;
  const lineBase = 0.7 + vol * 2.0;

  // Hue/brightness shift with band balance.
  const hue = 150 + high * 70 - bass * 35;
  const sat = 70 + mid * 20;
  const light = 55 + vol * 28;

  function drawTree(rootX, rootY, len, treeScale, treeDepth, branchCenterMix, swaySign, hueShift) {
    const depthStyles = new Array(treeDepth + 1);
    const depthWidths = new Array(treeDepth + 1);
    for (let d = 1; d <= treeDepth; d++) {
      const t = d / Math.max(treeDepth, 1);
      const hLocal = hue + hueShift;
      const lLocal = Math.min(94, 68 + light * 0.25 + t * 16);
      const aLocal = Math.min(1, 0.30 + t * 0.62);
      depthStyles[d] = `hsla(${hLocal.toFixed(1)}, ${sat.toFixed(1)}%, ${lLocal.toFixed(1)}%, ${aLocal.toFixed(3)})`;
      depthWidths[d] = Math.max(0.65, lineBase * treeScale * (0.60 + t * 0.64));
    }
    function branch(x, y, branchLen, angle, depth) {
      if (depth <= 0 || branchLen < 1.25 || branchBudget <= 0) return;
      branchBudget--;

      const x2 = x + Math.cos(angle) * branchLen;
      const y2 = y + Math.sin(angle) * branchLen;
      const styleIdx = Math.min(treeDepth, depth);
      ctx.strokeStyle = depthStyles[styleIdx];
      ctx.lineWidth = depthWidths[styleIdx];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const jitter = (Math.sin((x + y + depth) * 0.028 + nowMs * 0.002) * 0.03) * (0.45 + onset);
      const spread = baseAngle + jitter;
      const nextLen = branchLen * branchDecay;

      branch(x2, y2, nextLen, angle - spread + sway * 0.35 * swaySign, depth - 1);
      branch(x2, y2, nextLen, angle + spread - sway * 0.35 * swaySign, depth - 1);

      if (quality > 0.72 && depth > 5 && branchCenterMix > 0.16 && (vol + mid) > 0.45) {
        // Deterministic sparse gate to avoid branch explosions at mid tree counts.
        const centerGate = (Math.sin(x2 * 0.013 + y2 * 0.017 + depth * 0.91) + 1) * 0.5;
        if (centerGate < branchCenterMix * 0.45) {
          branch(x2, y2, nextLen * 0.83, angle + jitter * 0.45, depth - 2);
        }
      }
    }

    branch(rootX, rootY, len, -Math.PI * 0.5, treeDepth);
  }

  // Single close tree visual anchor.
  const mainScale = 1.0;
  const mainDepth = Math.max(4, Math.floor(maxDepthBase * complexityScale));
  ctx.shadowBlur = 0;
  drawTree(cx, cy, trunkLen * mainScale, 1.0, mainDepth, 0.45 * complexityScale, 1, 0);

  if (!isViewOnly) {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "12px monospace";
    ctx.fillText(`Fractals  trees:${treeCount}  depth:${mainDepth}  budget:${branchBudget}  q:${quality.toFixed(2)}  trunk:${(trunkLen * mainScale).toFixed(1)}  angle:${baseAngle.toFixed(2)}  decay:${branchDecay.toFixed(2)}  vol:${vol.toFixed(2)}  bass:${bass.toFixed(2)}  low20-60:${low2060.toFixed(2)}  high4k-20k:${highAir.toFixed(2)}  imgs:${fractalTextures.readyCount}/3`, 12, h - 12);
  }

}

function drawCatV2() {
  const w = canvas.width;
  const h = canvas.height;
  const nowMs = performance.now();
  let dt = (nowMs - catV2Runtime.lastMs) * 0.001;
  catV2Runtime.lastMs = nowMs;
  if (!Number.isFinite(dt) || dt < 0) dt = 0.016;
  if (dt > 0.05) dt = 0.05;

  const vol = clamp01(features.volumeRms);
  const rmsDb = Number.isFinite(features.rmsDb) ? features.rmsDb : -60;
  const onset = clamp01(features.onset);
  const low60250 = clamp01(features.lowBand60250 || (features.lowSub * 0.7 + features.bassEnergy * 0.3));
  // These pre-Energy envelopes shape movement intensity, never tempo or phase.
  const onsetDet = clamp01(features.detectorOnset || onset);
  const low60250Det = clamp01(features.detectorLowBand60250 || low60250);
  const peakDet = clamp01(features.detectorPeak || features.peak || 0);
  const kickBand = clamp01(features.detectorKickBand || low60250Det);

  // Layer 1: pure black base.
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, w, h);

  // Layer 2: slow wallpaper morph.
  if (catV2Textures.wallpapers.length > 0) {
    const n = catV2Textures.wallpapers.length;
    catV2Runtime.wallpaperHoldSec -= dt;
    if (catV2Runtime.wallpaperFade <= 0 && catV2Runtime.wallpaperHoldSec <= 0) {
      let next = Math.floor(Math.random() * n);
      if (n > 1 && next === catV2Runtime.wallpaperA) next = (next + 1) % n;
      catV2Runtime.wallpaperB = next;
      catV2Runtime.wallpaperFade = 1e-6;
      catV2Runtime.wallpaperFadeDur = 5 + Math.random() * 8;
    }
    if (catV2Runtime.wallpaperFade > 0) {
      catV2Runtime.wallpaperFade += dt / Math.max(0.1, catV2Runtime.wallpaperFadeDur);
      if (catV2Runtime.wallpaperFade >= 1) {
        catV2Runtime.wallpaperA = catV2Runtime.wallpaperB;
        catV2Runtime.wallpaperFade = 0;
        catV2Runtime.wallpaperHoldSec = 6 + Math.random() * 10;
      }
    }
    drawImageCover(catV2Textures.wallpapers[catV2Runtime.wallpaperA], 1);
    if (catV2Runtime.wallpaperFade > 0) {
      drawImageCover(catV2Textures.wallpapers[catV2Runtime.wallpaperB], clamp01(catV2Runtime.wallpaperFade));
    }
  }

  // Layer 2.5: star-travel field (backward motion: stars flow from edges toward center).
  // Drawn above wallpapers but behind all cat layers.
  drawCatStarfield(dt);
  // Layer 2.7: drifting planets/moon (above stars, behind cat + aliens).
  drawCatDriftBodies(dt);

  // Layer 3: glow reacts to low 60-250 Hz (kick zone).
  const loudnessGate = clamp01((rmsDb + 20) / 6); // -20dB => 0, -14dB => 1
  const glowKick = clamp01(Math.pow(low60250 * 2.6, 0.78));
  const glowTarget = clamp01(loudnessGate * (0.32 + glowKick * 0.95));
  const glowAttack = 1 - Math.exp(-16 * dt);
  const glowRelease = 1 - Math.exp(-4.2 * dt);
  catV2Runtime.glowEma += (glowTarget - catV2Runtime.glowEma) * (glowTarget > catV2Runtime.glowEma ? glowAttack : glowRelease);

  // Local attack envelopes retain the cat's bass response. Timing comes from BPM Lab.
  const thFastK = 1 - Math.exp(-32 * dt);
  const thSlowK = 1 - Math.exp(-4.0 * dt);
  catV2Runtime.thumpFast += (kickBand - catV2Runtime.thumpFast) * thFastK;
  catV2Runtime.thumpSlow += (kickBand - catV2Runtime.thumpSlow) * thSlowK;
  const thumpTransient = Math.max(0, catV2Runtime.thumpFast - catV2Runtime.thumpSlow);
  const thumpLevel = clamp01((kickBand - 0.10) / 0.52);
  const onsetNorm = clamp01((onsetDet - 0.08) / 0.5);

  // Normalize transient intensity against the slow envelope for bob amplitude.
  const beatBand = clamp01(kickBand * 0.72 + low60250Det * 0.52 + onsetDet * 0.24);
  const beatRect = beatBand * beatBand;
  const fastAttackK = 1 - Math.exp(-dt / 0.03);  // ~30ms
  const fastReleaseK = 1 - Math.exp(-dt / 0.10); // ~100ms
  if (beatRect > catV2Runtime.beatNormFast) {
    catV2Runtime.beatNormFast += (beatRect - catV2Runtime.beatNormFast) * fastAttackK;
  } else {
    catV2Runtime.beatNormFast += (beatRect - catV2Runtime.beatNormFast) * fastReleaseK;
  }
  const slowNormK = 1 - Math.exp(-dt / 2.2); // ~2.2s normalization window
  catV2Runtime.beatNormSlow += (beatRect - catV2Runtime.beatNormSlow) * slowNormK;
  const beatContrast = catV2Runtime.beatNormFast / (catV2Runtime.beatNormSlow + 1e-5);
  const beatNorm = clamp01((beatContrast - 0.9) / 1.8);
  const thumpScore = clamp01(thumpTransient * 6.8 + thumpLevel * 0.55 + onsetNorm * 0.35 + beatNorm * 0.95);
  // One shared clock: no local estimates, smoothing clocks or transient phase resets.
  // Preserve the bob's 30 ms lead; a shared beat is the peak of the movement.
  const groove = beatSession.read();
  const motion = beatMotion(groove, 0.03);

  // No bass -> no bob. With bass and an acquired groove, follow BPM Lab.
  // Bob envelope source stays detector-based (independent of Energy gain amplification).
  const bassPresence = clamp01((low60250Det - 0.09) / 0.20);
  const bassPresenceK = 1 - Math.exp(-9.5 * dt);
  catV2Runtime.bassPresenceEma += (bassPresence - catV2Runtime.bassPresenceEma) * bassPresenceK;
  // Silence handling: after ~5s of consistently low detector activity, fade bob range to stop.
  const quietByBands = low60250Det < 0.11 && kickBand < 0.105 && onsetDet < 0.115 && peakDet < 0.16;
  if (quietByBands) catV2Runtime.quietSec += dt;
  else catV2Runtime.quietSec = Math.max(0, catV2Runtime.quietSec - dt * 2.4);
  const silenceStartSec = 5.0;
  const silenceFadeSpanSec = 2.2;
  const silenceFade = catV2Runtime.quietSec <= silenceStartSec
    ? 1
    : clamp01(1 - ((catV2Runtime.quietSec - silenceStartSec) / silenceFadeSpanSec));
  const detectorRms = clamp01(features.detectorRms || 0);
  const truePeak = clamp01(peakDet);
  const crestRel = clamp01((truePeak - detectorRms * 0.88 - 0.045) / 0.24);
  const transientRel = clamp01((onsetDet - 0.085) / 0.22);
  const kickRel = clamp01((kickBand - 0.11) / 0.25);
  // Transients affect bob strength without changing the shared clock.
  const thumpTransientRel = clamp01((thumpTransient - 0.014) / 0.07);
  const thumpStrengthRel = clamp01((thumpScore - 0.26) / 0.52);
  const rhythmicPresence = Math.max(kickRel, transientRel, crestRel, thumpTransientRel, thumpStrengthRel);
  const beatAccent = motion.bpm ? clamp01(1 - groove.phase / 1.7) : 0;
  const transientGate = kickRel > 0.10 || transientRel > 0.10 || thumpTransientRel > 0.10 || thumpStrengthRel > 0.12;
  if (transientGate || (bassPresence > 0.20 && beatAccent > 0.18)) catV2Runtime.bassHoldSec = 0.24;
  else catV2Runtime.bassHoldSec = Math.max(0, catV2Runtime.bassHoldSec - dt);
  const rhythmicGate = (catV2Runtime.bassHoldSec > 0 || (transientGate && beatAccent > 0.02));
  // Bob requires low/mid transient activity; low-end still drives most amplitude.
  const bobEnergy = clamp01(catV2Runtime.bassPresenceEma * 0.90 + rhythmicPresence * 0.22);
  const beatWeight = clamp01(0.35 + beatAccent * 0.9);
  const bobTarget = motion.bpm && rhythmicGate ? (bobEnergy * beatWeight) : 0;
  // Tempo-synced envelope with range scaling:
  // higher energy -> faster travel so large bob stays on beat.
  const beatSec = motion.period; // zero until acquired; no invented startup tempo
  const rangeSpeed = 1 + catV2Runtime.bobEma * 1.4;
  const attackSec = Math.max(0.08, Math.min(1.6, (beatSec * 1.6) / rangeSpeed));    // base ~1.6 beats
  const releaseSec = Math.max(0.24, Math.min(4.8, (beatSec * 4.6) / (1 + catV2Runtime.bobEma * 1.8))); // base ~4.6 beats
  const bobAttack = 1 - Math.exp(-dt / Math.max(1e-4, attackSec));
  const bobRelease = 1 - Math.exp(-dt / Math.max(1e-4, releaseSec));
  catV2Runtime.bobEma += (bobTarget - catV2Runtime.bobEma) * (bobTarget > catV2Runtime.bobEma ? bobAttack : bobRelease);
  if (catV2Runtime.quietSec > silenceStartSec) {
    const hardQuietDecay = 1 - Math.exp(-2.8 * dt);
    catV2Runtime.bobEma += (0 - catV2Runtime.bobEma) * hardQuietDecay;
  }
  // No startup baseline: bob range rises only from audio-driven envelope.
  const bobRange = clamp01(catV2Runtime.bobEma * silenceFade);
  // Keep beat phase stable: fixed bob shape, range only scales amplitude.
  const bobShape = motion.pulse;
  const bobDrive = catV2Runtime.quietSec > (silenceStartSec + silenceFadeSpanSec)
    ? 0
    : clamp01(bobShape * bobRange * silenceFade);
  // Energy slider directly controls bob movement intensity.
  const energyNorm = clamp01(getInputGain() / 2); // 0..1 from 0..200%
  const bobMotionScale = 0.35 + energyNorm * 0.65;
  const headBounce = useSmoothCatBounce
    ? catBounce.update(groove, bobRange * silenceFade * bobMotionScale, audioCtx?.currentTime ?? nowMs * 0.001)
    : bobDrive * bobMotionScale;
  const combatFront = catV2Runtime.alienCombatActive
    || catV2Runtime.niceShots.length > 0
    || catV2Runtime.evilShots.length > 0
    || catV2Runtime.evilMissiles.length > 0
    || catV2Runtime.missileBursts.length > 0;
  const catScaleTarget = (catV2Runtime.catPreScaleTarget != null)
    ? catV2Runtime.catPreScaleTarget
    : (combatFront ? 0.2 : 1);
  const catScaleK = 1 - Math.exp(-((catV2Runtime.catPreScaleTarget != null) ? 3.8 : (combatFront ? 3.6 : 2.1)) * dt);
  catV2Runtime.catScaleEma += (catScaleTarget - catV2Runtime.catScaleEma) * catScaleK;
  const headScale = (1 + headBounce * (useSmoothCatBounce ? 0.24 : 0.35)) * catV2Runtime.catScaleEma;
  const headDipPx = Math.min(w, h) * 0.0575 * headBounce;
  // Drift + tilt (all non-wallpaper layers): calm wandering, dance bursts, and rare cute silent tilts.
  const minDim = Math.min(w, h);
  if (vol > 0.62 && onset > 0.13 && Math.random() < dt * 1.8) {
    catV2Runtime.danceBurstSec = Math.min(1.35, catV2Runtime.danceBurstSec + 0.45 + Math.random() * 0.35);
  }
  catV2Runtime.danceBurstSec = Math.max(0, catV2Runtime.danceBurstSec - dt);
  const danceBurst = catV2Runtime.danceBurstSec > 0;
  const baseDriftRadius = minDim * (0.01 + vol * 0.018);
  const danceDriftRadius = danceBurst ? (minDim * (0.02 + vol * 0.045)) : 0;
  const driftRadius = baseDriftRadius + danceDriftRadius;
  catV2Runtime.driftTimer -= dt;
  if (catV2Runtime.driftTimer <= 0) {
    const ang = Math.random() * Math.PI * 2;
    const rr = (0.25 + Math.random() * 0.75) * driftRadius;
    catV2Runtime.driftTargetX = Math.cos(ang) * rr;
    catV2Runtime.driftTargetY = Math.sin(ang) * rr * 0.8;
    catV2Runtime.driftTimer = danceBurst ? (0.06 + Math.random() * 0.16) : (0.45 + Math.random() * 1.2);
  }
  const driftK = 1 - Math.exp(-(danceBurst ? 10.5 : 3.2) * dt);
  catV2Runtime.driftX += (catV2Runtime.driftTargetX - catV2Runtime.driftX) * driftK;
  catV2Runtime.driftY += (catV2Runtime.driftTargetY - catV2Runtime.driftY) * driftK;

  if (catV2Runtime.quietSec > 5.2 && catV2Runtime.cuteTiltSec <= 0 && Math.random() < dt * 0.16) {
    catV2Runtime.cuteTiltTotalSec = 0.7 + Math.random() * 1.2;
    catV2Runtime.cuteTiltSec = catV2Runtime.cuteTiltTotalSec;
    catV2Runtime.cuteTiltAmpDeg = 3.5 + Math.random() * 5.5;
    catV2Runtime.cuteTiltDir = Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < 0.20) catV2Runtime.queuedDoubleBlink = true;
  }
  let cuteTiltDeg = 0;
  if (catV2Runtime.cuteTiltSec > 0) {
    catV2Runtime.cuteTiltSec = Math.max(0, catV2Runtime.cuteTiltSec - dt);
    const total = Math.max(0.2, catV2Runtime.cuteTiltTotalSec || 0.9);
    const t = 1 - (catV2Runtime.cuteTiltSec / total);
    cuteTiltDeg = Math.sin(Math.PI * clamp01(t)) * catV2Runtime.cuteTiltAmpDeg * catV2Runtime.cuteTiltDir;
  }
  const driftTiltDeg = clamp01(Math.abs(catV2Runtime.driftX) / Math.max(1, driftRadius)) * 4.2 * Math.sign(catV2Runtime.driftX);
  catV2Runtime.tiltTargetDeg = driftTiltDeg + cuteTiltDeg;
  const tiltK = 1 - Math.exp(-(danceBurst ? 9.0 : 4.2) * dt);
  catV2Runtime.tiltDeg += (catV2Runtime.tiltTargetDeg - catV2Runtime.tiltDeg) * tiltK;
  const tiltRad = (catV2Runtime.tiltDeg * Math.PI) / 180;
  // Let the beat define vertical motion; retain a gentler wandering background.
  const headDriftY = catV2Runtime.driftY * (useSmoothCatBounce ? 1 - catBounce.presence * 0.7 : 1);

  ctx.save();
  ctx.translate(w * 0.5 + catV2Runtime.driftX, h * 0.5 + headDipPx + headDriftY);
  ctx.rotate(tiltRad);
  ctx.scale(headScale, headScale);
  ctx.translate(-w * 0.5, -h * 0.5);
  drawImageCover(catV2Textures.glow, catV2Runtime.glowEma);

  // Layer 4: Eyes (L1-L4). During combat, alternate focus between nice/evil alien.
  catV2Runtime.irisTargetTimer -= dt;
  const combatEyeTrack = catV2Runtime.alienCombatActive
    || catV2Runtime.niceShots.length > 0
    || catV2Runtime.evilShots.length > 0
    || catV2Runtime.evilMissiles.length > 0
    || catV2Runtime.missileBursts.length > 0;
  if (combatEyeTrack) {
    catV2Runtime.eyeFocusSwitchSec -= dt;
    if (catV2Runtime.eyeFocusSwitchSec <= 0) {
      catV2Runtime.eyeFocusTarget = catV2Runtime.eyeFocusTarget === "nice" ? "evil" : "nice";
      catV2Runtime.eyeFocusSwitchSec = 1.6 + Math.random() * 2.6;
    }
    const focusObj = (catV2Runtime.eyeFocusTarget === "evil") ? catV2Runtime.evil : catV2Runtime.nice;
    const headCx = w * 0.5 + catV2Runtime.driftX;
    const headCy = h * 0.5 + headDipPx + headDriftY;
    const tx = (focusObj.x - headCx) / Math.max(1, w * 0.5);
    const ty = (focusObj.y - headCy) / Math.max(1, h * 0.5);
    catV2Runtime.irisTargetX = Math.max(-28, Math.min(28, tx * 30));
    catV2Runtime.irisTargetY = Math.max(-24, Math.min(24, ty * 26));
    catV2Runtime.irisTargetTimer = 0.035;
  } else if (catV2Runtime.irisTargetTimer <= 0) {
    const r = (Math.random() ** 1.4) * Math.min(w, h) * 0.015;
    const a = Math.random() * Math.PI * 2;
    catV2Runtime.irisTargetX = Math.cos(a) * r;
    catV2Runtime.irisTargetY = Math.sin(a) * r;
    catV2Runtime.irisTargetTimer = 0.5 + Math.random() * 2.2;
    catV2Runtime.eyeFocusSwitchSec = 1.8 + Math.random() * 3.2;
  }
  const eyeSmoothing = 1 - Math.exp(-(combatEyeTrack ? 12.5 : 4.8) * dt);
  catV2Runtime.irisX += (catV2Runtime.irisTargetX - catV2Runtime.irisX) * eyeSmoothing;
  catV2Runtime.irisY += (catV2Runtime.irisTargetY - catV2Runtime.irisY) * eyeSmoothing;

  // Pupil dynamics: mostly slow human motion; occasional fast cascades to extremes after sustained high bass.
  const highBassNow = low60250Det > 0.20 || kickBand > 0.18;
  if (highBassNow) catV2Runtime.pupilHighBassSec = Math.min(30, catV2Runtime.pupilHighBassSec + dt);
  else catV2Runtime.pupilHighBassSec = Math.max(0, catV2Runtime.pupilHighBassSec - dt * 0.55);

  catV2Runtime.nextPupilEventSec -= dt;
  catV2Runtime.pupilModeSec = Math.max(0, catV2Runtime.pupilModeSec - dt);
  catV2Runtime.pupilRoamSec = Math.max(0, catV2Runtime.pupilRoamSec - dt);
  catV2Runtime.pupilCascadeStepSec = Math.max(0, catV2Runtime.pupilCascadeStepSec - dt);

  if (catV2Runtime.pupilMode === "idle" && catV2Runtime.nextPupilEventSec <= 0) {
    const extremeAllowed = catV2Runtime.pupilHighBassSec > 6.5; // extremes only after sustained high relative volume.
    const triggerExtreme = extremeAllowed && Math.random() < 0.24;
    catV2Runtime.pupilExtreme = triggerExtreme;
    if (triggerExtreme) {
      const goSmall = Math.random() < 0.74; // energetic tracks more often narrow pupils.
      const edge = goSmall ? randInt(-6, -4) : randInt(3, 4);
      const depth = Math.abs(edge);
      catV2Runtime.pupilCascadeEdge = edge;
      catV2Runtime.pupilMode = "cascade";
      catV2Runtime.pupilTarget = 0; // always cascade outward from default.
      catV2Runtime.pupilCascadeStepSec = 0.07 + Math.random() * 0.12; // sometimes fast entering extremes.
      // Cascading rule: deeper excursions hold longer at endpoint.
      catV2Runtime.pupilModeSec = 18 + depth * 7 + Math.random() * 18;
      catV2Runtime.pupilRoamMin = edge;
      catV2Runtime.pupilRoamMax = edge;
      catV2Runtime.pupilRoamSec = catV2Runtime.pupilModeSec * 0.62;
      catV2Runtime.pupilReturnToDefault = Math.random() < 0.68;
      catV2Runtime.nextPupilEventSec = 70 + Math.random() * 70;
    } else {
      // Slow, subtle dynamics near default with occasional cute bigger pupils in silence.
      let center = (catV2Runtime.quietSec > 4.5) ? randInt(1, 2) : randInt(-2, 2);
      if (center === 0) center = Math.random() < 0.5 ? -1 : 1;
      catV2Runtime.pupilMode = "hold";
      catV2Runtime.pupilRoamMin = Math.max(-6, center - 1);
      catV2Runtime.pupilRoamMax = Math.min(4, center + 1);
      catV2Runtime.pupilTarget = randInt(catV2Runtime.pupilRoamMin, catV2Runtime.pupilRoamMax);
      catV2Runtime.pupilRoamSec = 1.2 + Math.random() * 3.6;
      catV2Runtime.pupilModeSec = 12 + Math.random() * 22;
      catV2Runtime.pupilReturnToDefault = Math.random() < 0.58;
      catV2Runtime.nextPupilEventSec = 16 + Math.random() * 34;
    }
  } else if (catV2Runtime.pupilMode === "cascade") {
    if (catV2Runtime.pupilCascadeStepSec <= 0) {
      const cur = Math.round(catV2Runtime.pupilTarget);
      if (cur !== catV2Runtime.pupilCascadeEdge) {
        catV2Runtime.pupilTarget = cur + Math.sign(catV2Runtime.pupilCascadeEdge - cur);
        catV2Runtime.pupilCascadeStepSec = 0.08 + Math.random() * 0.13;
      } else {
        catV2Runtime.pupilMode = "hold";
      }
    }
  } else if (catV2Runtime.pupilMode === "hold") {
    if (catV2Runtime.pupilRoamSec <= 0) {
      if (catV2Runtime.pupilExtreme && catV2Runtime.pupilModeSec > 0) {
        const edge = catV2Runtime.pupilCascadeEdge;
        catV2Runtime.pupilRoamMin = Math.max(-6, edge - 1);
        catV2Runtime.pupilRoamMax = Math.min(4, edge + 1);
        catV2Runtime.pupilRoamSec = 2.5 + Math.random() * 7.5;
      } else {
        catV2Runtime.pupilRoamSec = 1.0 + Math.random() * 3.2;
      }
      catV2Runtime.pupilTarget = randInt(catV2Runtime.pupilRoamMin, catV2Runtime.pupilRoamMax);
    }
    if (catV2Runtime.pupilModeSec <= 0) {
      if (catV2Runtime.pupilReturnToDefault) {
        catV2Runtime.pupilMode = "return";
        catV2Runtime.pupilTarget = 0;
      } else {
        catV2Runtime.pupilMode = "idle";
        catV2Runtime.pupilExtreme = false;
      }
    }
  } else if (catV2Runtime.pupilMode === "return") {
    catV2Runtime.pupilTarget = 0;
    if (Math.abs(catV2Runtime.pupilCurrent) < 0.08) {
      catV2Runtime.pupilMode = "idle";
      catV2Runtime.pupilExtreme = false;
    }
  }

  const movingAway = Math.abs(catV2Runtime.pupilTarget) > Math.abs(catV2Runtime.pupilCurrent) + 0.04;
  let pupilK;
  if (catV2Runtime.pupilMode === "cascade") pupilK = 1 - Math.exp(-16 * dt);
  else if (movingAway) pupilK = 1 - Math.exp(-(catV2Runtime.pupilExtreme ? 8.5 : 2.8) * dt);
  else pupilK = 1 - Math.exp(-(catV2Runtime.pupilMode === "return" ? 0.36 : 1.15) * dt);
  if (combatEyeTrack) catV2Runtime.pupilTarget = Math.min(catV2Runtime.pupilTarget, -1.0);
  catV2Runtime.pupilCurrent += (catV2Runtime.pupilTarget - catV2Runtime.pupilCurrent) * pupilK;
  if (combatEyeTrack) {
    const combatSmallTarget = -2.2;
    const combatSmallK = 1 - Math.exp(-3.2 * dt);
    catV2Runtime.pupilCurrent += (combatSmallTarget - catV2Runtime.pupilCurrent) * combatSmallK;
  }
  catV2Runtime.pupilCurrent = Math.max(-6, Math.min(4, catV2Runtime.pupilCurrent));

  drawImageCover(catV2Textures.eyes.l1, 1);
  drawImageCover(catV2Textures.eyes.l2, 1);
  const pupilNorm = clamp01((catV2Runtime.pupilCurrent + 6) / 10);
  const irisAlpha = clamp01(0.55 + pupilNorm * 0.5); // dimmer at tiny pupils, brightest at large pupils.
  drawImageCoverOffset(catV2Textures.eyes.l3, irisAlpha, catV2Runtime.irisX, catV2Runtime.irisY);
  // Gradual pupil-frame fade with stable color base:
  // smaller frame stays fully opaque; larger frame fades on/off above it.
  const pupilPos = Math.max(-6, Math.min(4, catV2Runtime.pupilCurrent));
  const pupilA = Math.max(-6, Math.min(4, Math.floor(pupilPos)));
  const pupilB = Math.max(-6, Math.min(4, Math.ceil(pupilPos)));
  const t = clamp01(pupilPos - pupilA);
  const pupilImgA = catV2Textures.pupils[String(pupilA)] || catV2Textures.pupils["0"] || catV2Textures.eyes.l4;
  const pupilImgB = catV2Textures.pupils[String(pupilB)] || pupilImgA;
  drawImageCoverOffset(pupilImgA, 1, catV2Runtime.irisX * 1.12, catV2Runtime.irisY * 1.12);
  if (pupilB !== pupilA) {
    drawImageCoverOffset(pupilImgB, t, catV2Runtime.irisX * 1.12, catV2Runtime.irisY * 1.12);
  }

  // Layer 5: Face base.
  drawImageCover(catV2Textures.face, 1);

  // Layer 6: Fragments (fast attack, medium decay).
  const fragmentGroups = catV2Textures.fragmentGroups;
  const poolSize = getCatFragmentPoolSize();
  const response = getCatFragmentResponse();
  const responseScale = 0.25 + response * 1.10;
  const poolNorm = fragmentGroups.length > 0 ? (Math.min(poolSize, fragmentGroups.length) / fragmentGroups.length) : 0;
  // Keep fragment workload stable; response controls intensity, not instance count.
  const targetCount = Math.max(1, Math.min(14, Math.round(1 + vol * 8.5 + onset * 4 + poolNorm * 2.5)));
  if (catV2Runtime.activeFragments.length > targetCount) {
    let overflow = catV2Runtime.activeFragments.length - targetCount;
    for (const frag of catV2Runtime.activeFragments) {
      if (overflow > 0 && !frag.retiring) {
        frag.retiring = true;
        overflow--;
      }
    }
  }
  catV2Runtime.fragmentSpawnCooldown = Math.max(0, catV2Runtime.fragmentSpawnCooldown - dt);
  let spawnBudget = 1 + Math.floor(clamp01((onset - 0.08) / 0.55) * 2);
  const blocked = new Set(catV2Runtime.activeFragments.map(f => f.fragment?.groupKey).filter(Boolean));
  while (catV2Runtime.activeFragments.length < targetCount && catV2Runtime.fragmentSpawnCooldown <= 0 && spawnBudget > 0) {
    const variant = pickCatFragmentVariant(poolSize, blocked);
    if (!variant) break;
    catV2Runtime.activeFragments.push({
      fragment: variant,
      alpha: 0,
      gain: 0.68 + Math.random() * 0.72,
      ageSec: 0,
      lifeSec: 0.22 + vol * 1.0,
      retiring: false
    });
    blocked.add(variant.groupKey);
    const rumbleFast = (1 - vol) * 0.12;
    const bangFast = clamp01((onset - 0.05) / 0.8) * 0.045;
    catV2Runtime.fragmentSpawnCooldown = Math.max(0.02, 0.075 + rumbleFast - bangFast);
    spawnBudget--;
  }
  const fragAttack = 1 - Math.exp(-42 * dt);
  const fragRelease = 1 - Math.exp(-7.4 * dt);
  for (const frag of catV2Runtime.activeFragments) {
    const img = frag.fragment?.img;
    if (!img) continue;
    frag.ageSec += dt;
    if (!frag.retiring && frag.ageSec >= frag.lifeSec) frag.retiring = true;
    const dyn = clamp01((vol * 0.7 + onset * 0.9) * responseScale);
    const target = frag.retiring ? 0 : clamp01(dyn * frag.gain);
    frag.alpha += (target - frag.alpha) * (target > frag.alpha ? fragAttack : fragRelease);
    drawImageCover(img, frag.alpha);
  }
  catV2Runtime.activeFragments = catV2Runtime.activeFragments.filter(f => !(f.retiring && f.alpha < 0.015));

  // Layer 7: Eyelids (baseline + blink sequence).
  let baseLid = 0;
  if (catV2Runtime.irisY > 5) baseLid = 1;
  if (catV2Runtime.irisY > 11) baseLid = 2;

  catV2Runtime.nextBlinkSec -= dt;
  if (!catV2Runtime.blinkActive && catV2Runtime.nextBlinkSec <= 0) {
    catV2Runtime.blinkActive = true;
    catV2Runtime.blinkStep = 0;
    catV2Runtime.blinkStepTimer = 0.065;
    catV2Runtime.blinkSeq = [baseLid, Math.max(baseLid, 1), Math.max(baseLid, 2), 3, Math.max(baseLid, 2), Math.max(baseLid, 1), baseLid];
    catV2Runtime.nextBlinkSec = 2.8 + Math.random() * 7.5;
  }
  let lidFrame = baseLid;
  if (catV2Runtime.blinkActive) {
    lidFrame = catV2Runtime.blinkSeq[Math.min(catV2Runtime.blinkStep, catV2Runtime.blinkSeq.length - 1)] || 0;
    catV2Runtime.blinkStepTimer -= dt;
    if (catV2Runtime.blinkStepTimer <= 0) {
      catV2Runtime.blinkStep++;
      catV2Runtime.blinkStepTimer = 0.065;
      if (catV2Runtime.blinkStep >= catV2Runtime.blinkSeq.length) {
        catV2Runtime.blinkActive = false;
        if (catV2Runtime.queuedDoubleBlink) {
          catV2Runtime.queuedDoubleBlink = false;
          catV2Runtime.nextBlinkSec = 0.14;
        }
      }
    }
  }
  if (lidFrame > 0 && catV2Textures.eyelids[lidFrame - 1]) {
    drawImageCover(catV2Textures.eyelids[lidFrame - 1], 1);
  }

  // Layer 8: Whiskers (forward/back wave now and then).
  catV2Runtime.whiskNextSec -= dt;
  if (!catV2Runtime.whiskActive && catV2Runtime.whiskNextSec <= 0) {
    catV2Runtime.whiskActive = true;
    catV2Runtime.whiskDir = 1;
    catV2Runtime.whiskIndex = 1;
    catV2Runtime.whiskStepTimer = 0.09;
  }
  if (catV2Runtime.whiskActive) {
    catV2Runtime.whiskStepTimer -= dt;
    if (catV2Runtime.whiskStepTimer <= 0) {
      catV2Runtime.whiskIndex += catV2Runtime.whiskDir;
      if (catV2Runtime.whiskIndex >= 6) {
        catV2Runtime.whiskIndex = 6;
        catV2Runtime.whiskDir = -1;
      } else if (catV2Runtime.whiskIndex <= 1 && catV2Runtime.whiskDir < 0) {
        catV2Runtime.whiskIndex = 1;
        catV2Runtime.whiskActive = false;
        catV2Runtime.whiskNextSec = 3 + Math.random() * 10;
      }
      catV2Runtime.whiskStepTimer = 0.09;
    }
  }
  const whiskIdx = Math.max(1, Math.min(6, catV2Runtime.whiskIndex)) - 1;
  if (catV2Textures.whiskers[whiskIdx]) drawImageCover(catV2Textures.whiskers[whiskIdx], 1);
  ctx.restore();

  // Front combat layer during scenes: above cat stack.
  updateAndDrawCatAlienCombat(dt);

  if (!isViewOnly) {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "12px monospace";
    ctx.fillText(`BPM Lab: ${motion.bpm ? motion.bpm.toFixed(1) + " BPM" : "listening…"}`, 12, h - 12);
  }
}

function drawStereoOscilloscope() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const inputGain = getInputGain();
  const baseHz = getBaseSpeedHz();
  const squareSize = Math.min(w, h) * 0.98;
  const halfSquare = squareSize * 0.5;

  // Keep baseline look at 5.45Hz, but extend visual trail at lower speeds.
  const speedRefHz = 5.45;
  const speedNorm = clamp01(baseHz / speedRefHz);
  // Log-mapped persistence: avoids low-speed residue while preserving a visible trail.
  const speedLog = Math.log1p(9 * speedNorm) / Math.log1p(9);
  const trailFadeAlpha = 0.115 + 0.055 * speedLog; // slightly stronger decay overall
  const slowThicknessBoost = (1 - speedNorm) * 0.6; // subtle: up to +0.6px at the slowest speeds
  const slowExposureScale = 0.12 + 0.88 * speedLog; // lower floor: weak low-speed residue clears faster
  ctx.fillStyle = `rgba(5, 8, 16, ${trailFadeAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);

  if (!audioReady || !analyser || !timeData || !audioCtx) return;

  let sumSqRaw = 0;
  let sumSqSensitive = 0;
  for (let i = 0; i < timeData.length; i++) {
    const raw = timeData[i];
    const sensitive = raw * inputGain;
    sumSqRaw += raw * raw;
    sumSqSensitive += sensitive * sensitive;
  }
  const rmsRaw = Math.sqrt(sumSqRaw / timeData.length);
  const rmsSensitive = Math.sqrt(sumSqSensitive / timeData.length);

  const nyquist = (audioCtx.sampleRate || 48000) * 0.5;
  const hzPerBin = nyquist / freqData.length;
  let bassSum = 0;
  let bassCount = 0;
  let lowColorSum = 0;
  let lowColorCount = 0;
  let midColorSum = 0;
  let midColorCount = 0;
  let highColorSum = 0;
  let highColorCount = 0;
  for (let i = 0; i < freqData.length; i++) {
    const hz = i * hzPerBin;
    const bandMagRaw = (freqData[i] / 255);
    const bandMag = bandMagRaw * inputGain;
    if (hz >= 20 && hz <= 200) {
      // Keep bass damping independent from sensitivity so sensitivity can drive detune clearly.
      bassSum += bandMagRaw;
      bassCount++;
    }
    if (hz >= 20 && hz <= 150) {
      lowColorSum += bandMag;
      lowColorCount++;
    } else if (hz >= 350 && hz <= 1000) {
      midColorSum += bandMag;
      midColorCount++;
    } else if (hz >= 3500 && hz <= 20000) {
      highColorSum += bandMag;
      highColorCount++;
    }
  }
  const bassBandNorm = bassCount > 0 ? clamp01((bassSum / bassCount) * 2.2) : 0;
  const lowColorRaw = lowColorCount > 0 ? (lowColorSum / lowColorCount) : 0;
  const midColorRaw = midColorCount > 0 ? (midColorSum / midColorCount) : 0;
  const highColorRaw = highColorCount > 0 ? (highColorSum / highColorCount) : 0;
  bassBandEma += (bassBandNorm - bassBandEma) * 0.12;

  const nowSec = performance.now() * 0.001;
  const strobeLfoRateHz = getStrobeLfoRateHz();
  const strobeLfo = strobeLfoRateHz > 0 ? Math.sin(2 * Math.PI * strobeLfoRateHz * nowSec) : 0;
  const warpWaveInfluence = getWarpWaveInfluence();

  // Bass retunes the RMS microtune driver downward to reduce chaotic jumps on heavy low-end.
  // At higher warp, strobe LFO modulates this retune in opposite direction.
  const bassRetuneFactorBase = Math.max(0.25, Math.min(1, 1 - bassBandEma * getBassRetuneDepth()));
  const warpRetuneDepth = Math.pow(warpWaveInfluence, 1.8) * 0.45; // exponential: mostly active at higher warp
  const bassRetuneFactor = Math.max(0.2, Math.min(1, bassRetuneFactorBase - strobeLfo * warpRetuneDepth));
  updateAdaptiveRange(microtuneAdaptive, rmsRaw);
  const rmsMicroNorm = normalizeAdaptive(microtuneAdaptive, rmsRaw);
  const microtuneTarget = rmsMicroNorm * bassRetuneFactor;
  microtuneNormEma += (microtuneTarget - microtuneNormEma) * 0.08;

  // Adaptive ranges: used by both phase response thresholding and color/wave pull logic.
  updateAdaptiveRange(colorAdaptive.rms, rmsRaw);
  updateAdaptiveRange(colorAdaptive.low, lowColorRaw);
  updateAdaptiveRange(colorAdaptive.mid, midColorRaw);
  updateAdaptiveRange(colorAdaptive.high, highColorRaw);
  const rmsBright = normalizeAdaptive(colorAdaptive.rms, rmsRaw);
  const lowNorm = normalizeAdaptive(colorAdaptive.low, lowColorRaw);
  const midNorm = normalizeAdaptive(colorAdaptive.mid, midColorRaw);
  const highNorm = normalizeAdaptive(colorAdaptive.high, highColorRaw);

  const xHz = baseHz * xFreqMultiplier;
  const yHz = baseHz;
  let frameDt = nowSec - oscLastTimeSec;
  if (!Number.isFinite(frameDt) || frameDt < 0) frameDt = 0;
  if (frameDt > 0.1) frameDt = 0.1;
  oscLastTimeSec = nowSec;
  const dynamicLowThreshold = 0.02 + 0.08 * rmsBright + 0.06 * (1 - lowNorm);
  const dynamicLowSpan = 0.12 + 0.20 * rmsBright;
  const lowBandNorm = clamp01((lowColorRaw - dynamicLowThreshold) / dynamicLowSpan);
  // Snappy low-end detector for phase braking on kick/bass hits.
  lowPhaseLagEma += (lowBandNorm - lowPhaseLagEma) * 0.018;
  const lowTransient = clamp01((lowBandNorm - lowPhaseLagEma) * 10.5);
  const lowImpact = clamp01(Math.max(lowBandNorm * 0.95, lowTransient));
  const lowDominance = lowNorm / (lowNorm + midNorm + highNorm + 1e-6);
  const lowBrakeDrive = clamp01(lowImpact * (0.25 + lowDominance * 1.35));
  const phaseBrakeStrength = 1.85;
  const phaseBrake = Math.max(0, 1 - getPhaseResponse() * lowBrakeDrive * phaseBrakeStrength);
  const phaseRateCyclesPerSec = getPhaseRateMaxCyclesPerSec() * phaseBrake;
  phaseOffsetCycles = (phaseOffsetCycles + phaseRateCyclesPerSec * frameDt) % 1000;
  const strobeBase = getStrobeInfluence();
  updateStrobeLfoIndicator(strobeLfo, strobeLfoRateHz);
  const effectiveStrobe = Math.max(0, strobeBase + 0.5 * strobeLfo); // ±50% around base
  const xDeltaHz = Math.max(0, microtuneNormEma) * effectiveStrobe * bassRetuneFactor * 3.0; // strobe detune explicitly bass-retuned
  const xHzShifted = xHz + xDeltaHz;
  const phaseShift = phaseOffsetCycles * Math.PI * 2;
  const maxAxisScale = halfSquare * 0.92 * 2.8;
  const minAxisScale = halfSquare * 0.02; // near-point at silence
  const oscSizeNorm = clamp01(rmsRaw * Math.SQRT2);
  oscSizeEma += (oscSizeNorm - oscSizeEma) * 0.1;
  const axisScaleBase = minAxisScale + (maxAxisScale - minAxisScale) * oscSizeEma;
  const axisScale = axisScaleBase * getZoomFactor();
  const bassTriangleGain = 0.6 + getBassEmphasis() * 1.2; // 0..100% => 0.6x..1.8x
  // Combine adaptive low-band shape and bass-band energy so Bass Emphasis audibly/visually changes triangle pull.
  const triangleSource = lowNorm * 0.75 + bassBandEma * 0.25;
  const trianglePull = clamp01(triangleSource * bassTriangleGain); // low-end (20-150Hz) triangle pull
  const highDrive = 0.2 + 0.8 * Math.pow(highNorm, 1.05);
  const sawPull = clamp01(highDrive * warpWaveInfluence * 2.4); // stronger, more audible warp response
  const squarePull = clamp01(rmsBright); // global RMS -> square-wave pull
  const foldRespBias = getFoldResponseBias();
  const foldRespStrength = Math.abs(foldRespBias);
  const foldTargetNorm = foldRespBias < 0 ? lowNorm : highNorm;
  // At full Fold response, typical commercial peaks in the target band can fully brake folding.
  const foldBrakeSignal = clamp01((foldTargetNorm - 0.42) / 0.33);
  const foldBrake = 1 - foldRespStrength * foldBrakeSignal;
  const foldAmount = getFoldInfluence() * rmsBright * foldBrake;

  // Global RMS controls brightness (louder => brighter), base color starts as white.
  const brightness = 0.28 + rmsBright * 0.72;
  const baseR = 255 * brightness;
  const baseG = 255 * brightness;
  const baseB = 255 * brightness;

  // 3 main pull regions.
  const lowPull = Math.pow(lowNorm, 1.05) * 0.95;   // 20-150Hz -> neon pink
  const midPull = Math.pow(midNorm, 1.08) * 0.90;   // 350Hz-1kHz -> blue/green
  const highPull = Math.pow(highNorm, 1.02) * 1.05; // 3.5kHz-20kHz -> radioactive yellow

  const lowR = 255, lowG = 30, lowB = 210;
  const midR = 35, midG = 245, midB = 175;
  const highR = 240, highG = 255, highB = 30;

  const wBase = 1.0;
  const wTotal = wBase + lowPull + midPull + highPull;
  let strokeR = (
    baseR * wBase +
    lowR * lowPull +
    midR * midPull +
    highR * highPull
  ) / wTotal;
  let strokeG = (
    baseG * wBase +
    lowG * lowPull +
    midG * midPull +
    highG * highPull
  ) / wTotal;
  let strokeB = (
    baseB * wBase +
    lowB * lowPull +
    midB * midPull +
    highB * highPull
  ) / wTotal;

  strokeR = Math.round(strokeR);
  strokeG = Math.round(strokeG);
  strokeB = Math.round(strokeB);

  const samples = quadratureTraceX.length;
  const dtPlot = 1 / samples; // fixed trace window; trail is handled visually via persistence
  const tau = Math.PI * 2;

  // Keep oscillator phases bounded to avoid long-run precision drift from large timestamps.
  oscPhaseX = (oscPhaseX + tau * xHzShifted * frameDt) % tau;
  oscPhaseY = (oscPhaseY + tau * yHz * frameDt) % tau;

  function sineTriSawSquare(phase, triAmount, sawAmount, squareAmount) {
    const s = Math.sin(phase);
    const tri = (2 / Math.PI) * Math.asin(s);
    const cycles = phase / tau;
    const saw = 2 * (cycles - Math.floor(cycles + 0.5));
    const square = s >= 0 ? 1 : -1;
    const total = 1 + triAmount + sawAmount + squareAmount;
    return (s + tri * triAmount + saw * sawAmount + square * squareAmount) / total;
  }

  function applyWaveFold(v, amount) {
    if (amount <= 0) return v;
    const drive = 1 + amount * 6;
    let y = v * drive;
    for (let i = 0; i < 6; i++) {
      if (y > 1) y = 2 - y;
      else if (y < -1) y = -2 - y;
      else break;
    }
    return y;
  }

  const xs = quadratureTraceX;
  const ys = quadratureTraceY;
  for (let i = 0; i < samples; i++) {
    const xPhase = oscPhaseX + tau * xHzShifted * i * dtPlot + phaseShift;
    const yPhase = oscPhaseY + tau * yHz * i * dtPlot;
    const xRaw = sineTriSawSquare(xPhase, trianglePull, sawPull, squarePull);
    const yRaw = sineTriSawSquare(yPhase, trianglePull, sawPull, squarePull);
    const xBase = applyWaveFold(xRaw, foldAmount);
    const yBase = applyWaveFold(yRaw, foldAmount);
    xs[i] = cx + xBase * axisScale;
    ys[i] = cy + yBase * axisScale;
  }

  // Draw from tail->head with alpha gradient so newer motion reads brighter.
  const segCount = 10;
  for (let s = 0; s < segCount; s++) {
    const start = Math.floor((s / segCount) * (samples - 1));
    const end = Math.floor(((s + 1) / segCount) * (samples - 1));
    const t = (s + 1) / segCount;
    // Stronger age weighting: older tail fades much faster than fresh head.
    const segAlphaBase = 0.04 + 0.96 * Math.pow(t, 2.1);
    const segAlpha = segAlphaBase * slowExposureScale;

    ctx.beginPath();
    for (let i = start; i <= end; i++) {
      if (i === start) ctx.moveTo(xs[i], ys[i]);
      else ctx.lineTo(xs[i], ys[i]);
    }

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${strokeR},${strokeG},${strokeB},${segAlpha.toFixed(3)})`;
    ctx.lineWidth = 1.8 + slowThicknessBoost;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  if (!isViewOnly) {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "12px monospace";
    ctx.fillText(`Quadrature  base:${baseHz.toFixed(2)}Hz  x:${xHzShifted.toFixed(2)}Hz  y:${yHz.toFixed(2)}Hz  xMult:${xFreqMultiplier}x  phaseOfs:${phaseOffsetCycles.toFixed(2)}cy  phaseRate:${phaseRateCyclesPerSec.toFixed(2)}c/s  rms(raw):${rmsRaw.toFixed(3)}  rms(sens):${rmsSensitive.toFixed(3)}  low20-150:${lowBandNorm.toFixed(2)}  lowTr:${lowTransient.toFixed(2)}  lowDom:${lowDominance.toFixed(2)}  lowThr:${dynamicLowThreshold.toFixed(3)}  phaseResp:${phaseResponseSlider.value}%  bass20-200:${bassBandEma.toFixed(2)}  bassEmph:${bassEmphasisSlider.value}%  bassRet:${bassRetuneFactor.toFixed(2)}  bassTriGain:${bassTriangleGain.toFixed(2)}  strobe:${strobeSlider.value}%  strobeLFO:${strobeLfoRateHz.toFixed(2)}Hz  strobeEff:${(effectiveStrobe * 100).toFixed(0)}%  warp:${warpSlider.value}%  fold:${foldSlider.value}%  foldResp:${foldResponseSlider.value}%  foldBrake:${foldBrake.toFixed(2)}  foldAmt:${foldAmount.toFixed(2)}  triPull:${trianglePull.toFixed(2)}  sawPull:${sawPull.toFixed(2)}  sqPull:${squarePull.toFixed(2)}  size:${oscSizeEma.toFixed(2)}  zoom:${zoomSlider.value}%  xDelta:${xDeltaHz.toFixed(3)}Hz`, 12, h - 12);
  }
}

function updateBpmPanel(state = beatSession.state) {
  if (currentMode !== "bpm-lab") return;
  bpmReadout.textContent = state.bpm ? state.bpm.toFixed(1) : "—";
  const names = { waiting: "Choose an audio input", starting: "Starting analysis", listening: "Listening for a groove", locked: "Following the groove", holding: "Holding the groove", adapting: "Adapting gently", manual: "Tempo held", error: "Analysis unavailable" };
  bpmState.textContent = names[state.state] || "Listening";
  bpmState.dataset.state = state.state;
  bpmCandidate.textContent = state.candidateBpm ? `${state.candidateBpm.toFixed(1)} BPM` : "Listening…";
  bpmEvidence.value = state.confidence;
  bpmHold.textContent = state.manual ? "Resume auto" : "Hold tempo";
  bpmHold.setAttribute("aria-pressed", String(state.manual));
  bpmHold.disabled = !state.bpm;
  bpmHalf.disabled = !state.bpm || state.bpm < 70;
  bpmDouble.disabled = !state.bpm || state.bpm > 150;
  bpmTap.disabled = bpmRelearn.disabled = !beatSession.graph;
  bpmTap.textContent = state.tapCount > 0 && state.tapCount < 4 ? `Tap ${state.tapCount}/4` : "Tap tempo";
  bpmExplanation.textContent = state.error || (state.manual
    ? "Your tempo stays fixed. The background estimate keeps listening."
    : state.state === "holding" ? "The rhythm is uncertain. The clock keeps its last established tempo."
    : state.state === "adapting" ? "A new groove held up over time. The clock is moving into it."
    : state.bpm ? "Keeps the established groove while a new tempo is being checked."
    : "Give it 9–12 seconds of steady rhythm to start. Complex passages may take longer.");
}

function drawBPMLab() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#050810";
  ctx.fillRect(0, 0, w, h);
  const state = beatSession.read();
  bpmPhase.style.transform = `scaleX(${state.bpm ? state.phase : 0})`;
  const history = state.history;
  const panelX = 20, panelW = Math.max(1, w - 40);
  const panelY = Math.max(470, h - 180), panelH = 58;
  if (h < 720 || panelY + panelH > h - 60) return;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Recent rhythmic attacks", panelX, panelY - 14, panelW);
  ctx.strokeStyle = "rgba(126,228,177,0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < panelW; x++) {
    const index = Math.floor(x / panelW * history.length);
    const strength = Math.min(1, (history[index] || 0) / 5);
    const y = panelY + panelH - strength * panelH;
    if (x === 0) ctx.moveTo(panelX + x, y); else ctx.lineTo(panelX + x, y);
  }
  ctx.stroke();
  if (state.bpm) {
    const pulse = Math.exp(-state.phase * 12);
    ctx.fillStyle = `rgba(126,228,177,${0.2 + pulse * 0.8})`;
    ctx.beginPath();
    ctx.arc(w / 2, panelY + panelH + 24, 3 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

const renderers = {
  "stereo-osc": drawStereoOscilloscope,
  fractals: drawFractals,
  cat: drawCatV2,
  "bpm-lab": drawBPMLab
};
let animationFrameId = 0;
function animate() {
  computeFeatures();
  ctx.save();
  try { renderers[currentMode](); }
  finally { ctx.restore(); }
  animationFrameId = requestAnimationFrame(animate);
}

function updateInputButtons() {
  for (const [button, type, label] of [[micBtn, "mic", "Mic"], [speakerBtn, "speaker", "Web Audio"]]) {
    button.classList.toggle("active", currentInputType === type);
    button.textContent = audioSession.pendingType === type ? `${label}: cancel` : currentInputType === type ? `${label}: on (click to stop)` : `${label}: off`;
  }
}

function updateInputStatus() {
  if (currentInputType === "none") {
    statusEl.textContent = "input: none";
    inputHelpEl.textContent = "Mic uses microphone input. Web Audio uses shared browser-tab audio.";
  } else if (currentInputType === "mic") {
    statusEl.textContent = "input: mic";
    inputHelpEl.textContent = `Source: ${currentStream.getAudioTracks()[0]?.label || "microphone input"}.`;
  } else {
    statusEl.textContent = "input: web audio (shared tab audio)";
    inputHelpEl.textContent = "Source: shared browser-tab audio.";
  }
}

function updateInputUI() {
  updateInputButtons();

  zoomValue.textContent = `${zoomSlider.value}%`;
  energyValue.textContent = `${Math.round(getInputGain() * 100)}%`;
  speedValue.textContent = `${getBaseSpeedHz().toFixed(2)}Hz`;
  setPhaseVisual();
  phaseResponseValue.textContent = `${phaseResponseSlider.value}%`;
  bassEmphasisValue.textContent = `${bassEmphasisSlider.value}%`;
  shapeValue.textContent = `${shapeSlider.value}%`;
  const shapeLfoHz = getShapeLfoRateHz();
  shapeLfoValue.textContent = `${shapeLfoHz.toFixed(2)}Hz`;
  shapeLfoSlider.classList.toggle("inactive", shapeLfoHz <= 0.0001);
  updateShapeLfoIndicator(0, shapeLfoHz, getShapeAmount());
  fruitsValue.textContent = `${fruitsSlider.value}%`;
  rainValue.textContent = `${rainSlider.value}%`;
  dropSizeValue.textContent = `${getDropSizeScale().toFixed(1)}x`;
  const fruitsLfoHz = getFruitsLfoRateHz();
  fruitsLfoValue.textContent = `${fruitsLfoHz.toFixed(2)}Hz`;
  fruitsLfoSlider.classList.toggle("inactive", fruitsLfoHz <= 0.0001);
  updateFruitLfoIndicator(0, fruitsLfoHz, getFruitsPresence());
  strobeValue.textContent = `${strobeSlider.value}%`;
  strobeLfoValue.textContent = `${getStrobeLfoRateHz().toFixed(2)}Hz`;
  updateStrobeLfoIndicator(0, getStrobeLfoRateHz());
  warpValue.textContent = `${warpSlider.value}%`;
  foldValue.textContent = `${foldSlider.value}%`;
  const foldResp = modeControls.value("foldResponse", 50);
  if (foldResp === 50) foldResponseValue.textContent = "Neutral";
  else if (foldResp < 50) foldResponseValue.textContent = `Low ${Math.round(((50 - foldResp) / 50) * 100)}%`;
  else foldResponseValue.textContent = `High ${Math.round(((foldResp - 50) / 50) * 100)}%`;
  updateCatSetButtonsUI();
}

function resetAudioReactiveState() {
  for (const key of Object.keys(features)) features[key] = 0;
  features.rmsDb = -60;
  fluxEma = 0;
  fluxDetEma = 0;
  for (const range of Object.values(colorAdaptive)) { range.floor = 0.003; range.ceil = 0.09; }
  colorAdaptive.rms.floor = 0.01;
  colorAdaptive.rms.ceil = 0.18;
  colorAdaptive.low.ceil = 0.10;
  oscPhaseX = 0;
  oscPhaseY = 0;
  oscLastTimeSec = performance.now() * 0.001;
  catV2Runtime.starsInitialized = false;
  catV2Runtime.stars = [];
  catV2Runtime.driftBodies = [];
  catV2Runtime.driftSpawnSec = 4 + Math.random() * 8;
  catV2Runtime.alienCombatActive = false;
  catV2Runtime.alienCombatEntering = false;
  catV2Runtime.alienPreShrinkTimer = 0;
  catV2Runtime.preCombatStage = "idle";
  catV2Runtime.preCombatTimer = 0;
  catV2Runtime.catPreScaleTarget = null;
  catV2Runtime.combatSettleTimer = 0;
  catV2Runtime.alienCombatExiting = false;
  catV2Runtime.alienCombatTimer = 0;
  catV2Runtime.alienCombatElapsed = 0;
  catV2Runtime.alienEscapeStartSec = 30;
  catV2Runtime.alienEnterTimer = 0;
  catV2Runtime.alienEnterDuration = 0;
  catV2Runtime.alienEntryStartNX = 0;
  catV2Runtime.alienEntryStartNY = 0;
  catV2Runtime.alienEntryStartEX = 0;
  catV2Runtime.alienEntryStartEY = 0;
  catV2Runtime.alienEntryTargetNX = 0;
  catV2Runtime.alienEntryTargetNY = 0;
  catV2Runtime.alienEntryTargetEX = 0;
  catV2Runtime.alienEntryTargetEY = 0;
  catV2Runtime.alienCombatCooldown = 4 + Math.random() * 8;
  catV2Runtime.alienExitDirX = 1;
  catV2Runtime.alienExitDirY = 0;
  catV2Runtime.alienExitFollowDelay = 0;
  catV2Runtime.alienExitTimer = 0;
  catV2Runtime.niceShots = [];
  catV2Runtime.evilShots = [];
  catV2Runtime.evilMissiles = [];
  catV2Runtime.missileBursts = [];
  catV2Runtime.niceHistory = [];
  catV2Runtime.evilHistory = [];
  catV2Runtime.niceShotSide = 1;
  catV2Runtime.nice.hurt = 0;
  catV2Runtime.evil.hurt = 0;
  catV2Runtime.evil.missileCredit = 0;
  catV2Runtime.evil.shieldActive = false;
  catV2Runtime.evil.shieldTimer = 0;
  catV2Runtime.evil.shieldCooldown = 4 + Math.random() * 8;
  catV2Runtime.evil.shieldImpactTimer = 0;
  catV2Runtime.nice.aiming = false;
  catV2Runtime.nice.aimTimer = 0;
  catV2Runtime.nice.sideSign = 1;
  catV2Runtime.nice.tacticMode = "level";
  catV2Runtime.nice.tacticTimer = 0;
  catV2Runtime.irisX = 0;
  catV2Runtime.irisY = 0;
  catV2Runtime.irisTargetX = 0;
  catV2Runtime.irisTargetY = 0;
  catV2Runtime.irisTargetTimer = 0;
  catV2Runtime.eyeFocusTarget = "nice";
  catV2Runtime.eyeFocusSwitchSec = 2.5 + Math.random() * 3.5;
  catV2Runtime.catScaleEma = 1;
  catV2Runtime.beatNormFast = 0;
  catV2Runtime.beatNormSlow = 0;
  catV2Runtime.thumpFast = catV2Runtime.thumpSlow = 0;
  catV2Runtime.bobEma = catV2Runtime.bassPresenceEma = 0;
  catV2Runtime.bassHoldSec = catV2Runtime.quietSec = 0;
  resetQuadratureDynamics();
}

function applyAudioSession(session) {
  resetAudioReactiveState();
  void beatSession.attach(session);
  currentStream = session?.stream || null;
  currentInputType = session?.type || "none";
  audioReady = Boolean(session);
  audioCtx = session?.context || null;
  analyser = session?.analyser || null;
  timeData = session ? new Float32Array(analyser.fftSize) : null;
  freqData = session ? new Uint8Array(analyser.frequencyBinCount) : null;
  prevFreq = session ? new Float32Array(analyser.frequencyBinCount) : null;
  prevFreqDet = session ? new Float32Array(analyser.frequencyBinCount) : null;
  updateInputStatus();
  updateInputUI();
}

const audioSession = new AudioInputSession({ onChange: applyAudioSession, onPending: updateInputButtons });
function stopCurrentStream() { audioSession.stop(); }

async function startInput(type, requestStream) {
  try {
    statusEl.textContent = `input: waiting for ${type === "mic" ? "microphone" : "tab audio"} permission`;
    await audioSession.start(type, requestStream);
  } catch (error) {
    if (error.name === "NoAudioError") {
      statusEl.textContent = type === "speaker" ? "input: no shared audio" : "input: microphone ended";
      inputHelpEl.textContent = type === "speaker" ? "Choose a browser tab and enable Share tab audio." : "The microphone stopped before it connected. Click Mic to try again.";
    } else {
      statusEl.textContent = `input: ${type === "mic" ? "mic" : "web audio"} unavailable`;
      inputHelpEl.textContent = error.name === "NotAllowedError" ? "Permission was cancelled or denied. Click the input button to try again." : "The browser could not start this audio source. Try selecting it again.";
    }
    if (audioReady) statusEl.textContent += ` (still using ${currentInputType === "mic" ? "mic" : "web audio"})`;
    console.warn("Audio capture:", error.name, error.message);
  }
}

function enableMic() {
  return startInput("mic", () => navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  }));
}

function enableSpeaker() {
  if (isSafari(navigator.userAgent)) {
    window.alert("Safari does not support sharing a browser tab's audio. Please open this page in Google Chrome on a computer to use Web Audio.\n\nYou can still use the Mic button in Safari.");
    return;
  }
  return startInput("speaker", () => navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  }));
}

micBtn.addEventListener("click", () => {
  if (currentInputType === "mic" || audioSession.pendingType === "mic") stopCurrentStream();
  else enableMic();
});
speakerBtn.addEventListener("click", () => {
  if (currentInputType === "speaker" || audioSession.pendingType === "speaker") stopCurrentStream();
  else enableSpeaker();
});
modeSelect.addEventListener("change", () => setMode(modeSelect.value));

settingsToggleBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("collapsed");
  settingsToggleBtn.setAttribute("aria-expanded", settingsPanel.classList.contains("collapsed") ? "false" : "true");
});
helpToggleBtn.addEventListener("click", () => {
  const show = !helpBubble.classList.contains("show");
  helpBubble.classList.toggle("show", show);
  helpToggleBtn.setAttribute("aria-expanded", show ? "true" : "false");
});
viewBtn.addEventListener("click", () => {
  enterViewMode();
});
viewExitBtn.addEventListener("click", () => {
  exitViewMode();
});
document.addEventListener("mousemove", () => {
  showViewExitTemporarily();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && isViewOnly) {
    exitViewMode();
  }
});
settingsResetBtn.addEventListener("click", () => {
  resetCurrentModeSliders();
});
settingsRandomizeBtn.addEventListener("click", () => {
  randomizeAllSliders();
});
Object.values(sliderKeyToEl).forEach(slider => slider.addEventListener("input", () => {
  modeControls.save();
  updateInputUI();
}));
catSetButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const groupName = btn.dataset.discoGroup;
    const groupFolders = CAT_FRAGMENT_DISCO_GROUPS[groupName] || [];
    if (groupFolders.length === 0) return;
    const active = catV2Runtime.activeFragmentSetFolders;
    const groupIsActive = groupFolders.every(folder => active.has(folder));
    if (groupIsActive) {
      groupFolders.forEach(folder => active.delete(folder));
    } else {
      groupFolders.forEach(folder => active.add(folder));
    }
    updateCatSetButtonsUI();
  });
});
xMultButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setXMultiplier(Number(btn.dataset.mult) || 1);
  });
});

beatSession.subscribe(updateBpmPanel);
bpmHold.addEventListener("click", () => beatSession.command("hold", !beatSession.state.manual));
bpmHalf.addEventListener("click", () => beatSession.command("multiply", 0.5));
bpmDouble.addEventListener("click", () => beatSession.command("multiply", 2));
bpmTap.addEventListener("click", () => beatSession.command("tap"));
bpmRelearn.addEventListener("click", () => beatSession.command("relearn"));

setMode(currentMode);
updateInputUI();
updateInputStatus();
animate();
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
  audioSession.dispose().catch(error => console.warn("Audio cleanup:", error));
});
window.addEventListener("pageshow", () => { if (!animationFrameId) animate(); });
