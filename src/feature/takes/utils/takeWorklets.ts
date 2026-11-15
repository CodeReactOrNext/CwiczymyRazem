/**
 * The two audio-thread halves of take recording, as source: a worklet has to be
 * loaded from a URL, and a Blob made from a string is the one that needs no
 * extra file in the build (same approach as backingTrack's waveformWorklet).
 *
 * Both stamp audio on the wall clock with Date.now(), which is what the audio
 * engine — another process — stamps the guitar with. That shared clock is how
 * two recordings made on two different audio clocks are lined up afterwards.
 */

/** Frames the capture worklet hands over at a time: 85 ms at 48 kHz. */
export const CAPTURE_CHUNK_FRAMES = 4096;

/**
 * "take-capture": copies its stereo input out in chunks.
 *
 * Messages out: { pcm: Float32Array (interleaved, transferred), frames } per
 * chunk, and after a "stop" message in: the last partial chunk followed by
 * { done: true, frames, startMs } — startMs being when the first sample
 * recorded passed through the graph. With processorOptions.armed === false
 * it records nothing until a "start" message — for a recording that has to
 * begin together with something else.
 */
export const TAKE_CAPTURE_WORKLET = `
class TakeCapture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunkFrames = options.processorOptions.chunkFrames;
    this.held = new Float32Array(this.chunkFrames * 2);
    this.fill = 0;
    this.frames = 0;
    this.startMs = Infinity;
    this.stopped = false;
    this.armed = options.processorOptions.armed !== false;
    this.port.onmessage = (event) => {
      if (event.data === "start") this.armed = true;
      if (event.data !== "stop" || this.stopped) return;
      this.stopped = true;
      this.flush();
      this.port.postMessage({ done: true, frames: this.frames, startMs: this.startMs });
    };
  }
  flush() {
    if (this.fill === 0) return;
    const pcm = this.held.slice(0, this.fill * 2);
    this.port.postMessage({ pcm, frames: this.fill }, [pcm.buffer]);
    this.fill = 0;
  }
  process(inputs) {
    if (this.stopped) return false;
    if (!this.armed) return true;
    const input = inputs[0];
    const left = input && input[0];
    const n = left ? left.length : 128;
    const right = input && input[1] ? input[1] : left;
    let i = 0;
    while (i < n) {
      const take = Math.min(n - i, this.chunkFrames - this.fill);
      for (let k = 0; k < take; k++) {
        // No input connected yet is silence, not a gap: the clock keeps running.
        this.held[(this.fill + k) * 2] = left ? left[i + k] : 0;
        this.held[(this.fill + k) * 2 + 1] = right ? right[i + k] : 0;
      }
      this.fill += take;
      i += take;
      if (this.fill === this.chunkFrames) this.flush();
    }
    this.frames += n;
    // Blocks are rendered in bursts, each a little ahead of when it plays; the
    // earliest start any of them implies is the steadiest reading there is.
    const impliedStart = Date.now() - (this.frames / sampleRate) * 1000;
    if (impliedStart < this.startMs) this.startMs = impliedStart;
    return true;
  }
}
registerProcessor("take-capture", TakeCapture);
`;

/**
 * "take-guitar": plays the guitar the audio engine sends into the graph a
 * video take is mixed in.
 *
 * The guitar arrives in batches over two process boundaries, unevenly. Each
 * batch says when it reached the engine, so it is played exactly
 * processorOptions.transitMs after that — late enough for every batch to have
 * landed, and by a known amount, which is what lets the backing be held back
 * to match. Whenever playback has to restart (nothing arrived in time, or the
 * window stalled and a pile built up) it goes back to that same schedule
 * rather than to wherever the queue happens to be.
 *
 * Messages in: { pcm: Float32Array (interleaved), sampleRate, endWallMs }.
 */
