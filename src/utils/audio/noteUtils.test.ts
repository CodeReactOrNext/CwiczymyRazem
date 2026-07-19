import { describe, expect, it } from "vitest";

import {
  EXPECT_NEAR_CENTS_BONUS,
  getDetectionGates,
  getExpectationBiasedTolerance,
  HIGH_STRING_MIN_FREQ,
} from "./noteUtils";

const BASE_VOLUME_GATE = 0.005;
const BASE_CHROMA_THRESHOLD = 0.55;

describe("getDetectionGates", () => {
  it("keeps the base gates for low/mid strings (below E4)", () => {
    const gates = getDetectionGates(196, BASE_VOLUME_GATE, BASE_CHROMA_THRESHOLD); // G3
    expect(gates.isHighString).toBe(false);
    expect(gates.volumeGate).toBe(BASE_VOLUME_GATE);
    expect(gates.chordChromaThreshold).toBe(BASE_CHROMA_THRESHOLD);
  });

  it("relaxes both gates at/above the high-string split (E4+)", () => {
    const gates = getDetectionGates(330, BASE_VOLUME_GATE, BASE_CHROMA_THRESHOLD); // ~E4
    expect(gates.isHighString).toBe(true);
    expect(gates.volumeGate).toBeLessThan(BASE_VOLUME_GATE);
    expect(gates.chordChromaThreshold).toBeLessThan(BASE_CHROMA_THRESHOLD);
  });

  it("splits at E4 (~329.6 Hz): B3 is low, G4 is high", () => {
    expect(HIGH_STRING_MIN_FREQ).toBeGreaterThan(329);
    expect(HIGH_STRING_MIN_FREQ).toBeLessThan(330);
    expect(getDetectionGates(247, BASE_VOLUME_GATE, BASE_CHROMA_THRESHOLD).isHighString).toBe(false); // B3
    expect(getDetectionGates(392, BASE_VOLUME_GATE, BASE_CHROMA_THRESHOLD).isHighString).toBe(true); // G4
  });

  it("treats pitchless (dead/muted) notes as a low string — base gates", () => {
    const gates = getDetectionGates(0, BASE_VOLUME_GATE, BASE_CHROMA_THRESHOLD);
    expect(gates.isHighString).toBe(false);
    expect(gates.volumeGate).toBe(BASE_VOLUME_GATE);
    expect(gates.chordChromaThreshold).toBe(BASE_CHROMA_THRESHOLD);
  });
});

describe("getExpectationBiasedTolerance", () => {
  it("does not widen tolerance at low/medium confidence", () => {
    expect(getExpectationBiasedTolerance(45, 0)).toBe(45);
    expect(getExpectationBiasedTolerance(45, 0.5)).toBe(45);
    expect(getExpectationBiasedTolerance(45, 0.89)).toBe(45);
  });

  it("widens tolerance once the confidence threshold is reached", () => {
    expect(getExpectationBiasedTolerance(45, 0.9)).toBe(45 + EXPECT_NEAR_CENTS_BONUS);
    expect(getExpectationBiasedTolerance(45, 1)).toBe(45 + EXPECT_NEAR_CENTS_BONUS);
  });

  it("never widens by a full semitone (would let a wrong fret pass)", () => {
    expect(getExpectationBiasedTolerance(45, 1) - 45).toBeLessThan(50);
  });
});
