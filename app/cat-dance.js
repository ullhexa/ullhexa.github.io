const clamp = (x, low = 0, high = 1) => Math.max(low, Math.min(high, x));
const ease = x => x * x * x * (10 + x * (-15 + 6 * x));

// Presentation only: positions arrive from the shared clock's smooth follower.
// Coordinates are fractions of the smaller canvas dimension.
export class CatDance {
  constructor(random = Math.random) {
    this.random = random;
    this.position = null;
    this.start = null;
    this.division = 1;
    this.eligibleSeconds = 0;
    this.angle = this.strength = this.level = 0;
    this.x = this.y = this.vx = this.vy = 0;
    this.active = false;
  }

  update(groove, volume, onset, dt) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const running = groove.bpm > 0 && Number.isFinite(groove.position);
    const position = running ? groove.position : null;
    const interrupted = position == null || this.position == null
      || position < this.position || position - this.position > 4;
    if (interrupted) { this.start = null; this.eligibleSeconds = 0; }
    const vol = clamp(volume);
    this.level += ((running ? vol : 0) - this.level) * (1 - Math.exp(-4 * dt));

    if (this.start != null && (position - this.start) * this.division >= 2) this.start = null;
    if (running && this.start == null) {
      // Half the former 1.8/s burst trigger rate. Accumulate only eligible audio
      // time, then decide on a beat boundary instead of chasing each transient.
      if (vol > 0.62 && onset > 0.13) this.eligibleSeconds += dt;
      if (!interrupted && Math.floor(position) > Math.floor(this.position)) {
        if (this.random() < 1 - Math.exp(-0.9 * this.eligibleSeconds)) {
          this.start = Math.floor(position);
          this.division = [0.5, 1, 2][Math.min(2, Math.floor(this.random() * 3))];
          this.angle = this.random() * Math.PI * 2;
          this.strength = 0.5 * (0.02 + vol * 0.045);
        }
        this.eligibleSeconds = 0;
      }
    }

    // Smaller at slow tempos; never increase travel to fill a long beat.
    const tempoScale = running ? clamp(groove.bpm / 120, 0.55, 1) : 0;
    const presence = clamp(this.level / 0.2);
    const radius = 0.5 * (0.01 + this.level * 0.018) * tempoScale * presence;
    let x = running ? Math.sin(Math.PI * position) * radius : 0;
    let y = running ? Math.sin(Math.PI * position) * radius * 0.3 : 0;
    this.active = running && this.start != null;
    if (this.active) {
      const travel = (position - this.start) * this.division;
      const cycle = Math.floor(travel), phase = travel - cycle;
      const excursion = ease(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
      const amount = excursion * this.strength * tempoScale * presence * (cycle % 2 ? -1 : 1);
      x += Math.cos(this.angle) * amount;
      y += Math.sin(this.angle) * amount * 0.8;
    }
    // Smooth acquisition, resets and changed tap guidance as well as the moves.
    // A critically damped follower preserves velocity rather than jumping poses.
    const omega = 32, decay = Math.exp(-omega * dt);
    for (const [axis, velocity, target] of [['x', 'vx', x], ['y', 'vy', y]]) {
      const displacement = this[axis] - target;
      const c = this[velocity] + omega * displacement;
      this[axis] = target + (displacement + c * dt) * decay;
      this[velocity] = (this[velocity] - omega * c * dt) * decay;
    }
    this.position = position;
    return this;
  }
}

// Doubling only the rest would not halve appearances: include the scene itself.
export function nextCombatPause(sceneSeconds, random = Math.random) {
  return Math.max(0, sceneSeconds) + 2 * (8 + random() * 14);
}
