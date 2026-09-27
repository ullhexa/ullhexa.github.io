// Map the established groove to animation without creating another clock.
// Use the audio-clock phase, including its gradual timing corrections. Background
// candidate BPM and confidence must never override an established/held groove.
export function beatMotion(groove, leadSeconds = 0) {
  if (!(groove.bpm > 0) || !Number.isFinite(groove.bpm) || !Number.isFinite(groove.phase)) {
    return { bpm: 0, period: 0, phase: 0, pulse: 0 };
  }
  const rate = Number.isFinite(groove.rate) ? groove.rate : groove.bpm / 60;
  const position = groove.phase + rate * leadSeconds;
  const phase = position - Math.floor(position);
  return { bpm: groove.bpm, period: 60 / groove.bpm, phase,
    pulse: 0.5 + 0.5 * Math.cos(phase * Math.PI * 2) };
}
