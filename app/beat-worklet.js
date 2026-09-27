import { BeatFeatures } from './beat-features.js?v=groove-2';

class GrooveInputProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.features = new BeatFeatures(sampleRate);
    // Ten envelope frames per message. Buffers are returned by the analysis worker.
    this.pool = Array.from({ length: 4 }, () => new Float64Array(50));
    this.buffer = this.pool.pop();
    this.write = 0;
    this.transfer = [null];
    this.dataPort = null;
    this.running = true;
    this.port.onmessage = event => {
      if (event.data.type === 'stop') {
        this.running = false;
        this.dataPort?.close();
        return;
      }
      if (event.data.type !== 'connect') return;
      this.dataPort = event.data.port;
      this.dataPort.onmessage = message => { this.pool.push(new Float64Array(message.data)); };
      this.dataPort.start();
    };
  }
  process(inputs, outputs) {
    // A connected silent output keeps analysis scheduled; captured audio is never monitored.
    for (const channel of outputs[0]) channel.fill(0);
    if (!this.running) return false;
    const channels = inputs[0];
    const frames = outputs[0][0]?.length || 128;
    for (let i = 0; i < frames; i++) {
      if (!this.features.process(channels[0]?.[i] || 0, channels[1]?.[i] ?? channels[0]?.[i] ?? 0)) continue;
      if (!this.buffer) this.buffer = this.pool.pop();
      if (!this.buffer) continue;
      this.buffer[this.write++] = (currentFrame + i + 1) / sampleRate;
      this.buffer[this.write++] = this.features.strengths[0];
      this.buffer[this.write++] = this.features.strengths[1];
      this.buffer[this.write++] = this.features.strengths[2];
      this.buffer[this.write++] = this.features.rms;
      if (this.write === this.buffer.length) {
        this.write = 0;
        if (this.dataPort) {
          this.transfer[0] = this.buffer.buffer;
          this.dataPort.postMessage(this.buffer.buffer, this.transfer);
          this.buffer = this.pool.pop();
        }
      }
    }
    return true;
  }
}
registerProcessor('ullhexa-groove-input', GrooveInputProcessor);
