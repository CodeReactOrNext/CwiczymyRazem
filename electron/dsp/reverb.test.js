import { describe, expect, it } from "vitest";

import { Reverb } from "./reverb";

describe("Reverb", () => {
  it("is a pure passthrough when mix=0", () => {
    const r = new Reverb(48000);
    r.setParams({ mix: 0 });
    expect(r.process(0.4)).toBeCloseTo(0.4, 6);
  });

  it("produces a bounded, finite tail after an impulse (no runaway feedback)", () => {
    const r = new Reverb(48000);
    r.setParams({ size: 1, damping: 0.1, mix: 1 }); // worst-case: max size, min damping
    r.process(1);
    let maxAbs = 0;
    for (let i = 0; i < 10000; i++) {
      const y = r.process(0);
      expect(Number.isFinite(y)).toBe(true);
      maxAbs = Math.max(maxAbs, Math.abs(y));
    }
    expect(maxAbs).toBeLessThan(2);
  });

  it("clamps comb feedback below 1 regardless of the requested size", () => {
    const r = new Reverb(48000);
    r.setParams({ size: 999 });
    r.combs.forEach((c) => expect(c.feedback).toBeLessThanOrEqual(0.98));
  });

  it("uses a longer pre-delay for a bigger room size", () => {
    const rSmall = new Reverb(48000);
    rSmall.setParams({ size: 0 });
    const rLarge = new Reverb(48000);
    rLarge.setParams({ size: 1 });
    expect(rLarge.preDelay.delaySamples).toBeGreaterThan(rSmall.preDelay.delaySamples);
  });

  it("delays the wet onset so the tank stays silent until pre-delay + diffuser latency elapses", () => {
    const r = new Reverb(48000);
    r.setParams({ size: 1, damping: 0.5, mix: 1 }); // mix=1: output is 100% wet tank
    r.process(1);
    let earlyMax = 0;
    for (let i = 0; i < 1000; i++) earlyMax = Math.max(earlyMax, Math.abs(r.process(0)));
    expect(earlyMax).toBe(0);
  });
});
