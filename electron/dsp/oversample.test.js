import { describe, expect, it } from "vitest";

import { Oversampler2x } from "./oversample";

function hardClip(x, gain) {
  const driven = x * gain;
  return Math.max(-1, Math.min(1, driven));
}

// Single-frequency magnitude probe (Goertzel-style correlation) — enough to
// compare "how much energy landed at this frequency" between two signals
// without needing a full FFT.
function magnitudeAt(signal, freq, sr) {
  let sumCos = 0;
  let sumSin = 0;
  for (let n = 0; n < signal.length; n++) {
    const w = (2 * Math.PI * freq * n) / sr;
    sumCos += signal[n] * Math.cos(w);
    sumSin += signal[n] * Math.sin(w);
  }
  return Math.sqrt(sumCos * sumCos + sumSin * sumSin) / signal.length;
}

describe("Oversampler2x", () => {
  const sr = 48000;

  it("stays close to a direct passthrough for a linear (non-clipping) shape", () => {
    const os = new Oversampler2x(sr, (x, gain) => x * gain);
    for (let i = 0; i < 200; i++) os.process(0.3 * Math.sin(i * 0.1), 1); // settle the filter
    let maxDiff = 0;
    for (let i = 200; i < 400; i++) {
      const x = 0.3 * Math.sin(i * 0.1);
      const y = os.process(x, 1);
      maxDiff = Math.max(maxDiff, Math.abs(y - x));
    }
    expect(maxDiff).toBeLessThan(0.05);
  });

  it("cuts aliased energy from a hard-clipped high-frequency tone vs. no oversampling", () => {
    const f0 = 18000; // 75% of the Nyquist — high enough that clipping harmonics fold back
    const gain = 15;
    const aliasFreq = 6000; // |3*f0 - sr| == 6000: where the 3rd harmonic aliases to at sr=48000
    const N = 8000;

    const os = new Oversampler2x(sr, hardClip);
    const oversampled = new Array(N);
    const naive = new Array(N);
    for (let i = 0; i < N; i++) {
      const x = Math.sin((2 * Math.PI * f0 * i) / sr);
      oversampled[i] = os.process(x, gain);
      naive[i] = hardClip(x, gain);
    }

    const aliasWithOS = magnitudeAt(oversampled, aliasFreq, sr);
    const aliasNaive = magnitudeAt(naive, aliasFreq, sr);
    expect(aliasWithOS).toBeLessThan(aliasNaive * 0.5);
  });

  it("keeps a heavily overdriven signal bounded and finite", () => {
    const os = new Oversampler2x(sr, hardClip);
    let maxAbs = 0;
    for (let i = 0; i < 5000; i++) {
      const y = os.process(Math.sin((2 * Math.PI * 5000 * i) / sr), 20);
      expect(Number.isFinite(y)).toBe(true);
      maxAbs = Math.max(maxAbs, Math.abs(y));
    }
    expect(maxAbs).toBeLessThanOrEqual(1);
  });

  it("reset() clears interpolation and filter state", () => {
    const os = new Oversampler2x(sr, hardClip);
    for (let i = 0; i < 100; i++) os.process(1, 20);
    os.reset();
    expect(os.prevIn).toBe(0);
    expect(os.z1).toBe(0);
    expect(os.z2).toBe(0);
  });
});
