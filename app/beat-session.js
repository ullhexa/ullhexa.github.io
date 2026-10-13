const moduleLoads = new WeakMap();
const emptyState = () => ({ bpm: 0, targetBpm: 0, candidateBpm: 0, position: 0, time: 0,
  rate: 0, confidence: 0, state: 'waiting', manual: false, guideBpm: 0, tapCount: 0,
  bandSupport: [0, 0, 0], history: new Float64Array(0) });

// Independent of render frames and active visualizer. Audio stays local.
export class BeatSession {
  constructor() {
    this.generation = 0;
    this.state = emptyState();
    this.graph = this.worker = this.context = null;
    this.listeners = new Set();
  }
  now() { return this.context?.currentTime ?? performance.now() / 1000; }
  notify() { for (const listener of this.listeners) listener(this.state); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  ensureWorker(rate = 100) {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL('./beat-worker.js?v=groove-4', import.meta.url), { type: 'module' });
    this.worker = worker;
    worker.onmessage = event => {
      if (worker !== this.worker) return;
      this.state = { ...this.state, ...event.data };
      this.notify();
    };
    worker.onerror = event => { if (worker === this.worker) this.fail(event); };
    worker.postMessage({ type: 'init', rate, time: this.now() });
    return worker;
  }
  fail(event) {
    console.warn('BPM analysis:', event?.message || event?.type || 'processing failed');
    this.stop();
    this.state = { ...emptyState(), state: 'error', error: 'Beat analysis stopped. Restart the audio input to try again.' };
    this.notify();
  }
  stop() {
    ++this.generation;
    const graph = this.graph;
    this.graph = null;
    this.context = null;
    if (graph) {
      try { graph.source.disconnect(graph.node); } catch { /* capture may already be disconnected */ }
      graph.node.disconnect();
      graph.node.port.postMessage({ type: 'stop' });
      graph.node.port.close();
    }
    this.worker?.terminate();
    this.worker = null;
    this.state = emptyState();
    this.notify();
  }
  async attach(session) {
    if (!session) { this.stop(); return; }
    if (this.graph) this.stop();
    else ++this.generation;
    const generation = this.generation;
    const context = session.context;
    this.state = { ...this.state, state: 'starting' };
    this.notify();
    let node;
    try {
      if (!context.audioWorklet) throw new Error('AudioWorklet is unavailable. Try a current desktop browser.');
      let load = moduleLoads.get(context);
      if (!load) {
        load = context.audioWorklet.addModule(new URL('./beat-worklet.js?v=groove-4', import.meta.url));
        moduleLoads.set(context, load);
        load.catch(() => moduleLoads.delete(context));
      }
      await load;
      if (generation !== this.generation) return;
      const previousTime = this.now(), existingWorker = this.worker;
      this.context = context;
      const rate = context.sampleRate / Math.round(context.sampleRate / 100);
      const worker = this.ensureWorker(rate);
      if (existingWorker) worker.postMessage({ type: 'rebase', delta: this.now() - previousTime, rate });
      node = new AudioWorkletNode(context, 'ullhexa-groove-input', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      const channel = new MessageChannel();
      worker.postMessage({ type: 'connect', rate, port: channel.port1 }, [channel.port1]);
      node.port.postMessage({ type: 'connect', port: channel.port2 }, [channel.port2]);
      node.onprocessorerror = event => { if (generation === this.generation) this.fail(event); };
      this.graph = { node, worker, source: session.source };
      session.source.connect(node);
      node.connect(context.destination);
      this.state.state = this.state.guideBpm ? 'guided' : 'listening';
      this.notify();
    } catch (error) {
      if (node) {
        try { session.source.disconnect(node); } catch { /* graph may not have connected */ }
        node.port.postMessage({ type: 'stop' });
        node.port.close();
        node.disconnect();
      }
      if (generation !== this.generation) return;
      this.stop();
      this.state = { ...emptyState(), state: 'error', error: error.message };
      this.notify();
    }
  }
  command(type, value, eventTime) {
    if (type === 'relearn' && !this.worker) { this.state = emptyState(); this.notify(); return; }
    if (type !== 'tap' && !this.worker) return;
    const worker = this.ensureWorker();
    const age = (performance.now() - eventTime) / 1000;
    const time = this.now() - (Number.isFinite(age) && age >= 0 && age < 1 ? age : 0);
    worker.postMessage({ type, value, time });
  }
  read() {
    const state = this.state;
    const time = this.context?.currentTime ?? (this.worker ? this.now() : state.time);
    const position = state.position + Math.max(0, time - state.time) * state.rate;
    return { ...state, position, phase: position - Math.floor(position) };
  }
}
