import { describe, expect, it } from "vitest";

import {
  correctOctaveForLowStrings,
  EXPECT_NEAR_CENTS_BONUS,
  getAdaptiveVolumeGate,
  getDetectionGates,
  getExpectationBiasedTolerance,
  HIGH_STRING_MIN_FREQ,
  NOISE_GATE_ABSOLUTE_CEIL,
  NOISE_GATE_ABSOLUTE_FLOOR,
  NOISE_GATE_MULTIPLIER,
} from "./noteUtils";

const BASE_VOLUME_GATE = 0.005;

describe("getDetectionGates", () => {
  it("keeps the base gates for low/mid strings (below E4)", () => {
    const gates = getDetectionGates(196, BASE_VOLUME_GATE); // G3
    expect(gates.isHighString).toBe(false);
    expect(gates.volumeGate).toBe(BASE_VOLUME_GATE);
  });

  it("relaxes the volume gate at/above the high-string split (E4+)", () => {
    const gates = getDetectionGates(330, BASE_VOLUME_GATE); // ~E4
    expect(gates.isHighString).toBe(true);
    expect(gates.volumeGate).toBeLessThan(BASE_VOLUME_GATE);
  });

  it("splits at E4 (~329.6 Hz): B3 is low, G4 is high", () => {
    expect(HIGH_STRING_MIN_FREQ).toBeGreaterThan(329);
    expect(HIGH_STRING_MIN_FREQ).toBeLessThan(330);
    expect(getDetectionGates(247, BASE_VOLUME_GATE).isHighString).toBe(false); // B3
    expect(getDetectionGates(392, BASE_VOLUME_GATE).isHighString).toBe(true); // G4
  });

  it("treats pitchless (dead/muted) notes as a low string — base gates", () => {
    const gates = getDetectionGates(0, BASE_VOLUME_GATE);
    expect(gates.isHighString).toBe(false);
    expect(gates.volumeGate).toBe(BASE_VOLUME_GATE);
  });

});

describe("getExpectationBiasedTolerance", () => {
  it("does not widen tolerance at/below the ramp start", () => {
    expect(getExpectationBiasedTolerance(45, 0)).toBe(45);
    expect(getExpectationBiasedTolerance(45, 0.5)).toBe(45);
    expect(getExpectationBiasedTolerance(45, 0.75)).toBe(45);
  });

  it("ramps the bonus linearly between the ramp start and the full-confidence threshold", () => {
    // Midpoint of the 0.75–0.9 ramp → half the bonus, not a cliff.
    expect(getExpectationBiasedTolerance(45, 0.825)).toBeCloseTo(45 + EXPECT_NEAR_CENTS_BONUS / 2);
    // Just under full confidence: most, but not all, of the bonus — no flicker
    // to "full bonus" from ordinary confidence-measurement noise right at 0.9.
    const near = getExpectationBiasedTolerance(45, 0.89);
    expect(near).toBeGreaterThan(45);
    expect(near).toBeLessThan(45 + EXPECT_NEAR_CENTS_BONUS);
  });

  it("widens tolerance to the full bonus once the confidence threshold is reached", () => {
    expect(getExpectationBiasedTolerance(45, 0.9)).toBe(45 + EXPECT_NEAR_CENTS_BONUS);
    expect(getExpectationBiasedTolerance(45, 1)).toBe(45 + EXPECT_NEAR_CENTS_BONUS);
  });

  it("never widens by a full semitone (would let a wrong fret pass)", () => {
    expect(getExpectationBiasedTolerance(45, 1) - 45).toBeLessThan(50);
  });
});

describe("getAdaptiveVolumeGate", () => {
  it("scales the measured noise floor by NOISE_GATE_MULTIPLIER in the mid-range", () => {
    const noiseFloor = 0.002;
    expect(getAdaptiveVolumeGate(noiseFloor)).toBeCloseTo(noiseFloor * NOISE_GATE_MULTIPLIER);
  });

  it("never goes below the absolute floor for a near-silent room", () => {
    expect(getAdaptiveVolumeGate(0)).toBe(NOISE_GATE_ABSOLUTE_FLOOR);
    expect(getAdaptiveVolumeGate(0.0001)).toBe(NOISE_GATE_ABSOLUTE_FLOOR);
  });

  it("never goes above the absolute ceiling for a very noisy room", () => {
    expect(getAdaptiveVolumeGate(1)).toBe(NOISE_GATE_ABSOLUTE_CEIL);
    expect(getAdaptiveVolumeGate(0.1)).toBe(NOISE_GATE_ABSOLUTE_CEIL);
  });
});

describe("correctOctaveForLowStrings", () => {
  const E2 = 82.41;
  const G3 = 196.0; // above the 165Hz cutoff — a "high enough" string

  it("halves a 2nd-harmonic misdetection on a low-string target", () => {
    expect(correctOctaveForLowStrings(E2 * 2, E2)).toBeCloseTo(E2, 0);
  });

  it("leaves a correctly-detected low-string reading unchanged", () => {
    const closeToTarget = E2 + 1; // 1Hz sharp — clearly the fundamental, not the harmonic
    expect(correctOctaveForLowStrings(closeToTarget, E2)).toBe(closeToTarget);
  });

  it("never applies the correction at/above the 165Hz cutoff", () => {
    expect(correctOctaveForLowStrings(G3 * 2, G3)).toBe(G3 * 2);
  });

  it("leaves a genuinely different (not 2nd-harmonic) wrong note alone", () => {
    const A2 = 110; // a different string entirely, not close to E2 or its octave
    expect(correctOctaveForLowStrings(A2, E2)).toBe(A2);
  });
});
