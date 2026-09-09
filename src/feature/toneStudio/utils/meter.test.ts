import { describe, expect, it } from "vitest";

import { meterZone, peakToDb, peakToMeterFraction } from "./meter";

describe("peakToDb", () => {
  it("maps full scale to 0 dBFS and half to about -6 dB", () => {
    expect(peakToDb(1)).toBeCloseTo(0, 5);
    expect(peakToDb(0.5)).toBeCloseTo(-6.02, 1);
  });

  it("does not blow up on digital silence", () => {
    expect(Number.isFinite(peakToDb(0))).toBe(true);
  });
});

describe("peakToMeterFraction", () => {
  it("fills the bar fully at 0 dBFS and clamps above it", () => {
    expect(peakToMeterFraction(1)).toBe(1);
    expect(peakToMeterFraction(2)).toBe(1);
  });

  it("is empty at and below the floor", () => {
    expect(peakToMeterFraction(0.001)).toBe(0); // -60 dB
    expect(peakToMeterFraction(0)).toBe(0);
  });

  it("puts -30 dB at the middle of the bar", () => {
    expect(peakToMeterFraction(Math.pow(10, -30 / 20))).toBeCloseTo(0.5, 5);
  });
});

describe("meterZone", () => {
  it("classifies by loudness", () => {
    expect(meterZone(0)).toBe("quiet");
    expect(meterZone(0.05)).toBe("ok"); // ≈ -26 dB
    expect(meterZone(0.7)).toBe("hot"); // ≈ -3 dB
    expect(meterZone(0.995)).toBe("clip");
  });
});
