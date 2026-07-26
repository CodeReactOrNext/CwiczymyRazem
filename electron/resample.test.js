import { describe, expect, it } from "vitest";

import { resampleLinear } from "./resample";

describe("resampleLinear", () => {
  it("returns the input unchanged when sample rates match", () => {
    const input = Float32Array.from([0, 0.5, 1, -0.5]);
    const out = resampleLinear(input, 48000, 48000);
    expect(Array.from(out)).toEqual(Array.from(input));
  });

  it("upsamples a ramp, interpolating between the two source points", () => {
    const input = Float32Array.from([0, 1]);
    const out = resampleLinear(input, 44100, 88200); // ratio 0.5 → double the length
    expect(out.length).toBe(4);
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[1]).toBeCloseTo(0.5, 5);
    expect(out[out.length - 1]).toBeCloseTo(1, 5);
  });

  it("downsamples, reducing length roughly proportionally", () => {
    const input = new Float32Array(100);
    for (let i = 0; i < input.length; i++) input[i] = i / 99;
    const out = resampleLinear(input, 48000, 24000);
    expect(out.length).toBeCloseTo(50, 0);
  });

  it("returns an empty array for empty input", () => {
    const out = resampleLinear(new Float32Array(0), 44100, 48000);
    expect(out.length).toBe(0);
  });
});
