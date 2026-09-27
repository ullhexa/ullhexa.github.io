// Tempo measurement and the musical output clock have separate responsibilities.
// Original implementation; architectural references are in docs/BPM_LAB.md.
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const wrap = x => x - Math.floor(x);
const phaseDistance = x => x - Math.round(x);
const closeTempo = (a, b) => Math.abs(a - b) < Math.max(0.8, b * 0.018);
const sameFamily = (a, b) => [0.5, 1, 2].some(ratio => closeTempo(a, b * ratio));

export class GrooveClock {
  constructor() { this.reset(); }
  reset() {
    this.bpm = this.targetBpm = this.position = this.confidence = 0;
    this.time = null;
    this.state = 'listening';
    this.candidate = null;
    this.candidateSince = 0;
    this.lastReliable = -Infinity;
    this.phaseCorrection = 0;
    this.pending = null;
    this.manual = this.gliding = this.aligning = false;
  }
  advance(time) {
    if (!Number.isFinite(time)) return;
    if (this.time == null) this.time = time;
    const dt = Math.max(0, time - this.time);
    if (dt === 0) return;
    const previousBeat = Math.floor(this.position);
    const maxStep = (this.gliding ? 4 : 0.18) * dt;
    const nextBpm = this.bpm + clamp(this.targetBpm - this.bpm, -maxStep, maxStep);
    if (this.bpm > 0) this.position += dt * ((this.bpm + nextBpm) / 120 + this.phaseCorrection);
    this.bpm = nextBpm;
    this.phaseCorrection *= Math.exp(-dt / 1.5);
    this.time = time;
    if (this.pending && Math.floor(this.position) !== previousBeat) {
      this.targetBpm = this.pending.bpm;
      this.pending = null;
      this.gliding = this.aligning = true;
    }
    if (Math.abs(this.bpm - this.targetBpm) < 0.03) this.gliding = false;
    if (this.bpm && !this.manual && time - this.lastReliable > 3) this.state = 'holding';
  }
  observe(candidate, time, incumbentScore = 0) {
    this.advance(time);
    const reliable = candidate && candidate.confidence >= 0.68;
    this.confidence = candidate?.confidence || 0;
    if (!reliable) {
      this.candidate = null;
      this.candidateSince = time;
      return;
    }
    if (!this.candidate || !closeTempo(candidate.bpm, this.candidate.bpm)) this.candidateSince = time;
    this.candidate = candidate;
    const stableFor = time - this.candidateSince;
    if (this.manual) return;
    if (!this.bpm) {
      if (stableFor < 3 || candidate.beats < 8) return;
      this.bpm = this.targetBpm = candidate.bpm;
      this.position = wrap((time - candidate.anchor) * candidate.bpm / 60);
      this.lastReliable = time;
      this.state = 'locked';
      return;
    }
    if (closeTempo(candidate.bpm, this.targetBpm)) {
      this.lastReliable = time;
      this.state = this.gliding || this.aligning ? 'adapting' : 'locked';
      if (stableFor >= 2 && Math.abs(candidate.bpm - this.targetBpm) > 0.12) this.targetBpm = candidate.bpm;
      const phaseError = phaseDistance((time - candidate.anchor) * candidate.bpm / 60 - this.position);
      // Correct timing near the established beat; never jump to an offbeat transient.
      if (Math.abs(phaseError) < 0.18 || this.aligning) this.phaseCorrection = clamp(phaseError * 0.15, -0.04, 0.04);
      if (Math.abs(phaseError) < 0.03) this.aligning = false;
    } else if (sameFamily(candidate.bpm, this.targetBpm)) {
      // Fills/new subdivisions must not halve or double the output clock.
      if (incumbentScore > 0.4) this.lastReliable = time;
    } else if (candidate.confidence >= 0.8 && stableFor >= 8 && candidate.score > incumbentScore * 1.3 && incumbentScore < 0.65) {
      this.pending = { bpm: candidate.bpm };
      this.lastReliable = time;
      this.state = 'adapting';
    }
  }
  setManual(enabled) {
    this.manual = Boolean(enabled && this.bpm);
    if (this.manual) {
      this.targetBpm = this.bpm;
      this.pending = null;
      this.phaseCorrection = 0;
      this.gliding = this.aligning = false;
    }
    this.state = this.manual ? 'manual' : this.bpm ? 'holding' : 'listening';
    this.candidate = null;
  }
  setTempo(bpm, time, align = false) {
    if (!Number.isFinite(bpm) || bpm < 35 || bpm > 300) return;
    this.advance(time);
    const wasRunning = this.bpm > 0;
    this.bpm = this.targetBpm = bpm;
    if (align || !wasRunning) this.position = Math.ceil(this.position);
    this.phaseCorrection = 0;
    this.pending = null;
    this.gliding = this.aligning = false;
    this.lastReliable = time;
    this.state = this.manual ? 'manual' : 'holding';
  }
  snapshot() {
    return { bpm: this.bpm, targetBpm: this.targetBpm, position: this.position, time: this.time || 0,
      rate: this.bpm / 60 + this.phaseCorrection, confidence: this.confidence, state: this.state, manual: this.manual };
  }
}

