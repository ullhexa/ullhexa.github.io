// Lightweight "fractal-ish" flowing background (domain-warped value noise)
// Renders low-res to keep CPU/GPU chill.

function hash2(x, y) {
  // deterministic pseudo-random in [0,1)
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const v00 = hash2(xi, yi);
  const v10 = hash2(xi + 1, yi);
  const v01 = hash2(xi, yi + 1);
  const v11 = hash2(xi + 1, yi + 1);

  const u = smoothstep(xf);
  const v = smoothstep(yf);

  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

function fbm(x, y) {
  // 3 octaves = subtle detail, cheap
  let a = 0.0;
  let amp = 0.55;
  let freq = 1.0;
  for (let i = 0; i < 3; i++) {
    a += amp * valueNoise(x * freq, y * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return a;
}

export function startBackground() {
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d", { alpha: false });

  // Internal resolution scale: smaller = faster.
  // 0.5–0.7 is usually smooth. Start conservative.
  const INTERNAL_SCALE = 0.5;

  let w = 0, h = 0, img = null, data = null;

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cw = Math.floor(window.innerWidth * dpr * INTERNAL_SCALE);
    const ch = Math.floor(window.innerHeight * dpr * INTERNAL_SCALE);

    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";

    w = cw; h = ch;
    img = ctx.createImageData(w, h);
    data = img.data;
  }

  function render(t) {
    // slow time in seconds
    const time = t * 0.0001;

    // Tune these for subtlety
    const baseScale = 0.012;     // larger = bigger blobs
    const warpScale = 0.020;     // domain warp frequency
    const warpStrength = 1.2;    // warp amount

    let i = 0;
    for (let y = 0; y < h; y++) {
      const ny = y * baseScale;
      for (let x = 0; x < w; x++) {
        const nx = x * baseScale;

        // Domain warp: 2 fbm calls to perturb coords (fractal-ish feel)
        const wx = fbm(nx * warpScale + time * 1.3, ny * warpScale + time * 1.1);
        const wy = fbm(nx * warpScale - time * 1.2, ny * warpScale + time * 1.4);

        const fx = nx + (wx - 0.5) * warpStrength;
        const fy = ny + (wy - 0.5) * warpStrength;

        const n = fbm(fx + time * 0.9, fy - time * 0.7); // 0..~1

        // Map to dark greys with gentle contrast
        const v = Math.max(0, Math.min(1, (n - 0.35) * 1.2)); // compress
        const r = 10 + v * 40;
        const g = 10 + v * 42;
        const b = 12 + v * 46;

        data[i++] = r;
        data[i++] = g;
        data[i++] = b;
        data[i++] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(render);
}
