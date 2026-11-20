// Keep the latest post visible while bringing a tall panel into reading position.
export function newsScrollBoundary(feed, page) {
  const bottom = Math.max(0, page.scrollHeight - page.clientHeight);
  const panel = feed.closest('.homeNews').getBoundingClientRect();
  return panel.height > page.clientHeight - 64
    ? Math.min(bottom, Math.max(0, page.scrollTop + panel.top - 16))
    : bottom;
}

// Ordinary swipes in the aligned feed stay entirely native, including momentum.
// Only a swipe needing a page/feed handoff installs a blocking touchmove handler.
export function bindNewsTouchScrollOrder(feed) {
  const doc = feed.ownerDocument;
  const view = doc.defaultView;
  let gesture = null, motion = null, frame = 0, tracking = false, disposed = false;
  const detachMove = () => {
    if (tracking) feed.removeEventListener('touchmove', move);
    tracking = false;
  };
  const cancel = () => {
    gesture = null;
    motion = null;
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    detachMove();
  };
  const nativeGesture = () =>
    (view.visualViewport?.scale || 1) > 1.01 || doc.getSelection?.()?.isCollapsed === false;
  const advance = (state, key, pixels, minimum, maximum) => {
    const before = state[key];
    state[key] = Math.max(minimum, Math.min(maximum, before + pixels));
    return state[key] - before;
  };
  const scroll = (state, pixels) => {
    let remaining = pixels;
    if (pixels > 0) {
      if (state.pageTop < state.boundary) remaining -= advance(state, 'pageTop', remaining, 0, state.boundary);
      if (remaining > 0) remaining -= advance(state, 'feedTop', remaining, 0, state.feedMax);
      if (remaining > 0) remaining -= advance(state, 'pageTop', remaining, 0, state.pageMax);
    } else {
      if (state.pageTop > state.boundary) remaining -= advance(state, 'pageTop', remaining, state.boundary, state.pageMax);
      if (remaining < 0) remaining -= advance(state, 'feedTop', remaining, 0, state.feedMax);
      if (remaining < 0) remaining -= advance(state, 'pageTop', remaining, 0, state.pageMax);
    }
    return pixels - remaining;
  };
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(tick);
  };
  const tick = time => {
    frame = 0;
    const state = motion;
    if (!state || disposed) return;
    if (nativeGesture() || doc.visibilityState === 'hidden') { cancel(); return; }
    let pixels = state.pending;
    state.pending = 0;
    if (state.coasting) {
      const elapsed = state.lastTime === null ? 16 : time - state.lastTime;
      const dt = Math.max(0, Math.min(32, elapsed));
      const decay = Math.exp(-dt / 260);
      if (elapsed > 80) state.coasting = false;
      else {
        pixels += state.velocity * 260 * (1 - decay);
        state.velocity *= decay;
      }
    }
    state.lastTime = time;
    const moved = scroll(state, pixels);
    // Geometry is read once at gesture start. At most one write per scroller
    // per frame, with no layout reads or scrollTop readbacks after these writes.
    if (state.pageTop !== state.writtenPage) {
      state.page.scrollTop = state.pageTop;
      state.writtenPage = state.pageTop;
    }
    if (state.feedTop !== state.writtenFeed) {
      feed.scrollTop = state.feedTop;
      state.writtenFeed = state.feedTop;
    }
    if (state.coasting && Math.abs(state.velocity) >= .025 &&
        !(Math.abs(pixels) > .5 && Math.abs(moved) < .5)) schedule();
    else if (!gesture) motion = null;
  };
  const start = event => {
    cancel();
    if (event.defaultPrevented || event.touches.length !== 1 || !doc.scrollingElement || nativeGesture()) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const page = doc.scrollingElement;
    const boundary = newsScrollBoundary(feed, page);
    const pageTop = page.scrollTop;
    // No move handler, preventDefault, animation frames or scripted momentum
    // for the ordinary reading position. Native edge chaining remains available.
    if (Math.abs(pageTop - boundary) <= 1) return;
    const touch = event.touches[0];
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY,
      lastY: touch.clientY, lastTime: event.timeStamp, distance: 0, velocity: 0,
      samples: [{ position: 0, time: event.timeStamp }], scrolling: false,
      direction: pageTop < boundary ? 1 : -1 };
    motion = { page, pageTop, feedTop: feed.scrollTop, boundary,
      pageMax: Math.max(0, page.scrollHeight - page.clientHeight),
      feedMax: Math.max(0, feed.scrollHeight - feed.clientHeight),
      writtenPage: pageTop, writtenFeed: feed.scrollTop,
      pending: 0, velocity: 0, coasting: false, lastTime: null };
    feed.addEventListener('touchmove', move, { passive: false });
    tracking = true;
  };
  const move = event => {
    if (!gesture) return;
    if (event.defaultPrevented || !event.cancelable || event.touches.length !== 1 || nativeGesture()) { cancel(); return; }
    const touch = [...event.touches].find(item => item.identifier === gesture.id);
    if (!touch) { cancel(); return; }
    if (!gesture.scrolling) {
      const dx = touch.clientX - gesture.x, dy = gesture.y - touch.clientY;
      if (!dx && !dy) return;
      if (Math.abs(dx) > Math.abs(dy) || Math.sign(dy) !== gesture.direction) { cancel(); return; }
      gesture.scrolling = true;
    }
    event.preventDefault();
    const pixels = gesture.lastY - touch.clientY;
    motion.pending += pixels;
    schedule();
    if (pixels && Math.sign(pixels) !== Math.sign(gesture.velocity)) {
      gesture.samples = [{ position: gesture.distance, time: gesture.lastTime }];
    }
    gesture.distance += pixels;
    const time = event.timeStamp;
    gesture.samples.push({ position: gesture.distance, time });
    while (gesture.samples.length > 2 && gesture.samples[0].time < time - 100) gesture.samples.shift();
    const first = gesture.samples[0];
    gesture.velocity = (gesture.distance - first.position) / Math.max(1, time - first.time);
    gesture.lastY = touch.clientY;
    gesture.lastTime = time;
  };
  const end = event => {
    const finished = gesture;
    gesture = null;
    detachMove();
    if (!finished?.scrolling) { motion = null; return; }
    motion.coasting = !event.touches.length && !event.defaultPrevented &&
      event.timeStamp - finished.lastTime < 80 && !nativeGesture() &&
      !view.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    motion.velocity = Math.max(-3, Math.min(3, finished.velocity));
    schedule();
  };
  const passive = { passive: true };
  const capturePassive = { passive: true, capture: true };
  const interruptions = ['touchstart', 'pointerdown', 'wheel', 'keydown', 'visibilitychange'];
  for (const type of interruptions) doc.addEventListener(type, cancel, capturePassive);
  view.addEventListener('blur', cancel);
  view.addEventListener('resize', cancel);
  feed.addEventListener('touchstart', start, passive);
  feed.addEventListener('touchend', end, passive);
  feed.addEventListener('touchcancel', cancel, passive);
  return () => {
    disposed = true;
    cancel();
    for (const type of interruptions) doc.removeEventListener(type, cancel, capturePassive);
    view.removeEventListener('blur', cancel);
    view.removeEventListener('resize', cancel);
    feed.removeEventListener('touchstart', start);
    feed.removeEventListener('touchend', end);
    feed.removeEventListener('touchcancel', cancel);
  };
}
