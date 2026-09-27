const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
const wrap = x => x - Math.floor(x);
const REST_PHASE = 0.58;
const ease = x => x * x * x * (10 + x * (-15 + 6 * x));

// Presentation only: BPM Lab remains the sole source of tempo and beat phase.
// Phase/rate changes bend the path instead of teleporting the cat's position.
export class CatBounce {
  constructor() {
    this.position = null;
    this.rate = 0;
    this.time = null;
    this.amount = 0;
    this.presence = this.presenceVelocity = 0;
    this.phase = this.drive = 0;
  }

  update(groove, amount, time) {
    if (!Number.isFinite(time)) return this.drive;
    const elapsed = this.time == null ? 0 : Math.max(0, time - this.time);
    this.time = time;
    // A stalled/hidden page cannot render missed frames. Resume the existing
    // path, then gently reacquire phase instead of snapping to a new pose.
    // Preserve real elapsed time on slow frames too, or motion will fall behind
    // the audio clock repeatedly. Reserve capped resumption for actual stalls.
    let dt = elapsed > 0.25 ? 0.1 : elapsed;
    const active = Number.isFinite(groove.bpm) && groove.bpm > 0 && Number.isFinite(groove.phase);
    amount = Number.isFinite(amount) ? clamp(amount, 0, 1) : 0;
    const targetRate = active ? (Number.isFinite(groove.rate) && groove.rate > 0 ? groove.rate : groove.bpm / 60) : this.rate;
    if (this.position == null) {
      if (!active) return 0;
      this.position = groove.phase;
      this.rate = targetRate;
      this.amount = amount;
      dt = 0;
    }
    const previousPosition = this.position;
    const predicted = this.position + this.rate * dt;
    const error = active ? wrap(groove.phase - predicted + 0.5) - 0.5 : 0;
    // The engine handles musical decisions. This bounded visual adjustment only
    // absorbs message jitter, deliberate tap alignment and manual tempo changes.
    const correction = clamp(error * 2, -0.12, 0.12);
    const nextRate = this.rate + clamp(targetRate + correction - this.rate, -0.8 * dt, 0.8 * dt);
    this.position += (this.rate + nextRate) * 0.5 * dt;
    this.rate = nextRate;
    this.phase = wrap(this.position);

    // Choose strength at the resting apex, where position, velocity and
    // acceleration of the bounce curve are all zero. Never reshape mid-stroke.
    if (Math.floor(this.position + 1 - REST_PHASE) !== Math.floor(previousPosition + 1 - REST_PHASE)) {
      this.amount = amount;
    }
    const targetPresence = active && amount > 0.001 ? 1 : 0;
    const displacement = this.presence - targetPresence;
    const omega = 12;
    const c = this.presenceVelocity + omega * displacement;
    const decay = Math.exp(-omega * dt);
    this.presence = targetPresence + (displacement + c * dt) * decay;
    this.presenceVelocity = (this.presenceVelocity - omega * c * dt) * decay;

    // Slightly quicker landing, longer recovery. Peak dip is on the shared beat;
    // quintic endpoints keep velocity and acceleration continuous at both ends.
    const shape = this.phase < REST_PHASE
      ? 1 - ease(this.phase / REST_PHASE)
      : ease((this.phase - REST_PHASE) / (1 - REST_PHASE));
    this.drive = clamp(shape * this.amount * this.presence, 0, 1);
    return this.drive;
  }
}
