import { GrooveTracker } from '../bpm-detector.js?v=groove-2';
let tracker = null;
let dataPort = null;
let taps = [];

function publish(includeHistory = false) {
  const state = { ...tracker.snapshot(), tapCount: taps.length };
  if (includeHistory) state.history = tracker.orderedHistory();
  self.postMessage(state);
}

self.onmessage = event => {
  const message = event.data;
  if (message.type === 'connect') {
    tracker = new GrooveTracker({ rate: message.rate });
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
  if (message.type !== 'tap') taps = [];
  if (message.type === 'relearn') { tracker.reset(); taps = []; }
  if (message.type === 'hold') tracker.clock.setManual(message.value);
  if (message.type === 'multiply' && tracker.clock.bpm) {
    tracker.clock.setTempo(tracker.clock.targetBpm * message.value, time);
    tracker.clock.setManual(true);
  }
  if (message.type === 'tap') {
    if (taps.length && (time - taps.at(-1) > 2 || time - taps.at(-1) < 0.2)) taps = [];
    taps.push(time);
    if (taps.length > 7) taps.shift();
    if (taps.length >= 4) {
      const intervals = taps.slice(1).map((tap, i) => tap - taps[i]).sort((a, b) => a - b);
      const median = intervals[Math.floor(intervals.length / 2)];
      const consistent = intervals.filter(interval => Math.abs(interval - median) < median * 0.2);
      if (consistent.length >= 3) {
        const period = consistent.reduce((sum, value) => sum + value, 0) / consistent.length;
        tracker.clock.setTempo(60 / period, time, true);
        tracker.clock.setManual(true);
      }
    }
  }
  publish();
};
