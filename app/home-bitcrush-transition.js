// Small, temporary canvases turn the image change into a bitcrusher-style dissolve.
// Original images stay untouched; the animation does no work between transitions.
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function bitcrushFrame(progress, duration = 3000) {
  const t = clamp(progress);
  // Separate ramps overlap by 300 ms: rebuilding starts at 1350 ms while
  // decomposition continues until 1650 ms in the normal 3-second transition.
  // Linear resolution changes avoid the old shared curve's midpoint stall.
  const phase = (1 + Math.min(300 / duration, 1)) / 2;
  const crush = amount => ({ blockSize: 1 + 11 * amount, bits: Math.round(8 - 4 * amount) });
  return {
    outgoing: crush(clamp(t / phase)),
    incoming: crush(clamp((1 - t) / phase)),
    mix: smooth((t - 0.2) / 0.6)
  };
}

export function quantizeColours(pixels, bits) {
  if (bits >= 8) return;
  const step = 255 / ((1 << bits) - 1);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.round(pixels[i] / step) * step;
    pixels[i + 1] = Math.round(pixels[i + 1] / step) * step;
    pixels[i + 2] = Math.round(pixels[i + 2] / step) * step;
    // Alpha belongs to the supplied artwork, not its simulated colour depth.
  }
}

function sampleImage(buffer, image, width, height, blockSize, bits) {
  const w = Math.max(1, Math.round(width / blockSize));
  const h = Math.max(1, Math.round(height / blockSize));
  if (buffer.canvas.width !== w) buffer.canvas.width = w;
  if (buffer.canvas.height !== h) buffer.canvas.height = h;
  const ctx = buffer.context;
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
  if (bits < 8) {
    const data = ctx.getImageData(0, 0, w, h);
    quantizeColours(data.data, bits);
    ctx.putImageData(data, 0, 0);
  }
}

export function createBitcrushTransition(frames, {
  duration = 3000, elapsed = 0,
  now = () => performance.now(),
  requestFrame = callback => requestAnimationFrame(callback),
  cancelFrame = id => cancelAnimationFrame(id)
} = {}) {
  let resolve, settled = false, frameId = null, lastPaint = -Infinity;
  const finished = new Promise(done => { resolve = done; });
  const start = now() - elapsed;
  const scenes = [];
  const finish = () => {
    if (settled) return;
    settled = true;
    if (frameId !== null) cancelFrame(frameId);
    for (const { stage, image, canvas } of scenes) {
      image.style.removeProperty('opacity');
      canvas.remove();
      stage.replaceChildren(image);
    }
    resolve();
  };
  const controller = { finished, finish, cancel: finish };
  // Capture both geometries before any DOM writes, then use one clock for the batch.
  const geometry = frames.map(frame => ({ ...frame, bounds: frame.stage.getBoundingClientRect() }));
  try {
    for (const { stage, previous, image, bounds } of geometry) {
      const doc = stage.ownerDocument;
      const canvas = doc.createElement('canvas');
      const context = canvas.getContext('2d');
      const buffers = [0, 1].map(() => {
        const canvas = doc.createElement('canvas');
        return { canvas, context: canvas.getContext('2d', { willReadFrequently: true }) };
      });
      if (!context || buffers.some(buffer => !buffer.context) || !previous?.naturalWidth || !image.naturalWidth) throw new Error('Preview canvas unavailable');
      // Modest resolution and 30 fps bound work on mobile and high-DPI displays.
      const width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
      const resolution = Math.min(1.5, doc.defaultView.devicePixelRatio || 1);
      canvas.width = Math.round(width * resolution);
      canvas.height = Math.round(height * resolution);
      canvas.className = 'homeOverviewSlide homeOverviewTransition';
      canvas.setAttribute('aria-hidden', 'true');
      scenes.push({ stage, previous, image, canvas, context, buffers, width, height });
    }
    for (const { stage, image, canvas } of scenes) {
      image.style.opacity = '0';
      stage.replaceChildren(image, canvas);
    }
    const paint = () => {
      frameId = null;
      if (settled) return;
      const time = now();
      const progress = (time - start) / duration;
      if (progress >= 1) { finish(); return; }
      if (time - lastPaint >= 1000 / 30) {
        lastPaint = time;
        const { outgoing, incoming, mix } = bitcrushFrame(progress, duration);
        try {
          for (const scene of scenes) {
            const { previous, image, canvas, context, buffers, width, height } = scene;
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (const [index, source, alpha, state] of [[0, previous, 1 - mix, outgoing], [1, image, mix, incoming]]) {
              if (alpha <= 0) continue;
              const { blockSize, bits } = state;
              context.imageSmoothingEnabled = blockSize < 1.5;
              sampleImage(buffers[index], source, width, height, blockSize, bits);
              context.globalCompositeOperation = index ? 'lighter' : 'source-over';
              context.globalAlpha = alpha;
              context.drawImage(buffers[index].canvas, 0, 0, canvas.width, canvas.height);
            }
          }
        } catch { finish(); return; }
      }
      frameId = requestFrame(paint);
    };
    paint();
  } catch {
    finish();
    // Unsupported or blocked canvas access still completes the image change.
    for (const { stage, image } of frames) {
      image.style.removeProperty('opacity');
      stage.replaceChildren(image);
    }
  }
  return controller;
}
