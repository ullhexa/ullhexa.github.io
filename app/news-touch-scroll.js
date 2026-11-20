// Keep the latest post visible while bringing a tall panel into reading position.
export function newsScrollBoundary(feed, page) {
  const bottom = Math.max(0, page.scrollHeight - page.clientHeight);
  const panel = feed.closest('.homeNews').getBoundingClientRect();
  return panel.height > page.clientHeight - 64
    ? Math.min(bottom, Math.max(0, page.scrollTop + panel.top - 16))
    : bottom;
}

// A vertical swipe starting in the feed uses one ordered scroll path:
// page to the reading position, then posts, then the rest of the page.
// Reverse swipes follow that path backwards. Other gestures remain native.
export function bindNewsTouchScrollOrder(feed) {
  const doc = feed.ownerDocument;
  const view = doc.defaultView;
  let gesture = null, frame = 0, disposed = false;
  const stopMomentum = () => {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
  };
  const cancel = () => { gesture = null; stopMomentum(); };
  const nativeGesture = () =>
    (view.visualViewport?.scale || 1) > 1.01 || doc.getSelection?.()?.isCollapsed === false;
  const advance = (node, pixels, minimum = 0, maximum = Math.max(0, node.scrollHeight - node.clientHeight)) => {
    const before = node.scrollTop;
    node.scrollTop = Math.max(minimum, Math.min(maximum, before + pixels));
    return node.scrollTop - before;
  };
  const scroll = pixels => {
    const page = doc.scrollingElement;
    if (!page) return 0;
    const boundary = newsScrollBoundary(feed, page);
    let remaining = pixels;
    if (pixels > 0) {
      if (page.scrollTop < boundary) remaining -= advance(page, remaining, 0, boundary);
      if (remaining > 0) remaining -= advance(feed, remaining);
      if (remaining > 0) remaining -= advance(page, remaining);
    } else {
      if (page.scrollTop > boundary) remaining -= advance(page, remaining, boundary);
      if (remaining < 0) remaining -= advance(feed, remaining);
      if (remaining < 0) remaining -= advance(page, remaining);
    }
    return pixels - remaining;
  };
  const coast = initialVelocity => {
    if (view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let velocity = Math.max(-3, Math.min(3, initialVelocity)), lastTime = null;
    const tick = time => {
      frame = 0;
      if (disposed || nativeGesture() || doc.visibilityState === 'hidden') return;
      const elapsed = lastTime === null ? 16 : time - lastTime;
      lastTime = time;
      // A suspended/background frame must not cause a large catch-up jump.
      if (elapsed > 80) return;
      const dt = Math.max(0, Math.min(32, elapsed));
      const decay = Math.exp(-dt / 260);
      const pixels = velocity * 260 * (1 - decay);
      velocity *= decay;
      const moved = scroll(pixels);
      if (Math.abs(velocity) < .025 || (Math.abs(pixels) > .5 && Math.abs(moved) < .5)) return;
      frame = view.requestAnimationFrame(tick);
    };
    if (Math.abs(velocity) >= .025) frame = view.requestAnimationFrame(tick);
  };
  const start = event => {
    cancel();
    if (event.defaultPrevented || event.touches.length !== 1 || !doc.scrollingElement || nativeGesture()) return;
    // Do not take gestures from a text field if one is added to the feed later.
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const touch = event.touches[0];
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY,
      lastY: touch.clientY, lastTime: event.timeStamp, distance: 0, velocity: 0,
      samples: [{ position: 0, time: event.timeStamp }], scrolling: false };
  };
  const move = event => {
    if (!gesture) return;
    if (event.defaultPrevented || !event.cancelable || event.touches.length !== 1 || nativeGesture()) {
      gesture = null;
      return;
    }
    const touch = [...event.touches].find(item => item.identifier === gesture.id);
    if (!touch) { gesture = null; return; }
    if (!gesture.scrolling) {
      const dx = touch.clientX - gesture.x, dy = gesture.y - touch.clientY;
      if (!dx && !dy) return;
      if (Math.abs(dx) > Math.abs(dy)) { gesture = null; return; }
      gesture.scrolling = true;
    }
    event.preventDefault();
    const pixels = gesture.lastY - touch.clientY;
    scroll(pixels);
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
    if (finished?.scrolling && !event.touches.length && !event.defaultPrevented &&
        event.timeStamp - finished.lastTime < 80 && !nativeGesture()) coast(finished.velocity);
  };
  const passive = { passive: true };
  const capturePassive = { passive: true, capture: true };
  // New input anywhere stops a previous flick, including a tap outside the feed.
  const interruptions = ['touchstart', 'pointerdown', 'wheel', 'keydown', 'visibilitychange'];
  for (const type of interruptions) doc.addEventListener(type, cancel, capturePassive);
  view.addEventListener('blur', cancel);
  feed.addEventListener('touchstart', start, passive);
  feed.addEventListener('touchmove', move, { passive: false });
  feed.addEventListener('touchend', end, passive);
  feed.addEventListener('touchcancel', cancel, passive);
  return () => {
    disposed = true;
    cancel();
    for (const type of interruptions) doc.removeEventListener(type, cancel, capturePassive);
    view.removeEventListener('blur', cancel);
    feed.removeEventListener('touchstart', start);
    feed.removeEventListener('touchmove', move);
    feed.removeEventListener('touchend', end);
    feed.removeEventListener('touchcancel', cancel);
  };
}
