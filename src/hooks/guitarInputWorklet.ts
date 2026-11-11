/** The rate the guitar DSP is tuned for: aubio's fixed 2048-sample window has to
 *  hold a few periods of low E (82 Hz), which it does at 44.1/48 kHz but not at
 *  the 96–192 kHz some interfaces (e.g. Arturia Minifuse) run at. */
export const ANALYSIS_SAMPLE_RATE = 48000;

/**
 * How many input samples the worklet averages into one analysis sample: 1 at
 * 44.1/48 kHz, 2 at 88.2/96 kHz, 4 at 176.4/192 kHz.
 *
 * Done by hand instead of asking for `new AudioContext({ sampleRate: 48000 })`,
 * because browsers don't reliably resample the microphone into a context running
 * at a rate other than the device's: Firefox refuses to connect it at all, and
 * Safari can hand over 44.1 kHz samples to a 48 kHz context, which reads every
 * pitch ~150¢ sharp (the tuner then tunes a guitar down to roughly D).
 */
export function getDecimationFactor(sampleRate: number): number {
  return Math.max(1, Math.round(sampleRate / ANALYSIS_SAMPLE_RATE));
}

// Runs in AudioWorkletGlobalScope — accumulates 128-sample quanta into
// 2048-sample buffers and posts them, stamped with the time the last sample
// arrived, for aubio processing (see guitarDspClient.ts). The stamp is taken
// here, on the audio thread: whoever processes the window may be running late,
// and an attack dated by when it was worked out reads as played late.
// With a decimation factor above 1 every `factor` input samples are averaged
// into one first (a crude low-pass, enough for guitar content well below the
// new Nyquist).
//
// An interface arrives as one channel per jack, and the guitar is not always in
// the first: a Scarlett Solo's instrument jack is input 2, which reading only
// channel 0 heard as silence. So the processor follows the channel that carries
// signal — the loudest one, switched only when another is clearly louder (4× the
// power, ~6 dB, and above the noise) so two live inputs don't trade places on
// every note. A message { channel: n } pins it to one jack, { channel: -1 }
// hands it back. It reports { type: "channels", count, active } whenever the
// channel count or the channel being read changes.
export interface GuitarInputChannelsMessage {
  type: "channels";
  /** Channels the input delivers. */
  count: number;
  /** 0-based channel being read. */
  active: number;
}

/** One captured analysis window. */
export interface GuitarInputSamplesMessage {
  type: "samples";
  samples: Float32Array;
  /** Date.now() when the window's last sample arrived. */
  timeMs: number;
}

export const GUITAR_INPUT_WORKLET_CODE = `
const SWITCH_RATIO = 4;
const MIN_SWITCH_POWER = 1e-7;
const POWER_SMOOTHING = 0.95;
class GuitarInputProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._buf = new Float32Array(2048);
    this._pos = 0;
    this._factor = options?.processorOptions?.decimation || 1;
    this._acc = 0;
    this._n = 0;
    this._power = [];
    this._active = 0;
    this._manual = -1;
    this._count = 0;
    this.port.onmessage = (event) => {
      const channel = event.data?.channel;
      if (typeof channel === 'number') this._manual = channel;
    };
  }
  _pick(channels) {
    const count = channels.length;
    for (let c = 0; c < count; c++) {
      const data = channels[c];
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const power = data.length ? sum / data.length : 0;
      this._power[c] = (this._power[c] || 0) * POWER_SMOOTHING + power * (1 - POWER_SMOOTHING);
    }
    let next = this._active < count ? this._active : 0;
    if (this._manual >= 0) {
      next = Math.min(this._manual, count - 1);
    } else {
      for (let c = 0; c < count; c++) {
        if (this._power[c] > MIN_SWITCH_POWER && this._power[c] > this._power[next] * SWITCH_RATIO) next = c;
      }
    }
    if (next !== this._active || count !== this._count) {
      this._active = next;
      this._count = count;
      this.port.postMessage({ type: 'channels', count, active: next });
    }
    return channels[next];
  }
  process(inputs) {
    const channels = inputs[0];
    if (!channels || channels.length === 0) return true;
    const ch = this._pick(channels);
    for (let i = 0; i < ch.length; i++) {
      this._acc += ch[i];
      if (++this._n < this._factor) continue;
      this._buf[this._pos++] = this._acc / this._factor;
      this._acc = 0;
      this._n = 0;
      if (this._pos === 2048) {
        const samples = this._buf.slice();
        this.port.postMessage({ type: 'samples', samples, timeMs: Date.now() }, [samples.buffer]);
        this._pos = 0;
      }
    }
    return true;
  }
}
registerProcessor('guitar-input-processor', GuitarInputProcessor);
`;
