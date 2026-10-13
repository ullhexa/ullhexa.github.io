// Tempo measurement and the musical output clock have separate responsibilities.
// Original implementation; architectural references are in docs/BPM_LAB.md.
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const wrap = x => x - Math.floor(x);
const phaseDistance = x => x - Math.round(x);
const closeTempo = (a, b) => Math.abs(a - b) < Math.max(0.8, b * 0.018);
const sameFamily = (a, b) => [0.5, 1, 2].some(ratio => closeTempo(a, b * ratio));

// A preference near an integer, never unconditional rounding of a fractional track.
export function musicalBpm(bpm, previous = 0) {
  const integer = Math.round(bpm);
  const radius = Number.isInteger(previous) && previous === integer ? 0.32 : 0.22;
  return Math.abs(bpm - integer) <= radius ? integer : bpm;
}

// Continually averages up to 64 taps. Regression uses elapsed beat indices,
// tolerates missed taps, and downweights timing slips instead of starting over.
export class TapGuide {
  constructor() { this.reset(); }
  reset() { this.taps = []; this.count = 0; this.bpm = this.anchor = this.quality = 0; }
  tap(time) {
    if (!Number.isFinite(time)) return null;
    const gap = this.taps.length ? time - this.taps.at(-1) : Infinity;
    if (gap < 0.18) return null; // key repeat / accidental double tap
    if (gap > 2) { this.taps = []; this.count = 0; }
    this.taps.push(time); this.count++;
    if (this.taps.length > 64) this.taps.shift();
    if (this.taps.length < 5) return null;
    const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    let intervals = this.taps.slice(1).map((t, i) => t - this.taps[i]);
    let period = median(intervals);
    const recent = intervals.slice(-5), recentPeriod = median(recent);
    if (recent.length === 5 && Math.abs(recentPeriod / period - 1) > 0.12 && recent.every(x => Math.abs(x / recentPeriod - 1) < 0.12)) {
      this.taps = this.taps.slice(-6); this.count = 6;
      intervals = recent; period = recentPeriod;
    }
    let index = 0, goodIntervals = 0;
    const points = [{ x: 0, y: this.taps[0], weight: 1 }];
    intervals.forEach((interval, i) => {
      const beats = clamp(Math.round(interval / period), 1, 3);
      const good = Math.abs(interval / beats / period - 1) < 0.25;
      if (good) goodIntervals++;
      index += beats;
      points.push({ x: index, y: this.taps[i + 1], weight: good ? 1 : 0.1 });
    });
    if (goodIntervals < 4 || goodIntervals < intervals.length * 0.65) return null;
    let anchor = points[0].y;
    for (let pass = 0; pass < 3; pass++) {
      let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (const point of points) {
        const residual = Math.abs(point.y - anchor - period * point.x);
        const w = point.weight * (pass ? Math.min(1, period * 0.06 / Math.max(0.001, residual)) : 1);
        sw += w; sx += w * point.x; sy += w * point.y;
        sxx += w * point.x ** 2; sxy += w * point.x * point.y;
      }
      const denominator = sw * sxx - sx * sx;
      if (denominator <= 0) return null;
      period = (sw * sxy - sx * sy) / denominator;
      anchor = (sy - period * sx) / sw;
    }
    const bpm = 60 / period;
    if (bpm < 35 || bpm > 300) return null;
    const error = median(points.map(p => Math.abs(p.y - anchor - period * p.x)));
    this.quality = clamp(1 - error / (period * 0.15));
    if (this.quality < 0.55) return null;
    this.bpm = bpm;
    this.anchor = anchor + index * period;
    return { bpm, anchor: this.anchor, quality: this.quality, count: this.count };
  }
  rebase(delta) { this.taps = this.taps.map(t => t + delta); this.anchor += delta; }
}

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
    this.guideBpm = this.guideAnchor = this.guideTime = 0;
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
    if (this.bpm && !this.manual && time - this.lastReliable > 3) this.state = this.guideBpm ? 'guided' : 'holding';
  }
  observe(candidate, time, incumbentScore = 0) {
    this.advance(time);
    const reliable = candidate && candidate.confidence >= (this.guideBpm ? 0.30 : 0.34);
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
    if (this.guideBpm) {
      // A tap chooses the metrical level. Audio can refine locally, never escape
      // to an unrelated / half / double tempo until another tap run or Reset.
      this.state = 'guided';
      if (Math.abs(candidate.bpm / this.guideBpm - 1) > 0.035 || !(candidate.directSupport > 0)) return;
      this.lastReliable = time;
      if (stableFor >= 2) this.targetBpm = musicalBpm(candidate.bpm, this.targetBpm);
      const error = phaseDistance((time - candidate.anchor) * candidate.bpm / 60 - this.position);
      const supportedPhase = stableFor >= 4 && time - this.guideTime > 2 && candidate.confidence >= 0.4
        && (candidate.bandSupport || []).filter(value => value > 0.4).length >= 2;
      if (Math.abs(error) < 0.2 || supportedPhase) this.phaseCorrection = clamp(error * 0.2, -0.04, 0.04);
      return;
    }
    if (!this.bpm) {
      if (stableFor < 3 || candidate.beats < 8) return;
      this.bpm = this.targetBpm = musicalBpm(candidate.bpm);
      this.position = wrap((time - candidate.anchor) * candidate.bpm / 60);
      this.lastReliable = time;
      this.state = 'locked';
      return;
    }
    if (closeTempo(candidate.bpm, this.targetBpm)) {
      this.lastReliable = time;
      this.state = this.gliding || this.aligning ? 'adapting' : 'locked';
      if (stableFor >= 2 && Math.abs(candidate.bpm - this.targetBpm) > 0.12) this.targetBpm = musicalBpm(candidate.bpm, this.targetBpm);
      const phaseError = phaseDistance((time - candidate.anchor) * candidate.bpm / 60 - this.position);
      // Correct timing near the established beat; never jump to an offbeat transient.
      if (Math.abs(phaseError) < 0.18 || this.aligning) this.phaseCorrection = clamp(phaseError * 0.15, -0.04, 0.04);
      if (Math.abs(phaseError) < 0.03) this.aligning = false;
    } else if (sameFamily(candidate.bpm, this.targetBpm)) {
      // Fills/new subdivisions must not halve or double the output clock.
      if (incumbentScore > 0.4) this.lastReliable = time;
    } else if (candidate.confidence >= 0.4 && stableFor >= 8 && candidate.score > incumbentScore * 1.3 && incumbentScore < 0.65) {
      this.pending = { bpm: musicalBpm(candidate.bpm) };
      this.lastReliable = time;
      this.state = 'adapting';
    }
  }
  guideTo(bpm, time, anchor = time) {
    if (!Number.isFinite(bpm) || bpm < 35 || bpm > 300) return;
    this.advance(time);
    const first = !this.guideBpm;
    const changed = !this.guideBpm || Math.abs(bpm / this.guideBpm - 1) > 0.035;
    this.guideBpm = musicalBpm(bpm, this.guideBpm);
    this.guideAnchor = anchor;
    this.guideTime = time;
    this.manual = false;
    this.pending = null;
    if (!this.bpm) {
      this.bpm = this.targetBpm = this.guideBpm;
      this.position = wrap((time - anchor) * this.guideBpm / 60);
    } else {
      if (changed || time - this.lastReliable > 3) this.targetBpm = this.guideBpm;
      this.gliding = Math.abs(this.bpm - this.targetBpm) > 1;
      const error = phaseDistance((time - anchor) * bpm / 60 - this.position);
      this.phaseCorrection = clamp(error * (first ? 0.4 : 0.25), -0.1, 0.1);
    }
    this.state = 'guided';
    if (changed) this.candidate = null;
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
      rate: this.bpm / 60 + this.phaseCorrection, confidence: this.confidence, state: this.state, manual: this.manual, guideBpm: this.guideBpm };
  }
}

