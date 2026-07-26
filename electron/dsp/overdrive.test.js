import { describe, expect, it } from "vitest";

import { Overdrive } from "./overdrive";

describe("Overdrive", () => {
  it("is a pure passthrough when mix=0 (pedal bypassed)", () => {
    const od = new Overdrive(48000);
    od.setParams({ drive: 1, tone: 1, level: 1, mix: 0 });
    expect(od.process(0.4)).toBeCloseTo(0.4, 6);
  });

  it("clips symmetrically, unlike the amp's asymmetric tanh drive", () => {
    const od = new Overdrive(48000);
    od.setParams({ drive: 0.8, tone: 1, level: 0.5, mix: 1 });
    let maxPos = 0;
    let maxNegAbs = 0;
    for (let i = 0; i < 2000; i++) {
      const x = 0.5 * Math.sin((2 * Math.PI * 300 * i) / 48000);
      const y = od.process(x);
      if (i > 1500) {
        maxPos = Math.max(maxPos, y);
        maxNegAbs = Math.max(maxNegAbs, -y);
      }
    }
    expect(maxPos).toBeCloseTo(maxNegAbs, 3);
  });

  it("stays bounded and finite across the full drive/level range", () => {
    const od = new Overdrive(48000);
    od.setParams({ drive: 1, tone: 1, level: 1, mix: 1 });
    let maxAbs = 0;
    for (let i = 0; i < 2000; i++) {
      const y = od.process(Math.sin((2 * Math.PI * 220 * i) / 48000));
      expect(Number.isFinite(y)).toBe(true);
      maxAbs = Math.max(maxAbs, Math.abs(y));
    }
    expect(maxAbs).toBeLessThan(2);
  });

  it("Tone control rolls off high frequencies more at low settings", () => {
    const freq = 4000; // well above both tone cutoffs, so the darker setting attenuates more
    const measureRms = (tone) => {
      const od = new Overdrive(48000);
      od.setParams({ drive: 0.3, tone, level: 0.5, mix: 1 });
      let sumSq = 0;
      let count = 0;
      for (let i = 0; i < 2000; i++) {
        const y = od.process(0.3 * Math.sin((2 * Math.PI * freq * i) / 48000));
        if (i > 1500) { sumSq += y * y; count++; }
      }
      return Math.sqrt(sumSq / count);
    };
    expect(measureRms(0)).toBeLessThan(measureRms(1));
  });

  it("reset() clears the tone filter state", () => {
    const od = new Overdrive(48000);
    od.setParams({ drive: 1, tone: 0.5, level: 1, mix: 1 });
    for (let i = 0; i < 200; i++) od.process(1);
    od.reset();
    expect(od.toneLpf).toBe(0);
  });
});
