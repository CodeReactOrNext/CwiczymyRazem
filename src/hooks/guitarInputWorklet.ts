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
// 2048-sample buffers and posts them to the main thread for aubio processing.
// With a decimation factor above 1 every `factor` input samples are averaged
// into one first (a crude low-pass, enough for guitar content well below the
// new Nyquist).
export const GUITAR_INPUT_WORKLET_CODE = `
class GuitarInputProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._buf = new Float32Array(2048);
    this._pos = 0;
    this._factor = options?.processorOptions?.decimation || 1;
    this._acc = 0;
    this._n = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this._acc += ch[i];
      if (++this._n < this._factor) continue;
      this._buf[this._pos++] = this._acc / this._factor;
      this._acc = 0;
      this._n = 0;
      if (this._pos === 2048) {
        this.port.postMessage(this._buf.slice());
        this._pos = 0;
      }
    }
    return true;
  }
}
registerProcessor('guitar-input-processor', GuitarInputProcessor);
`;
