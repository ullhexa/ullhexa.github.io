/* BPM detector scaffold: tap diode trigger only.
   Diode is driven strictly by waveform threshold crossing. */
(function initBPMModule(globalScope) {
  function clamp01(v) {
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  }

  const state = {
    clockA: 120.0,
    lastNowSec: performance.now() * 0.001,
    lastTapSec: -1e9,
    tapPulse: 0,
    tapCount: 0,
    peakNormPrev: 0,
    peakNormPrev2: 0,
    hasPeakPrev: false,
    kickThreshold: 0.82,
    gateArmed: true
  };

  const api = {
    status: "tap-crossing-only",
    ready: true,
    notes: "Tap diode uses only rising threshold crossing of waveform peak.",
    clockA: state.clockA,
    tapPulse: state.tapPulse,
    tapCount: state.tapCount,
    kickThreshold: state.kickThreshold,

    updateFromFeatures(features) {
      if (!features) return;
      const nowSec = performance.now() * 0.001;
      let dt = nowSec - state.lastNowSec;
      state.lastNowSec = nowSec;
      if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
      if (dt > 0.08) dt = 0.08;

      // Exact threshold signal from BPM Lab waveform sampling path.
      const peakNorm = clamp01(features.waveThresholdSignalRaw);
      const kickThreshold = clamp01(Number(api.kickThreshold ?? state.kickThreshold));
      state.kickThreshold = kickThreshold;

      // Human-like pulse picking on the same displayed waveform lane:
      // 1) must exceed threshold,
      // 2) must form a local maximum (rising then falling),
      // 3) must re-arm below lower hysteresis threshold,
      // 4) one pulse per lockout window.
      const hyst = 0.03;
      const thrHigh = kickThreshold;
      const thrLow = Math.max(0, kickThreshold - hyst);
      const refractory = 0.18;

      if (peakNorm <= thrLow) state.gateArmed = true;

      let isLocalPeak = false;
      if (state.hasPeakPrev) {
        const risingIntoPrev = state.peakNormPrev > state.peakNormPrev2;
        const fallingFromPrev = state.peakNormPrev >= peakNorm;
        isLocalPeak = risingIntoPrev && fallingFromPrev && state.peakNormPrev >= thrHigh;
      }

      const tap = state.gateArmed && isLocalPeak && (nowSec - state.lastTapSec) > refractory;
      if (tap) {
        state.lastTapSec = nowSec;
        state.tapCount += 1;
        state.gateArmed = false;
      }

      // Fixed 0.5s fade after threshold-pass tap.
      const pulseAge = nowSec - state.lastTapSec;
      state.tapPulse = pulseAge <= 0 ? 1 : clamp01(1 - (pulseAge / 0.5));
      state.peakNormPrev2 = state.peakNormPrev;
      state.peakNormPrev = peakNorm;
      state.hasPeakPrev = true;

      api.clockA = state.clockA;
      api.tapPulse = state.tapPulse;
      api.tapCount = state.tapCount;
    }
  };

  globalScope.BPMDetector = api;
})(typeof window !== "undefined" ? window : globalThis);