export class GrooveTracker {
  constructor({ rate = 100, minBpm = 50, maxBpm = 220 } = {}) {
    this.rate = rate;
    this.minBpm = minBpm;
    this.maxBpm = maxBpm;
    this.capacity = Math.ceil(rate * 12);
    this.history = new Float64Array(this.capacity);
    this.bandHistory = Array.from({ length: 3 }, () => new Float64Array(this.capacity));
    this.taps = new TapGuide();
    this.clock = new GrooveClock();
    this.reset();
  }
  reset() {
    this.history.fill(0);
    this.bandHistory.forEach(band => band.fill(0));
    this.bandEvents = [[], [], []];
    this.bandPrevious = [0, 0, 0];
    this.bandPrevious2 = [0, 0, 0];
    this.taps.reset();
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
      this.bandHistory.forEach(band => band.fill(0));
      this.bandEvents = [[], [], []];
      this.bandPrevious = [0, 0, 0];
      this.bandPrevious2 = [0, 0, 0];
      this.previous = this.previous2 = 0;
      this.clock.candidate = null;
    }
    this.clock.advance(time);
    this.lastFrame = time;
    this.rms = Number.isFinite(rms) ? Math.max(0, rms) : 0;
    const lanes = [low, mid, high].map(value => this.rms > 0.0005 && Number.isFinite(value) ? clamp(value, 0, 32) : 0);
    this.onset = lanes[0] * 0.5 + lanes[1] * 0.35 + lanes[2] * 0.15;
    for (let band = 0; band < 3; band++) {
      this.bandHistory[band][this.write] = lanes[band];
      const previous = this.bandPrevious[band], events = this.bandEvents[band];
      if (previous > this.bandPrevious2[band] && previous >= lanes[band] && previous > 0.18) {
        const event = { time: this.previousTime, strength: previous };
        const preceding = events.at(-1);
        if (!preceding || event.time - preceding.time > 0.055) events.push(event);
        else if (event.strength > preceding.strength) events[events.length - 1] = event;
      }
      this.bandPrevious2[band] = previous;
      this.bandPrevious[band] = lanes[band];
      while (events.length && events[0].time < time - 12) events.shift();
    }
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
  orderedHistory(history = this.history) {
    const values = new Float64Array(this.count);
    const start = (this.write - this.count + this.capacity) % this.capacity;
    for (let i = 0; i < values.length; i++) values[i] = history[(start + i) % this.capacity];
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
  tap(time) {
    const guide = this.taps.tap(time);
    if (guide) this.clock.guideTo(guide.bpm, time, guide.anchor);
  }
  multiply(value, time) {
    if (![0.5, 2].includes(value) || !this.clock.bpm) return;
    const bpm = this.clock.targetBpm * value;
    if (bpm < 35 || bpm > 300) return;
    this.taps.reset();
    this.clock.guideTo(bpm, time);
  }
  rebase(delta, rate = this.rate) {
    const clock = this.clock, taps = this.taps;
    // Keep the user's groove when tap-only playback gains an audio source.
    this.rate = rate;
    this.capacity = Math.ceil(rate * 12);
    this.history = new Float64Array(this.capacity);
    this.bandHistory = Array.from({ length: 3 }, () => new Float64Array(this.capacity));
    this.taps = new TapGuide(); this.clock = new GrooveClock(); this.reset();
    this.clock = clock; this.taps = taps;
    if (clock.time != null) clock.time += delta;
    clock.lastReliable += delta; clock.guideAnchor += delta; clock.guideTime += delta;
    clock.candidate = null; clock.pending = null;
    taps.rebase(delta);
  }
  analyse(time) {
    if (this.count < this.rate * (this.clock.guideBpm ? 3 : 6) || this.events.length < 6 || time - this.lastEvent > 2.5) {
      this.candidates = [];
      this.clock.observe(null, Math.max(time, this.clock.time || 0));
      return;
    }
    const minimum = this.clock.guideBpm ? 35 : this.minBpm;
    const maximum = this.clock.guideBpm ? 300 : this.maxBpm;
    const minLag = Math.floor(60 * this.rate / maximum);
    const maxLag = Math.ceil(240 * this.rate / minimum);
    // Normalize correlation within each lane, so a loud bassline cannot erase
    // quieter percussion. The raw combined history remains a diagnostic display, not the tempo signal.
    const lanes = this.bandHistory.map(history => {
      const raw = this.orderedHistory(history), values = new Float64Array(raw.length);
      for (let i = 1; i < raw.length - 1; i++) values[i] = (raw[i - 1] + 2 * raw[i] + raw[i + 1]) / 4;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      for (let i = 0; i < values.length; i++) values[i] -= mean;
      return values;
    });
    const correlate = (a, b, lag) => {
      lag = Math.round(lag);
      let sum = 0, left = 0, right = 0;
      for (let i = Math.max(0, lag); i < Math.min(a.length, b.length + lag); i++) {
        const x = a[i], y = b[i - lag];
        sum += x * y; left += x * x; right += y * y;
      }
      return Math.max(0, sum / (Math.sqrt(left * right) + 1e-9));
    };
    const correlations = lanes.map(values => {
      const acf = new Float64Array(maxLag + 2);
      for (let lag = Math.max(2, Math.floor(minLag / 4) - 1); lag <= maxLag + 1; lag++) acf[lag] = correlate(values, values, lag);
      return acf;
    });
    const at = (acf, lag) => {
      const i = Math.floor(lag), f = lag - i;
      return (acf[i] || 0) * (1 - f) + (acf[i + 1] || 0) * f;
    };
    const hypotheses = [];
    const propose = (bpm, strength) => {
      if (bpm < minimum || bpm > maximum || !Number.isFinite(bpm)) return;
      const prior = 0.7 + 0.3 * Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.6) ** 2);
      const existing = hypotheses.find(p => Math.abs(p.bpm / bpm - 1) < 0.008);
      if (existing) existing.strength = Math.max(existing.strength, strength * prior);
      else hypotheses.push({ bpm, strength: strength * prior });
    };
    for (const acf of correlations) {
      for (let lag = Math.max(3, Math.floor(minLag / 2)); lag <= maxLag; lag++) {
        if (acf[lag] < 0.18 || acf[lag] < acf[lag - 1] || acf[lag] < acf[lag + 1]) continue;
        const curvature = acf[lag - 1] - 2 * acf[lag] + acf[lag + 1];
        const offset = curvature ? clamp(0.5 * (acf[lag - 1] - acf[lag + 1]) / curvature, -0.5, 0.5) : 0;
        for (const ratio of [0.5, 1, 2]) propose(60 * this.rate / (lag + offset) * ratio, acf[lag]);
      }
    }
    if (this.clock.targetBpm) propose(this.clock.targetBpm, 1.1);
    if (this.clock.guideBpm) {
      // Search around the user's beat, even if unrelated peaks win the global scan.
      for (let offset = -0.03; offset <= 0.0301; offset += 0.01) propose(this.clock.guideBpm * (1 + offset), 1.2);
    }
    hypotheses.sort((a, b) => b.strength - a.strength);
    const roles = [[1, 2, 4], [1, 2, 0.5, 4], [1, 0.5, 0.25, 2]];
    const weights = [0.48, 0.28, 0.24];
    const peaks = [];
    for (const hypothesis of hypotheses.slice(0, 28)) {
      const period = 60 / hypothesis.bpm;
      const fits = this.bandEvents.map((events, band) => {
        let best = null;
        for (const ratio of roles[band]) {
          const correlation = at(correlations[band], period * ratio * this.rate);
          if (correlation < 0.16) continue;
          const fit = this.fit(period * ratio, events, time);
          if (!fit) continue;
          const periodicity = clamp((correlation - 0.1) / 0.65);
          const quality = periodicity * fit.coverage * (0.6 + 0.4 * fit.precision);
          const role = ratio === 1 ? 1 : ratio === 0.25 ? 0.7 : ratio === 4 ? 0.76 : 0.87;
          const grade = quality * (0.4 + 0.6 * fit.fraction) * role;
          if (!best || grade > best.grade) best = { ...fit, quality, grade, ratio, baseBpm: fit.bpm * ratio };
        }
        return best;
      });
      const supported = fits.filter(Boolean);
      if (!supported.length) continue;
      let sum = 0, weight = 0;
      fits.forEach((fit, band) => { if (fit) { const w = weights[band] * fit.grade ** 2; sum += fit.baseBpm * w; weight += w; } });
      const bpm = sum / weight;
      if (!Number.isFinite(bpm) || bpm < minimum || bpm > maximum) continue;
      const phaseEvents = this.bandEvents.flatMap((events, band) => {
        const strength = events.reduce((sum, event) => sum + event.strength, 0);
        const scale = weights[band] * (fits[band]?.grade || 0) / Math.max(0.001, strength);
        return scale ? events.map(event => ({ time: event.time, strength: event.strength * scale })) : [];
      }).sort((a, b) => a.time - b.time);
      const phaseFit = this.fit(60 / bpm, phaseEvents, time);
      if (!phaseFit) continue;
      const sorted = [...supported].sort((a, b) => b.quality - a.quality);
      const quality = sorted[0].quality * (0.85 + 0.15 * (sorted[1]?.quality || 0));
      // Cross-correlate independent lanes at on/offbeat and subdivision offsets.
      // Agreement must recur one full beat later; simultaneous leakage alone is
      // not extra rhythmic evidence. These are soft 4/4/electronic priors.
      let agreement = 0, pairs = 0;
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
        if (!fits[a] || !fits[b] || fits[a].quality < 0.4 || fits[b].quality < 0.4) continue;
        let pair = 0;
        for (const fraction of [-0.5, -0.25, 0, 0.25, 0.5]) {
          const lag = fraction * period * this.rate;
          const match = Math.min(correlate(lanes[a], lanes[b], lag), correlate(lanes[a], lanes[b], lag + period * this.rate));
          pair = Math.max(pair, match * (Math.abs(fraction) === 0.25 ? 0.8 : 1));
        }
        agreement += pair; pairs++;
      }
      agreement /= Math.max(1, pairs);
      const prior = 0.7 + 0.3 * Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.6) ** 2);
      let score = fits.reduce((sum, fit, band) => sum + weights[band] * (fit?.grade || 0), 0) * prior * (1 + 0.18 * agreement);
      if (this.clock.guideBpm) score *= 0.08 + 0.92 * Math.exp(-0.5 * (Math.log(bpm / this.clock.guideBpm) / 0.025) ** 2);
      const recentSupport = fits.reduce((best, fit, band) => {
        if (!fit) return best;
        const recent = this.bandEvents[band].filter(event => event.time > time - 4);
        const check = this.fit(60 / bpm * fit.ratio, recent, time);
        return check && closeTempo(check.bpm * fit.ratio, bpm) ? Math.max(best, check.coverage * check.precision) : best;
      }, 0);
      const candidate = { ...phaseFit, bpm, quality, score, confidence: 0, agreement,
        bandSupport: fits.map(fit => fit?.grade || 0), recentSupport,
        directSupport: fits.filter(fit => fit && fit.ratio !== 4 && fit.grade > 0.65).length };
      const existing = peaks.find(p => closeTempo(p.bpm, bpm));
      if (!existing) peaks.push(candidate);
      else if (score > existing.score) Object.assign(existing, candidate);
    }
    const incumbentScore = peaks.find(p => closeTempo(p.bpm, this.clock.targetBpm))?.score || 0;
    peaks.sort((a, b) => b.score - a.score);
    const best = peaks[0];
    if (best) {
      const rival = peaks.find(p => !sameFamily(p.bpm, best.bpm));
      const margin = rival ? clamp((best.score - rival.score) / Math.max(0.01, best.score) / 0.25) : 1;
      // Nearly tied, unrelated tempos must remain ambiguous. The old 45% floor
      // let a steady tone's envelope ripple pass the new, lower clock threshold.
      best.confidence = best.quality * (0.2 + 0.8 * margin);
      if (best.recentSupport < 0.5) best.confidence *= 0.45;
    }
    this.candidates = peaks.slice(0, 4);
    this.clock.observe(best, Math.max(time, this.clock.time || 0), incumbentScore);
  }
  snapshot() {
    return { ...this.clock.snapshot(), candidateBpm: this.candidates[0]?.bpm || 0,
      alternatives: this.candidates.map(p => p.bpm), bandSupport: this.candidates[0]?.bandSupport || [0, 0, 0],
      bandAgreement: this.candidates[0]?.agreement || 0, tapCount: this.taps.count, tapBpm: this.taps.bpm, rms: this.rms, onset: this.onset };
  }
}
