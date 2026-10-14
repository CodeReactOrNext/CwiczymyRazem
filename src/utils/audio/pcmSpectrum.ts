import type { Spectrum } from "./chordTones";
import { SPECTRUM_TOP_HZ } from "./chordTones";
import { createFft } from "./fft";

// Chords are graded on a magnitude spectrum (chordTones.ts). The web path reads
// it off its AnalyserNode; the desktop's native capture has no Web Audio graph,
// so it computes the same spectrum straight from the PCM it already receives —
// otherwise no chord could ever be graded as a hit there.

/** The web path's AnalyserNode: 8192 samples at 48 kHz, ~170 ms of audio. */
const WEB_FFT_SIZE = 8192;
const WEB_SAMPLE_RATE = 48000;

/**
 * The FFT size spanning the same ~170 ms the web analyser does, at the rate the
 * audio interface actually runs (44.1, 48, 96 kHz…), as a power of two.
 */
export const pcmSpectrumFftSize = (sampleRate: number): number => {
  const exponent = Math.round(
    Math.log2((sampleRate * WEB_FFT_SIZE) / WEB_SAMPLE_RATE),
  );
  return 2 ** Math.min(15, Math.max(11, exponent));
};

/** The Blackman window AnalyserNode applies (Web Audio spec, α = 0.16). */
const blackmanWindow = (size: number): Float64Array => {
  const taper = new Float64Array(size);
  for (let n = 0; n < size; n++) {
    const phase = (2 * Math.PI * n) / size;
    taper[n] = 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase);
  }
  return taper;
};

export interface PcmSpectrum {
  /** Appends freshly captured samples, in any block size. */
  push(samples: Float32Array): void;
  /** Spectrum of the most recent ~170 ms up to SPECTRUM_TOP_HZ, or null before
   *  any audio and over digital silence. Computed lazily and at most once per
   *  push, so reading it every frame costs one FFT per captured block at most. */
  read(): Spectrum | null;
}

/** A rolling spectrum over captured PCM, matching the web path's analyser. */
export function createPcmSpectrum(sampleRate: number): PcmSpectrum {
  const size = pcmSpectrumFftSize(sampleRate);
  const binHz = sampleRate / size;
  const bins = Math.min(size / 2, Math.ceil(SPECTRUM_TOP_HZ / binHz) + 1);
  const ring = new Float32Array(size);
  const taper = blackmanWindow(size);
  const fft = createFft(size);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let writePos = 0;
  let dirty = false;
  let latest: Spectrum | null = null;

  return {
    push(samples) {
      // Only the last `size` samples can ever be read back.
      for (
        let i = Math.max(0, samples.length - size);
        i < samples.length;
        i++
      ) {
        ring[writePos] = samples[i];
        if (++writePos === size) writePos = 0;
      }
      if (samples.length > 0) dirty = true;
    },
    read() {
      if (!dirty) return latest;
      dirty = false;
      // Oldest sample first, so the window tapers both ends of the stretch.
      for (let i = 0; i < size; i++) {
        const sample = ring[(writePos + i) % size];
        re[i] = sample * taper[i];
        im[i] = 0;
      }
      fft(re, im);
      // A fresh array each time: whoever holds the last reading keeps it intact.
      const magnitudes = new Float32Array(bins);
      let loudest = 0;
      for (let i = 0; i < bins; i++) {
        magnitudes[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
        if (magnitudes[i] > loudest) loudest = magnitudes[i];
      }
      latest = loudest < 1e-9 ? null : { magnitudes, binHz };
      return latest;
    },
  };
}
