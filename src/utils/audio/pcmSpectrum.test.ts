import { describe, expect, it } from "vitest";

import type { Spectrum } from "./chordTones";
import {
  CHORD_TONE_HIT,
  isChordToneSounding,
  spectrumFromAnalyser,
} from "./chordTones";
import { createPcmSpectrum, pcmSpectrumFftSize } from "./pcmSpectrum";

const RATE = 48000;

/** A plucked string: fundamental plus decaying harmonics. */
const pluck = (
  freq: number,
  sampleRate: number,
  length: number,
): Float32Array => {
  const buf = new Float32Array(length);
  for (let n = 0; n < length; n++) {
    let s = 0;
    for (let h = 1; h <= 4; h++)
      s += Math.sin((2 * Math.PI * freq * h * n) / sampleRate) / h;
    buf[n] = 0.1 * s;
  }
  return buf;
};

/** D/A on the top three strings, as in "Chords — D Triads": A3, D4, F#4. */
const D_TRIAD = [220, 293.66, 369.99];
const dTriad = (sampleRate: number, length: number) => {
  const out = new Float32Array(length);
  for (const f of D_TRIAD) {
    const string = pluck(f, sampleRate, length);
    for (let i = 0; i < length; i++) out[i] += string[i];
  }
  return out;
};

/** The same samples as the web analyser would see them: Blackman-windowed
 *  magnitudes, here by a plain DFT, handed over in dB. */
const fakeAnalyser = (
  samples: Float32Array,
  sampleRate: number,
): AnalyserNode => {
  const size = samples.length;
  return {
    fftSize: size,
    context: { sampleRate },
    getFloatFrequencyData: (out: Float32Array) => {
      out.fill(-Infinity);
      const lastBin = Math.ceil(2000 / (sampleRate / size)) + 1;
      for (let k = 0; k <= lastBin; k++) {
        let re = 0;
        let im = 0;
        for (let n = 0; n < size; n++) {
          const phase = (2 * Math.PI * n) / size;
          const w = 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase);
          re += samples[n] * w * Math.cos(phase * k);
          im -= samples[n] * w * Math.sin(phase * k);
        }
        out[k] = 20 * Math.log10(Math.sqrt(re * re + im * im) / size);
      }
    },
  } as unknown as AnalyserNode;
};

const normalised = ({ magnitudes }: Spectrum) => {
  const top = Math.max(...magnitudes);
  return Array.from(magnitudes, (m) => m / top);
};

describe("pcmSpectrumFftSize", () => {
  it("spans the web analyser's ~170 ms at any interface rate", () => {
    expect(pcmSpectrumFftSize(48000)).toBe(8192);
    expect(pcmSpectrumFftSize(44100)).toBe(8192);
    expect(pcmSpectrumFftSize(96000)).toBe(16384);
    expect(pcmSpectrumFftSize(192000)).toBe(32768);
  });
});

describe("createPcmSpectrum", () => {
  it("reads the same spectrum the web analyser does for the same audio", () => {
    const samples = dTriad(RATE, 8192);
    const pcm = createPcmSpectrum(RATE);
    pcm.push(samples);
    const fromPcm = pcm.read()!;
    const fromAnalyser = spectrumFromAnalyser(fakeAnalyser(samples, RATE));
    expect(fromPcm.binHz).toBe(fromAnalyser.binHz);
    expect(fromPcm.magnitudes.length).toBe(fromAnalyser.magnitudes.length);
    const a = normalised(fromPcm);
    const b = normalised(fromAnalyser);
    for (let k = 1; k < a.length; k++) expect(a[k]).toBeCloseTo(b[k], 4);
  });

  it("finds every tone of a chord at the interface's own rate", () => {
    for (const rate of [44100, 48000, 96000]) {
      const pcm = createPcmSpectrum(rate);
      pcm.push(dTriad(rate, pcmSpectrumFftSize(rate)));
      const heard = pcm.read()!;
      for (const f of D_TRIAD)
        expect(isChordToneSounding(heard, f, CHORD_TONE_HIT)).toBe(true);
    }
  });

  it("follows the most recent audio, block by block", () => {
    const C5 = 523.25; // in none of the triad's notes or their harmonics
    const pcm = createPcmSpectrum(RATE);
    pcm.push(pluck(C5, RATE, 8192));
    expect(isChordToneSounding(pcm.read()!, C5, CHORD_TONE_HIT)).toBe(true);
    // A whole window of the next chord, in 256-sample native blocks.
    const next = dTriad(RATE, 8192);
    for (let i = 0; i < next.length; i += 256)
      pcm.push(next.subarray(i, i + 256));
    const heard = pcm.read()!;
    expect(isChordToneSounding(heard, C5, CHORD_TONE_HIT)).toBe(false);
    for (const f of D_TRIAD)
      expect(isChordToneSounding(heard, f, CHORD_TONE_HIT)).toBe(true);
  });

  it("has nothing to read before any audio and over digital silence", () => {
    const pcm = createPcmSpectrum(RATE);
    expect(pcm.read()).toBeNull();
    pcm.push(new Float32Array(8192));
    expect(pcm.read()).toBeNull();
  });

  it("computes once per push and never rewrites a reading it handed out", () => {
    const pcm = createPcmSpectrum(RATE);
    pcm.push(pluck(440, RATE, 8192));
    const first = pcm.read()!;
    expect(pcm.read()).toBe(first);
    const before = Array.from(first.magnitudes);
    pcm.push(dTriad(RATE, 8192));
    expect(pcm.read()).not.toBe(first);
    expect(Array.from(first.magnitudes)).toEqual(before);
  });
});
