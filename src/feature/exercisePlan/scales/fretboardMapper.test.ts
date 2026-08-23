import { describe, expect, it } from "vitest";

import { getScaleOnString,getScaleShape, getShapeStartFrets } from "./fretboardMapper";
import { getNotesPerString,rootNotes, scaleDefinitions, type ScaleType } from "./scaleDefinitions";

const midiFor = (root: string) => 60 + rootNotes.indexOf(root);

/** Frets per string, low E first — how a shape is written down in a book. */
function byString(shape: ReturnType<typeof getScaleShape>): number[][] {
  return [6, 5, 4, 3, 2, 1].map((string) =>
    shape.filter((note) => note.string === string).map((note) => note.fret),
  );
}

function shapeFor(root: string, scaleType: ScaleType, startFret: number) {
  return getScaleShape(
    midiFor(root),
    scaleDefinitions[scaleType].intervals,
    startFret,
    getNotesPerString(scaleType),
  );
}

describe("getScaleShape", () => {
  it("keeps the G on the low E's 3rd fret in A minor pentatonic Box 5", () => {
    // The shape players reported as short a note: the run used to open on the
    // root at the 5th fret because the G below it was never generated.
    expect(byString(shapeFor("A", "minor_pentatonic", 2))).toEqual([
      [3, 5],
      [3, 5],
      [2, 5],
      [2, 5],
      [3, 5],
      [3, 5],
    ]);
  });

  it("draws the textbook three-notes-per-string shape for C major at fret 8", () => {
    // Named after the fret it starts on — and it starts there, not on the 7th.
    expect(byString(shapeFor("C", "major", 8))).toEqual([
      [8, 10, 12],
      [8, 10, 12],
      [9, 10, 12],
      [9, 10, 12],
      [10, 12, 13],
      [10, 12, 13],
    ]);
  });

  it("puts two notes on every string of a pentatonic box, twelve in all", () => {
    for (const root of rootNotes) {
      for (const scaleType of ["minor_pentatonic", "major_pentatonic"] as const) {
        for (const startFret of getShapeStartFrets(midiFor(root), scaleDefinitions[scaleType].intervals)) {
          const strings = byString(shapeFor(root, scaleType, startFret));
          expect(strings.map((frets) => frets.length), `${root} ${scaleType} fret ${startFret}`)
            .toEqual([2, 2, 2, 2, 2, 2]);
        }
      }
    }
  });

  it("puts three notes on every string of a diatonic shape, eighteen in all", () => {
    for (const root of rootNotes) {
      for (const scaleType of ["major", "minor", "dorian", "locrian"] as const) {
        for (const startFret of getShapeStartFrets(midiFor(root), scaleDefinitions[scaleType].intervals)) {
          const strings = byString(shapeFor(root, scaleType, startFret));
          expect(strings.map((frets) => frets.length), `${root} ${scaleType} fret ${startFret}`)
            .toEqual([3, 3, 3, 3, 3, 3]);
        }
      }
    }
  });

  it("draws the same shape in every key, only moved along the neck", () => {
    // The tree is authored in C and every other key is the same fingering shifted,
    // which is why a record set in one key counts in all of them. Measuring each
    // shape against its own lowest fret is what makes that claim testable — and
    // it is the invariant the missing-note bug broke.
    for (const scaleType of Object.keys(scaleDefinitions) as ScaleType[]) {
      const intervals = scaleDefinitions[scaleType].intervals;
      const reference = getShapeStartFrets(midiFor("C"), intervals).map((startFret) => {
        const shape = shapeFor("C", scaleType, startFret);
        const lowest = Math.min(...shape.map((note) => note.fret));
        return shape.map((note) => `${note.string}:${note.fret - lowest}`).join(" ");
      });

      for (const root of rootNotes) {
        const shapes = getShapeStartFrets(midiFor(root), intervals).map((startFret) => {
          const shape = shapeFor(root, scaleType, startFret);
          const lowest = Math.min(...shape.map((note) => note.fret));
          return shape.map((note) => `${note.string}:${note.fret - lowest}`).join(" ");
        });
        // Same set of shapes, in the same order once rotated to the key's own start.
        expect(new Set(shapes), `${root} ${scaleType}`).toEqual(new Set(reference));
      }
    }
  });

  it("never asks for a fret behind the nut", () => {
    for (const root of rootNotes) {
      for (const scaleType of Object.keys(scaleDefinitions) as ScaleType[]) {
        for (let startFret = 1; startFret <= 12; startFret++) {
          for (const note of shapeFor(root, scaleType, startFret)) {
            expect(note.fret, `${root} ${scaleType} fret ${startFret}`).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it("climbs to a scale note when handed a fret that is between two", () => {
    // C major has no note on the low E's 2nd fret, so a shape named after it
    // starts on the G a fret up — the same shape "fret 3" names.
    expect(byString(shapeFor("C", "major", 2))).toEqual(byString(shapeFor("C", "major", 3)));
  });
});

describe("getShapeStartFrets", () => {
  it("finds one start per scale degree, always on a scale note", () => {
    for (const root of rootNotes) {
      for (const scaleType of Object.keys(scaleDefinitions) as ScaleType[]) {
        const intervals = scaleDefinitions[scaleType].intervals;
        const starts = getShapeStartFrets(midiFor(root), intervals);

        expect(starts.length, `${root} ${scaleType}`).toBe(intervals.length);
        expect(new Set(starts).size).toBe(starts.length);
        for (const fret of starts) {
          // The low E is string 6; a start fret must carry a note of the scale.
          expect(getScaleOnString(midiFor(root), intervals, 6, fret, fret)).toHaveLength(1);
        }
      }
    }
  });

  it("names the seven three-notes-per-string starts of C major", () => {
    expect(getShapeStartFrets(midiFor("C"), scaleDefinitions.major.intervals)).toEqual([
      1, 3, 5, 7, 8, 10, 12,
    ]);
  });
});

describe("getScaleOnString", () => {
  it("reaches the bottom of the low E whatever the key", () => {
    // Same octave-window bug as the shapes: in the key of A everything under the
    // 5th fret used to vanish.
    expect(
      getScaleOnString(midiFor("A"), scaleDefinitions.minor_pentatonic.intervals, 6, 0, 5).map(
        (note) => note.fret,
      ),
    ).toEqual([0, 3, 5]);
  });
});
