import { describe, expect, it } from "vitest";

import { synthesize } from "../testing/synthAudio";
import { CHROMA_FPS, chromagram, fft, ONSET_FPS, onsetEnvelope, snapToOnset } from "./audioFeatures";

describe("fft", () => {
  it("finds a pure tone in the bin it belongs to, and comes back on inverse", () => {
    const n = 64;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i += 1) re[i] = Math.cos((2 * Math.PI * 5 * i) / n);
    const original = Float64Array.from(re);

    fft(re, im);
    expect(Math.hypot(re[5], im[5])).toBeCloseTo(n / 2, 6);
    expect(Math.hypot(re[6], im[6])).toBeCloseTo(0, 6);

    fft(re, im, true);
    for (let i = 0; i < n; i += 1) expect(re[i] / n).toBeCloseTo(original[i], 9);
  });
});

describe("onsetEnvelope", () => {
  // Hits at awkward, non-frame-aligned moments.
  const hits = [0.5137, 1.2011, 1.7774, 2.4452, 3.1006];
  const samples = synthesize(
    hits.map((sec, index) => ({ sec, midi: [52 + index * 3] })),
    3.8,
  );
  const onset = onsetEnvelope(samples);

  it("puts each attack's peak within a few milliseconds of the hit", () => {
    for (const sec of hits) {
      const found = snapToOnset({ sec, onset, onsetFps: ONSET_FPS, toleranceSec: 0.05 });
      expect(found).not.toBeNull();
      expect(Math.abs((found as number) - sec)).toBeLessThanOrEqual(0.006);
    }
  });

  it("stays quiet between the hits", () => {
    const between = snapToOnset({ sec: 0.85, onset, onsetFps: ONSET_FPS, toleranceSec: 0.1 });
    expect(between).toBeNull();
  });
});

describe("chromagram", () => {
  it("hears an A as an A", () => {
    const samples = synthesize([{ sec: 0.05, midi: [57] }], 0.6);
    const chroma = chromagram(samples);
    const frame = Math.round(0.2 * CHROMA_FPS);
    const row = Array.from(chroma.slice(frame * 12, frame * 12 + 12));
    expect(row.indexOf(Math.max(...row))).toBe(9);
  });
});
