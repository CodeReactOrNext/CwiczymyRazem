import { describe, expect, it } from "vitest";

import { getScaleShape } from "./fretboardMapper";
import { generatePattern, type PatternType } from "./patternGenerators";
import { getNotesPerString, rootNotes, scaleDefinitions, type ScaleType } from "./scaleDefinitions";

const PATTERNS: PatternType[] = [
  "ascending",
  "descending",
  "ascending_descending",
  "sequence_3_notes",
  "sequence_4_notes",
  "intervals_thirds",
  "intervals_fourths",
];

const shapeFor = (root: string, scaleType: ScaleType, startFret: number) =>
  getScaleShape(
    60 + rootNotes.indexOf(root),
    scaleDefinitions[scaleType].intervals,
    startFret,
    getNotesPerString(scaleType),
  );

const barLength = (beats: { duration: number }[]) =>
  beats.reduce((total, beat) => total + beat.duration, 0);

describe("generatePattern bar lengths", () => {
  it("fills every bar of every pattern, whatever the shape", () => {
    // The session click is a free-running clock, so a bar of fractional length
    // pushes everything after it off the beat — and the exercise loops, so the
    // slip compounds. A minor pentatonic Box 5 ascending was the reported case:
    // one full bar and then a bar holding 1.5 beats.
    for (const [scaleType, startFret] of [
      ["minor_pentatonic", 2],
      ["minor_pentatonic", 5],
      ["major", 8],
      ["dorian", 1],
    ] as const) {
      for (const patternType of PATTERNS) {
        const measures = generatePattern({
          patternType,
          positions: shapeFor("A", scaleType, startFret),
          noteDuration: 0.5,
          beatsPerMeasure: 4,
        });

        for (const [index, measure] of measures.entries()) {
          expect(barLength(measure.beats), `${scaleType}@${startFret} ${patternType} bar ${index + 1}`)
            .toBeCloseTo(4);
        }
      }
    }
  });

  it("pads the tail with rests rather than cutting the bar short", () => {
    const measures = generatePattern({
      patternType: "ascending",
      positions: shapeFor("A", "minor_pentatonic", 2),
      noteDuration: 0.5,
      beatsPerMeasure: 4,
    });

    // Twelve notes of eighths is a bar and a half; the half bar left over is rest.
    expect(measures).toHaveLength(2);
    expect(measures[1].beats.filter((beat) => beat.notes.length > 0)).toHaveLength(4);
    expect(measures[1].beats.filter((beat) => beat.notes.length === 0)).toEqual([
      { duration: 2, notes: [] },
    ]);
  });

  it("picks the top note once at the turnaround", () => {
    const positions = shapeFor("A", "minor_pentatonic", 2);
    const played = generatePattern({
      patternType: "ascending_descending",
      positions,
      noteDuration: 0.5,
      beatsPerMeasure: 4,
    })
      .flatMap((measure) => measure.beats)
      .filter((beat) => beat.notes.length > 0)
      .map((beat) => `${beat.notes[0].string}:${beat.notes[0].fret}`);

    // Up and back is one note short of twice the shape — the peak is not repeated.
    expect(played).toHaveLength(positions.length * 2 - 1);
    expect(played[positions.length - 1]).not.toBe(played[positions.length]);
  });
});
