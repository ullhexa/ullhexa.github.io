// Fixed-rate multiband attacks, shared by the AudioWorklet and PCM tests.
// Combine channel energies after filtering: opposite-polarity stereo survives.
export class BeatFeatures {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.hop = Math.round(sampleRate / 100);
    this.rate = sampleRate / this.hop;
    this.filters = new Float64Array(8);
    this.coefficients = Float64Array.from([35, 200, 2500, Math.min(10000, sampleRate * 0.4)], hz => 1 - Math.exp(-2 * Math.PI * hz / sampleRate));
    this.energy = new Float64Array(3);
    this.previous = new Float64Array(3);
    this.baseline = new Float64Array(3);
    this.strengths = new Float64Array(3);
    this.count = this.sum = this.rms = 0;
    this.warmed = false;
  }
  process(left, right = left) {
    if (!Number.isFinite(left)) left = 0;
    if (!Number.isFinite(right)) right = 0;
    this.sum += (left * left + right * right) * 0.5;
    for (let channel = 0; channel < 2; channel++) {
      const x = channel === 0 ? left : right;
      const offset = channel * 4;
      for (let band = 0; band < 4; band++) {
        const i = offset + band;
        this.filters[i] += this.coefficients[band] * (x - this.filters[i]);
      }
      for (let band = 0; band < 3; band++) {
        const value = this.filters[offset + band + 1] - this.filters[offset + band];
        this.energy[band] += value * value * 0.5;
      }
    }
    if (++this.count < this.hop) return false;
    this.rms = Math.sqrt(this.sum / this.count);
    for (let band = 0; band < 3; band++) {
      const envelope = Math.log1p(100 * Math.sqrt(this.energy[band] / this.count));
      const rise = this.warmed ? Math.max(0, envelope - this.previous[band]) : 0;
      this.baseline[band] += 0.008 * (rise - this.baseline[band]);
      this.strengths[band] = this.rms > 0.0005
        ? Math.min(32, Math.max(0, rise - this.baseline[band] * 0.65) / (0.035 + this.baseline[band])) : 0;
      this.previous[band] = envelope;
      this.energy[band] = 0;
    }
    this.warmed = true;
    this.sum = this.count = 0;
    return true;
  }
}
