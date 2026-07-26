import { describe, expect, it } from "vitest";

import { Delay } from "./delay";

describe("Delay", () => {
  it("is a pure passthrough when mix=0", () => {
    const d = new Delay(48000);
    d.setParams({ delayMs: 100, feedback: 0.3, mix: 0 });
    expect(d.process(0.7)).toBeCloseTo(0.7, 6);
  });

  it("repeats the input exactly delayMs worth of samples later", () => {
    const sr = 1000; // 1 sample == 1ms, keeps the math exact
    const d = new Delay(sr, 200);
    d.setParams({ delayMs: 10, feedback: 0, mix: 1 });

    const outputs = [d.process(1)];
    for (let i = 0; i < 19; i++) outputs.push(d.process(0));

    expect(outputs[0]).toBeCloseTo(0, 6); // nothing delayed yet
    expect(outputs[10]).toBeCloseTo(1, 6); // the impulse, delayed by 10 samples
    expect(outputs[9]).toBeCloseTo(0, 6);
    expect(outputs[11]).toBeCloseTo(0, 6);
  });

  it("clamps feedback below 1 regardless of what's requested", () => {
    const d = new Delay(48000);
    d.setParams({ feedback: 5 });
    expect(d.params.feedback).toBeLessThanOrEqual(0.95);
  });

  it("reset() clears the buffer so the next repeat is silent", () => {
    const sr = 1000;
    const d = new Delay(sr, 200);
    d.setParams({ delayMs: 10, feedback: 0, mix: 1 });
    d.process(1);
    d.reset();
    for (let i = 0; i < 10; i++) expect(d.process(0)).toBeCloseTo(0, 6);
  });

  it("stays near unity under sustained input with feedback near max", () => {
    // A feedback delay is a comb filter too: a sustained tone near a multiple
    // of 1/delayTime gets amplified every round trip (~1/(1-feedback), ~20x at
    // feedback=0.95). Without a loop limiter this measured 5.6x on a held note
    // with Feedback maxed, riding into ampSim.js's hard limiter as clipping.
    const sr = 48000;
    const d = new Delay(sr, 2000);
    d.setParams({ delayMs: 300, feedback: 0.95, mix: 1 });
    let maxAbs = 0;
    for (let i = 0; i < sr * 5; i++) {
      const y = d.process(Math.sin((2 * Math.PI * 220 * i) / sr) * 0.5);
      maxAbs = Math.max(maxAbs, Math.abs(y));
    }
    expect(maxAbs).toBeLessThan(2);
  });
});
