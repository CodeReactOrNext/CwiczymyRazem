import type {
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { computeAutoTabZoom } from "./autoTabZoom";
import { NOTE_SPACING_MAX, NOTE_SPACING_MIN } from "./tablatureSettings";

const note = (fret = 5): TablatureBeat["notes"][number] => ({
  string: 1,
  fret,
});

/** `count` bars of 4/4 filled with notes of one length. */
function bars(duration: number, count = 2, fret = 5): TablatureMeasure[] {
  return Array.from({ length: count }, () => ({
    timeSignature: [4, 4] as [number, number],
    beats: Array.from({ length: Math.round(4 / duration) }, () => ({
      duration,
      notes: [note(fret)],
    })),
  }));
}

// A typical desktop board: 1200 × 300, so world px = CSS px and a beat is 200px at 100%.
const desktop = {
  width: 1200,
  height: 300,
  pillHeight: 22,
  fretFontScale: 1,
  hasGutter: true,
};

describe("computeAutoTabZoom", () => {
  it("never blows a slow, sparse exercise past 100%", () => {
    expect(computeAutoTabZoom({ ...desktop, measures: bars(1), bpm: 60 })).toBe(
      1,
    );
  });

  it("pulls the tab in as the tempo rises, so it doesn't run away", () => {
    const at = (bpm: number) =>
      computeAutoTabZoom({ ...desktop, measures: bars(1), bpm });

    expect(at(100)).toBeLessThan(1);
    expect(at(160)).toBeLessThan(at(100));
  });

  it("keeps fast sixteenths readable even though they then scroll faster", () => {
    const sixteenths = computeAutoTabZoom({
      ...desktop,
      measures: bars(0.25),
      bpm: 180,
    });
    const quarters = computeAutoTabZoom({
      ...desktop,
      measures: bars(1),
      bpm: 180,
    });

    expect(sixteenths).toBeGreaterThan(quarters);
    // Each sixteenth still gets room for its pill plus the gaps around it.
    const beatWidth = 200 * sixteenths;
    expect(0.25 * beatWidth).toBeGreaterThanOrEqual(22 + 8);
  });

  it("gives two-digit frets a wider pill", () => {
    const at = (fret: number) =>
      computeAutoTabZoom({
        ...desktop,
        measures: bars(0.25, 2, fret),
        bpm: 200,
      });

    expect(at(12)).toBeGreaterThan(at(5));
  });

  it("lets a few grace-length notes squeeze rather than blowing up the whole tab", () => {
    const measures = bars(1, 4);
    measures[0].beats[0] = { duration: 0.125, notes: [note()] };

    expect(computeAutoTabZoom({ ...desktop, measures, bpm: 90 })).toBe(
      computeAutoTabZoom({ ...desktop, measures: bars(1, 4), bpm: 90 }),
    );
  });

  it("fits to the fastest tempo the piece reaches", () => {
    const measures = bars(1, 2);
    measures[1] = { ...measures[1], tempoChange: 1.5 };

    expect(computeAutoTabZoom({ ...desktop, measures, bpm: 100 })).toBe(
      computeAutoTabZoom({ ...desktop, measures: bars(1, 2), bpm: 150 }),
    );
  });

  it("answers in stored units when the caller scales the spacing", () => {
    const plain = computeAutoTabZoom({
      ...desktop,
      measures: bars(1),
      bpm: 140,
    });
    const scaled = computeAutoTabZoom({
      ...desktop,
      measures: bars(1),
      bpm: 140,
      zoomScale: 0.75,
    });

    expect(scaled * 0.75).toBeCloseTo(plain, 1);
  });

  it("stays inside the slider's range", () => {
    const dense = computeAutoTabZoom({
      ...desktop,
      measures: bars(0.0625),
      bpm: 60,
    });
    const fast = computeAutoTabZoom({
      ...desktop,
      measures: bars(2),
      bpm: 400,
    });

    expect(dense).toBeLessThanOrEqual(NOTE_SPACING_MAX);
    expect(fast).toBeGreaterThanOrEqual(NOTE_SPACING_MIN);
  });

  it("falls back to 100% before the board is measured or with nothing to play", () => {
    expect(
      computeAutoTabZoom({ ...desktop, width: 0, measures: bars(1), bpm: 200 }),
    ).toBe(1);
    expect(computeAutoTabZoom({ ...desktop, measures: [], bpm: 200 })).toBe(1);
    expect(computeAutoTabZoom({ ...desktop, measures: bars(1), bpm: 0 })).toBe(
      1,
    );
  });
});
