/**
 * The audio-thread half of waveform learning.
 *
 * Measuring the captured audio from an AnalyserNode read on requestAnimationFrame
 * had two faults that no amount of tuning fixes. Frames are throttled hard the
 * moment the tab is not in front, so a learn left running in the background
 * recorded almost nothing — and what it did record was stretched over the gap.
 * And a frame is 16 ms, which is twice a bucket, so every transient was already
 * flattened before it could be drawn.
 *
 * A worklet runs on the audio thread, which is never throttled and is handed
 * every block of 128 samples — 2.7 ms, a third of a bucket. Nothing is missed,
 * nothing is stretched, and an attack lands in the bucket it belongs to.
 *
 * Blocks are batched before crossing back so the main thread wakes ~16 times a
 * second rather than 375.
 */

/** Samples in a render quantum — fixed by the Web Audio spec. */
export const BLOCK_SAMPLES = 128;

/** Blocks per message: ~64 ms at 48 kHz. */
export const BLOCKS_PER_BATCH = 24;

/**
 * Where the calibration tone sits, as a bin of the 128-point transform the
 * worklet evaluates.
 *
 * Bin 40 of 128 at 48 kHz is 15 kHz: high enough that most adults will not hear
 * the burst and that music carries almost nothing there, low enough to survive
 * the capture path intact.
 */
export const TONE_BIN = 40;

/** Exact frequency of that bin at a given rate — the burst has to be generated
 *  at the frequency the detector is actually looking at, not near it. */
export function toneFrequency(sampleRate: number): number {
  return (TONE_BIN * sampleRate) / BLOCK_SAMPLES;
}

/** One block's worth of measurements, as the worklet posts them. */
export interface AudioBlockBatch {
  /** Context time at the start of the first block in the batch. */
  startTime: number;
  /** Seconds each block covers. */
  blockDuration: number;
  /** Loudest sample in each block — the waveform's body. */
  peak: Float32Array;
  /** High-passed level in each block — what attacks show up in. */
  hp: Float32Array;
  /** Level at the calibration frequency, for finding our own marker. */
  tone: Float32Array;
}

/**
 * Source of the worklet module.
 *
 * Inlined and loaded from a blob, the way the guitar input worklet is: a
 * separate file would have to be copied into `public/` by the build and served
 * from a path this hook would then have to know, for one small processor.
 */
export const WAVEFORM_WORKLET_CODE = `
/** One-pole high pass at roughly 1.3 kHz — bass carries a mix's amplitude,
 *  attacks carry its timing, and only the second one is worth drawing. */
const HP_COEFF = 0.85;

class WaveformListenerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.blocksPerBatch = opts.blocksPerBatch || ${BLOCKS_PER_BATCH};
    this.toneBin = opts.toneBin || ${TONE_BIN};
    this.filled = 0;
    this.batchStart = 0;
    this.peak = new Float32Array(this.blocksPerBatch);
    this.hp = new Float32Array(this.blocksPerBatch);
    this.tone = new Float32Array(this.blocksPerBatch);
    // The high pass carries across blocks, or every block boundary would ring
    // like an attack of its own.
    this.hpPrevIn = 0;
    this.hpPrevOut = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const left = input[0];
    if (!left || left.length === 0) return true;
    const right = input.length > 1 ? input[1] : null;
    const n = left.length;

    if (this.filled === 0) this.batchStart = currentTime;

    // Goertzel: the calibration tone's magnitude for two multiplies a sample,
    // which is the only affordable way to find our own marker inside music.
    const coeff = 2 * Math.cos((2 * Math.PI * this.toneBin) / n);
    let s1 = 0;
    let s2 = 0;

    let peak = 0;
    let hpSquares = 0;

    for (let i = 0; i < n; i += 1) {
      const sample = right ? (left[i] + right[i]) * 0.5 : left[i];
      const magnitude = sample < 0 ? -sample : sample;
      if (magnitude > peak) peak = magnitude;

      const hp = HP_COEFF * (this.hpPrevOut + sample - this.hpPrevIn);
      this.hpPrevIn = sample;
      this.hpPrevOut = hp;
      hpSquares += hp * hp;

      const s0 = sample + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }

    this.peak[this.filled] = peak;
    this.hp[this.filled] = Math.sqrt(hpSquares / n);
    this.tone[this.filled] = (2 / n) * Math.sqrt(Math.abs(s1 * s1 + s2 * s2 - coeff * s1 * s2));
    this.filled += 1;

    if (this.filled >= this.blocksPerBatch) {
      const peakOut = this.peak.slice(0, this.filled);
      const hpOut = this.hp.slice(0, this.filled);
      const toneOut = this.tone.slice(0, this.filled);
      this.port.postMessage(
        {
          startTime: this.batchStart,
          blockDuration: n / sampleRate,
          peak: peakOut,
          hp: hpOut,
          tone: toneOut,
        },
        [peakOut.buffer, hpOut.buffer, toneOut.buffer],
      );
      this.filled = 0;
    }

    return true;
  }
}

registerProcessor('waveform-listener', WaveformListenerProcessor);
`;
