const moduleLoads = new WeakMap();
const emptyState = () => ({ bpm: 0, targetBpm: 0, candidateBpm: 0, position: 0, time: 0,
  rate: 0, confidence: 0, state: 'waiting', manual: false, history: new Float64Array(0) });

// Independent of render frames and active visualizer. Audio stays local in this graph.
export class BeatSession {
  constructor() {
    this.generation = 0;
    this.state = emptyState();
    this.graph = null;
    this.context = null;
    this.listeners = new Set();
  }
  notify() { for (const listener of this.listeners) listener(this.state); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
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
      graph.worker.terminate();
    }
    this.state = emptyState();
    this.notify();
  }
  async attach(session) {
    this.stop();
    if (!session) return;
    const generation = this.generation;
    const context = session.context;
    this.context = context;
    this.state = { ...emptyState(), state: 'starting' };
    this.notify();
    let node, worker;
    try {
      if (!context.audioWorklet) throw new Error('AudioWorklet is unavailable. Try a current desktop browser.');
      let load = moduleLoads.get(context);
      if (!load) {
        load = context.audioWorklet.addModule(new URL('./beat-worklet.js?v=groove-2', import.meta.url));
        moduleLoads.set(context, load);
        load.catch(() => moduleLoads.delete(context));
      }
      await load;
      if (generation !== this.generation) return;
      node = new AudioWorkletNode(context, 'ullhexa-groove-input', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      worker = new Worker(new URL('./beat-worker.js?v=groove-2', import.meta.url), { type: 'module' });
      const channel = new MessageChannel();
      worker.postMessage({ type: 'connect', rate: context.sampleRate / Math.round(context.sampleRate / 100), port: channel.port1 }, [channel.port1]);
      node.port.postMessage({ type: 'connect', port: channel.port2 }, [channel.port2]);
      worker.onmessage = event => {
        if (generation !== this.generation) return;
        this.state = { ...this.state, ...event.data };
        this.notify();
      };
      const fail = event => {
        if (generation !== this.generation) return;
        console.warn('BPM analysis:', event?.message || event?.type || 'processing failed');
        this.stop();
        this.state = { ...emptyState(), state: 'error', error: 'Beat analysis stopped. Restart the audio input to try again.' };
        this.notify();
      };
      worker.onerror = fail;
      node.onprocessorerror = fail;
      this.graph = { node, worker, source: session.source };
      session.source.connect(node);
      node.connect(context.destination);
      this.state.state = 'listening';
      this.notify();
    } catch (error) {
      if (node) {
        try { session.source.disconnect(node); } catch { /* graph may not have connected */ }
        node.port.postMessage({ type: 'stop' });
        node.port.close();
      }
      node?.disconnect();
      worker?.terminate();
      if (generation !== this.generation) return;
      this.graph = null;
      this.state = { ...emptyState(), state: 'error', error: error.message };
      this.notify();
    }
  }
  command(type, value) {
    if (!this.graph) return;
    this.graph.worker.postMessage({ type, value, time: this.context.currentTime });
  }
  read() {
    const state = this.state;
    const time = this.context?.currentTime ?? state.time;
    // Project the audio-clock position to the current display frame.
    const position = state.position + Math.max(0, time - state.time) * state.rate;
    return { ...state, position, phase: position - Math.floor(position) };
  }
}