export class GrooveTracker {
  constructor({ rate = 100, minBpm = 50, maxBpm = 220 } = {}) {
    this.rate = rate;
    this.minBpm = minBpm;
    this.maxBpm = maxBpm;
    this.capacity = Math.ceil(rate * 12);
    this.history = new Float64Array(this.capacity);
    this.clock = new GrooveClock();
    this.reset();
  }
  reset() {
    this.history.fill(0);
    this.count = this.write = 0;
    this.events = [];
    this.previous = this.previous2 = 0;
    this.previousTime = 0;
    this.lastEvent = -Infinity;
    this.nextAnalysis = 0;
    this.lastFrame = null;
    this.candidates = [];
    this.clock.reset();
    this.rms = this.onset = 0;
  }
  push(time, low, mid, high, rms) {
    if (!Number.isFinite(time) || (this.lastFrame != null && time <= this.lastFrame)) return;
    if (this.lastFrame != null && time - this.lastFrame > 0.15) {
      // A gap adds no evidence. Continue the clock while reacquiring observations.
      this.count = this.write = 0;
      this.history.fill(0);
      this.events.length = 0;
      this.previous = this.previous2 = 0;
      this.clock.candidate = null;
    }
    this.clock.advance(time);
    this.lastFrame = time;
    this.rms = Number.isFinite(rms) ? Math.max(0, rms) : 0;
    const value = this.rms > 0.0005 ? Math.max(0, (low || 0) * 0.5 + (mid || 0) * 0.35 + (high || 0) * 0.15) : 0;
    this.onset = Number.isFinite(value) ? value : 0;
    this.history[this.write] = this.onset;
    this.write = (this.write + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
    if (this.previous > this.previous2 && this.previous >= this.onset && this.previous > 0.18) {
      const event = { time: this.previousTime, strength: Math.min(32, this.previous) };
      const preceding = this.events[this.events.length - 1];
      if (!preceding || event.time - preceding.time > 0.085) this.events.push(event);
      // Keep the strongest attack in a short cluster. A quiet pre-transient must
      // not reserve the refractory interval and suppress the following kick.
      else if (event.strength > preceding.strength) this.events[this.events.length - 1] = event;
      this.lastEvent = this.events[this.events.length - 1].time;
    }
    this.previous2 = this.previous;
    this.previous = this.onset;
    this.previousTime = time;
    while (this.events.length && this.events[0].time < time - 12) this.events.shift();
    if (time >= this.nextAnalysis) {
      this.nextAnalysis = time + 0.5;
      this.analyse(time);
    }
  }
  orderedHistory() {
    const values = new Float64Array(this.count);
    const start = (this.write - this.count + this.capacity) % this.capacity;
    for (let i = 0; i < values.length; i++) values[i] = this.history[(start + i) % this.capacity];
    return values;
  }
  fit(period, events, time) {
    const bins = 48;
    const histogram = new Float64Array(bins);
    let totalStrength = 0;
    for (const event of events) {
      const bin = wrap(event.time / period) * bins;
      const index = Math.floor(bin), fraction = bin - index;
      histogram[index] += event.strength * (1 - fraction);
      histogram[(index + 1) % bins] += event.strength * fraction;
      totalStrength += event.strength;
    }
    let bestBin = 0, bestValue = -1;
    for (let i = 0; i < bins; i++) {
      const value = histogram[i] + 0.65 * (histogram[(i + 1) % bins] + histogram[(i + bins - 1) % bins]);
      if (value > bestValue) { bestValue = value; bestBin = i; }
    }
    let anchor = bestBin / bins * period;
    const matches = [];
    for (const event of events) {
      const beat = Math.round((event.time - anchor) / period);
      if (Math.abs(event.time - anchor - beat * period) < period * 0.12) matches.push({ ...event, beat });
    }
    if (matches.length < 4) return null;
    // Regress event times against beat indices for sub-hop tempo resolution.
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const event of matches) {
      const w = event.strength;
      sw += w; sx += w * event.beat; sy += w * event.time;
      sxx += w * event.beat * event.beat; sxy += w * event.beat * event.time;
    }
    const denominator = sw * sxx - sx * sx;
    if (denominator > 1e-6) {
      const fitted = (sw * sxy - sx * sy) / denominator;
      if (Math.abs(fitted - period) < period * 0.025) { period = fitted; anchor = (sy - period * sx) / sw; }
    }
    const beats = new Set();
    let matchedStrength = 0, error = 0;
    for (const event of events) {
      const beat = Math.round((event.time - anchor) / period);
      const distance = Math.abs(event.time - anchor - beat * period);
      if (distance < period * 0.12) {
        beats.add(beat);
        matchedStrength += event.strength;
        error += distance / period * event.strength;
      }
    }
    const expected = Math.max(1, (time - events[0].time) / period);
    return { bpm: 60 / period, anchor, beats: beats.size, coverage: clamp(beats.size / expected),
      precision: clamp(1 - error / Math.max(0.001, matchedStrength) / 0.12), fraction: matchedStrength / Math.max(0.001, totalStrength) };
  }
  analyse(time) {
    if (this.count < this.rate * 6 || this.events.length < 8 || time - this.lastEvent > 2.5) {
      this.candidates = [];
      this.clock.observe(null, time);
      return;
    }
    const raw = this.orderedHistory();
    const values = new Float64Array(raw.length);
    // A short symmetric kernel makes periodicity tolerant of the 10 ms hop.
    // Without it, fractional periods can favor every second beat by accident.
    for (let i = 1; i < raw.length - 1; i++) values[i] = (raw[i - 1] + 2 * raw[i] + raw[i + 1]) / 4;
    const minLag = Math.floor(60 * this.rate / this.maxBpm);
    const maxLag = Math.ceil(60 * this.rate / this.minBpm);
    const correlation = new Float64Array(maxLag + 2);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
      let sum = 0, left = 0, right = 0;
      for (let i = lag; i < values.length; i++) {
        const a = values[i] - mean, b = values[i - lag] - mean;
        sum += a * b; left += a * a; right += b * b;
      }
      correlation[lag] = Math.max(0, sum / (Math.sqrt(left * right) + 1e-9));
    }
    const peaks = [];
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (correlation[lag] < 0.16 || correlation[lag] < correlation[lag - 1] || correlation[lag] < correlation[lag + 1]) continue;
      const curvature = correlation[lag - 1] - 2 * correlation[lag] + correlation[lag + 1];
      const offset = curvature ? clamp(0.5 * (correlation[lag - 1] - correlation[lag + 1]) / curvature, -0.5, 0.5) : 0;
      const fit = this.fit((lag + offset) / this.rate, this.events, time);
      if (!fit || fit.bpm < this.minBpm || fit.bpm > this.maxBpm) continue;
      const periodicity = clamp((correlation[lag] - 0.1) / 0.65);
      const quality = periodicity * fit.coverage * (0.6 + 0.4 * fit.precision);
      const prior = 0.7 + 0.3 * Math.exp(-0.5 * (Math.log2(fit.bpm / 120) / 0.6) ** 2);
      const score = quality * (0.15 + 0.85 * fit.fraction) * prior;
      peaks.push({ ...fit, quality, score, confidence: 0 });
    }
    let incumbentScore = 0;
    if (this.clock.targetBpm) incumbentScore = peaks.find(p => closeTempo(p.bpm, this.clock.targetBpm))?.score || 0;
    peaks.sort((a, b) => b.score - a.score);
    const best = peaks[0];
    if (best) {
      const rival = peaks.find(p => !sameFamily(p.bpm, best.bpm));
      const margin = rival ? clamp((best.score - rival.score) / Math.max(0.01, best.score) / 0.25) : 1;
      best.confidence = best.quality * (0.35 + 0.65 * margin);
      const recent = this.events.filter(event => event.time > time - 4);
      const recentFit = recent.length >= 4 ? this.fit(60 / best.bpm, recent, time) : null;
      if (!recentFit || !closeTempo(recentFit.bpm, best.bpm) || recentFit.coverage < 0.6) best.confidence *= 0.4;
    }
    this.candidates = peaks.slice(0, 4);
    this.clock.observe(best, time, incumbentScore);
  }
  snapshot() {
    return { ...this.clock.snapshot(), candidateBpm: this.candidates[0]?.bpm || 0,
      alternatives: this.candidates.map(p => p.bpm), rms: this.rms, onset: this.onset };
  }
}
