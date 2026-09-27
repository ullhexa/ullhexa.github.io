export function stopTracks(stream) {
  stream?.getTracks().forEach(track => track.stop());
}

// Owns capture requests and graph nodes for one page. A cancelled or superseded
// permission request may still resolve; its stream must never become active.
export class AudioInputSession {
  constructor({ createContext = () => new (window.AudioContext || window.webkitAudioContext)(), onChange = () => {}, onPending = () => {} } = {}) {
    this.createContext = createContext;
    this.onChange = onChange;
    this.onPending = onPending;
    this.context = null;
    this.current = null;
    this.pendingType = null;
    this.generation = 0;
  }

  release(session) {
    if (!session) return;
    for (const track of session.stream.getTracks()) track.removeEventListener("ended", session.onEnded);
    session.source.disconnect();
    session.analyser.disconnect();
    stopTracks(session.stream);
  }

  async start(type, requestStream) {
    const generation = ++this.generation;
    this.pendingType = type;
    this.onPending(type);
    let stream, source, analyser;
    try {
      // Keep the browser's capture request in the original click's call stack.
      stream = await requestStream();
      if (generation !== this.generation) { stopTracks(stream); return null; }
      if (!stream.getAudioTracks().some(track => track.readyState === "live")) {
        const error = new Error("The selected source did not provide live audio.");
        error.name = "NoAudioError";
        throw error;
      }
      if (!this.context || this.context.state === "closed") this.context = this.createContext();
      if (this.context.state !== "running") await this.context.resume();
      if (generation !== this.generation) { stopTracks(stream); return null; }
      if (this.context.state !== "running") {
        const error = new Error("The browser's audio context is not running.");
        error.name = "AudioContextError";
        throw error;
      }
      if (!stream.getAudioTracks().some(track => track.readyState === "live")) {
        const error = new Error("The selected audio source ended before it connected.");
        error.name = "NoAudioError";
        throw error;
      }
      source = this.context.createMediaStreamSource(stream);
      analyser = this.context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      const session = { type, stream, source, analyser, context: this.context };
      session.onEnded = () => {
        if (this.current !== session) return;
        this.current = null;
        this.release(session);
        this.onChange(null);
      };
      for (const track of stream.getTracks()) track.addEventListener("ended", session.onEnded);
      this.release(this.current);
      this.current = session;
      this.onChange(session);
      return session;
    } catch (error) {
      source?.disconnect();
      analyser?.disconnect();
      stopTracks(stream);
      if (generation === this.generation) throw error;
      return null;
    } finally {
      if (generation === this.generation) {
        this.pendingType = null;
        this.onPending(null);
      }
    }
  }

  stop() {
    ++this.generation;
    this.pendingType = null;
    const previous = this.current;
    this.current = null;
    this.release(previous);
    this.onChange(null);
    this.onPending(null);
  }

  async dispose() {
    this.stop();
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }
}

export function isSafari(userAgent) {
  return /Version\/[\d.]+.*Safari\//.test(userAgent)
    && !/Chrome|Chromium|CriOS|Edg|OPR|OPiOS|FxiOS|Android/i.test(userAgent);
}
