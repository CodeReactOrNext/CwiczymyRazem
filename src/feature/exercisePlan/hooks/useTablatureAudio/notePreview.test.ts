import { describe, expect, it } from "vitest";

import { pluckPeriodToFrequency, renderPluckSamples } from "./notePreview";

const SAMPLE_RATE = 48000;

/**
 * Period (in samples, sub-sample accurate) the signal actually repeats at:
 * autocorrelation for the integer peak, then a parabolic fit around it — the
 * true period is half-integer, so an integer answer alone can't verify pitch.
 */
function measuredPeriod(samples: Float32Array, from: number, to: number): number {
  // Skip the attack — the excitation noise hasn't settled into the loop yet.
  const start = Math.round(SAMPLE_RATE * 0.05);
  const window = Math.round(SAMPLE_RATE * 0.1);
  const scores = new Float64Array(to - from + 1);
  for (let lag = from; lag <= to; lag++) {
    let score = 0;
    for (let i = start; i < start + window; i++) score += samples[i] * samples[i + lag];
    scores[lag - from] = score;
  }
  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;
  if (best === 0 || best === scores.length - 1) return from + best;
  const [y0, y1, y2] = [scores[best - 1], scores[best], scores[best + 1]];
  return from + best + (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2);
}

function rms(samples: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (to - from));
}

describe("renderPluckSamples", () => {
  it("rings half a sample shy of its delay line, as pluckPeriodToFrequency claims", () => {
    const samples = renderPluckSamples(SAMPLE_RATE, 109, 1.5); // ≈ 442 Hz
    expect(measuredPeriod(samples, 80, 140)).toBeCloseTo(108.5, 1);
    expect(pluckPeriodToFrequency(SAMPLE_RATE, 109)).toBeCloseTo(SAMPLE_RATE / 108.5, 6);
  });

  it("holds that relationship for a low note too", () => {
    const samples = renderPluckSamples(SAMPLE_RATE, 545, 1.5); // ≈ 88 Hz
    expect(measuredPeriod(samples, 500, 600)).toBeCloseTo(544.5, 1);
  });

  it("decays like a plucked string instead of sustaining", () => {
    const samples = renderPluckSamples(SAMPLE_RATE, 109, 1.5);
    const attack = rms(samples, 0, Math.round(SAMPLE_RATE * 0.05));
    const tail = rms(samples, Math.round(SAMPLE_RATE * 1.0), Math.round(SAMPLE_RATE * 1.2));
    expect(attack).toBeGreaterThan(0.01);
    expect(tail).toBeLessThan(attack / 2);
  });

  it("stays inside the sample range and ends silent", () => {
    const samples = renderPluckSamples(SAMPLE_RATE, 109, 1.0);
    expect(samples.length).toBe(SAMPLE_RATE);
    expect(samples.every((s) => Number.isFinite(s) && Math.abs(s) <= 1)).toBe(true);
    // Math.abs, because the fade lands on -0 whenever the last sample was negative.
    expect(Math.abs(samples[samples.length - 1])).toBe(0);
  });
});
