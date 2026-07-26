import { describe, expect, it } from "vitest";

import { Convolver, MAX_IR_TAPS } from "./convolver";

describe("Convolver", () => {
  it("passes through unchanged when no IR is loaded", () => {
    const c = new Convolver(48000);
    expect(c.process(0.5)).toBe(0.5);
  });

  it("outputs exactly the IR's samples for an impulse input", () => {
    const c = new Convolver(48000);
    const ir = Float32Array.from([0.2, -0.5, 0.9, 0.1]);
    c.setIR(ir);

    const outputs = [c.process(1), c.process(0), c.process(0), c.process(0)];
    expect(outputs[0]).toBeCloseTo(0.2, 6);
    expect(outputs[1]).toBeCloseTo(-0.5, 6);
    expect(outputs[2]).toBeCloseTo(0.9, 6);
    expect(outputs[3]).toBeCloseTo(0.1, 6);
  });

  it("caps the tap count at MAX_IR_TAPS", () => {
    const c = new Convolver(48000);
    c.setIR(new Float32Array(MAX_IR_TAPS + 500).fill(0.001));
    expect(c.n).toBe(MAX_IR_TAPS);
  });

  it("returns to passthrough once the IR is cleared", () => {
    const c = new Convolver(48000);
    c.setIR(Float32Array.from([1, 1, 1]));
    c.setIR(null);
    expect(c.process(0.3)).toBe(0.3);
  });
});
