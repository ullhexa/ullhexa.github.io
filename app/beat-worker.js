import { GrooveTracker } from '../bpm-detector.js?v=groove-4';
let tracker = null;
let dataPort = null;
let timer = null;

function publish(includeHistory = false) {
  const state = tracker.snapshot();
  if (includeHistory) state.history = tracker.orderedHistory();
  self.postMessage(state);
}
function stopTimer() { if (timer != null) clearInterval(timer); timer = null; }
self.onmessage = event => {
  const message = event.data;
  if (message.type === 'init') {
    tracker = new GrooveTracker({ rate: message.rate || 100 });
    tracker.clock.advance(message.time || 0);
    // Tapping also works before audio is chosen. Audio packets take over the
    // scheduling as soon as capture connects; there is still only one clock.
    if (typeof setInterval === 'function') {
      const offset = (message.time || 0) - performance.now() / 1000;
      stopTimer();
      timer = setInterval(() => { tracker.clock.advance(performance.now() / 1000 + offset); publish(); }, 100);
    }
    publish();
    return;
  }
  if (message.type === 'connect') {
    stopTimer();
    if (!tracker) tracker = new GrooveTracker({ rate: message.rate });
    dataPort?.close?.();
    dataPort = message.port;
    dataPort.onmessage = packet => {
      const frames = new Float64Array(packet.data);
      for (let i = 0; i < frames.length; i += 5) tracker.push(frames[i], frames[i + 1], frames[i + 2], frames[i + 3], frames[i + 4]);
      dataPort.postMessage(frames.buffer, [frames.buffer]);
      publish(true);
    };
    dataPort.start();
    return;
  }
  if (!tracker) return;
  const time = Number.isFinite(message.time) ? message.time : tracker.lastFrame || 0;
  if (message.type === 'rebase') { stopTimer(); tracker.rebase(message.delta, message.rate); }
  if (message.type === 'relearn') tracker.reset();
  if (message.type === 'multiply') tracker.multiply(message.value, time);
  if (message.type === 'tap') tracker.tap(time);
  publish();
};