export const TAKE_GUITAR_WORKLET = `
class TakeGuitar extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.transitMs = options.processorOptions.transitMs;
    this.queue = [];
    this.pos = 0;
    this.playing = false;
    // This graph's clock on the wall clock, read the way "take-capture" reads
    // it — blocks are rendered in bursts ahead of when they play, so one
    // block's Date.now() says little; the earliest reading over many is steady,
    // and it is the same reading the backing's start is taken from.
    this.frames = 0;
    this.clockMs = Infinity;
    this.warmFrames = Math.round(sampleRate * 0.2);
    this.port.onmessage = (event) => {
      const { pcm, sampleRate: rate, endWallMs } = event.data;
      const frames = pcm.length >> 1;
      if (frames === 0 || !(rate > 0)) return;
      this.queue.push({ pcm, frames, rate, startWallMs: endWallMs - (frames / rate) * 1000 });
      // More than a second waiting means the window stalled: start over on schedule.
      if (this.queue.length > 1 && endWallMs - this.queue[0].startWallMs > this.transitMs + 1000) this.playing = false;
    };
  }
  /** Lines the queue up with the clock; returns the output frame to start at, or -1 to wait. */
  start(n) {
    // Not before the clock reading has settled.
    if (this.frames < this.warmFrames) return -1;
    const nowMs = this.clockMs + ((this.frames - n) / sampleRate) * 1000;
    while (this.queue.length > 0) {
      const chunk = this.queue[0];
      const waitFrames = Math.round(((chunk.startWallMs + this.transitMs - nowMs) / 1000) * sampleRate);
      if (waitFrames >= n) return -1;
      if (waitFrames >= 0) {
        this.pos = 0;
        return waitFrames;
      }
      // Already due: skip the part of it whose moment has passed.
      const skip = (-waitFrames * chunk.rate) / sampleRate;
      if (skip < chunk.frames) {
        this.pos = skip;
        return 0;
      }
      this.queue.shift();
    }
    return -1;
  }
  process(_inputs, outputs) {
    const out = outputs[0];
    const left = out[0];
    const right = out[1] || out[0];
    const n = left.length;
    this.frames += n;
    const implied = Date.now() - (this.frames / sampleRate) * 1000;
    if (implied < this.clockMs) this.clockMs = implied;
    let i = 0;
    if (!this.playing) {
      i = this.start(n);
      if (i < 0) return true;
      this.playing = true;
    }
    for (; i < n; i++) {
      let chunk = this.queue[0];
      while (chunk && this.pos >= chunk.frames) {
        this.pos -= chunk.frames;
        this.queue.shift();
        chunk = this.queue[0];
      }
      if (!chunk) {
        this.playing = false;
        this.pos = 0;
        return true;
      }
      const a = Math.floor(this.pos);
      const b = Math.min(a + 1, chunk.frames - 1);
      const t = this.pos - a;
      left[i] = chunk.pcm[a * 2] * (1 - t) + chunk.pcm[b * 2] * t;
      right[i] = chunk.pcm[a * 2 + 1] * (1 - t) + chunk.pcm[b * 2 + 1] * t;
      this.pos += chunk.rate / sampleRate;
    }
    return true;
  }
}
registerProcessor("take-guitar", TakeGuitar);
`;

/** The pitch the capture's latency is measured with: near the top of hearing, where music has almost nothing. */
export const LATENCY_PROBE_HZ = 15_000;

/**
 * "take-latency-probe": how much of LATENCY_PROBE_HZ each block of its input
 * holds (Goertzel). Messages out, one a block: { t, level } — the block's
 * context time and the tone's level in it.
 */
export const TAKE_LATENCY_PROBE_WORKLET = `
class TakeLatencyProbe extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.coeff = 2 * Math.cos((2 * Math.PI * options.processorOptions.hz) / sampleRate);
  }
  process(inputs) {
    const x = inputs[0] && inputs[0][0];
    if (!x) return true;
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < x.length; i++) {
      const s0 = x[i] + this.coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    const power = s1 * s1 + s2 * s2 - this.coeff * s1 * s2;
    this.port.postMessage({ t: currentTime, level: Math.sqrt(Math.max(0, power)) / x.length });
    return true;
  }
}
registerProcessor("take-latency-probe", TakeLatencyProbe);
`;
