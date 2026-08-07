import { stringHuntAExercise } from "feature/exercisePlan/data/exerises/stringHuntA/stringHuntA";
import { stringHuntBExercise } from "feature/exercisePlan/data/exerises/stringHuntB/stringHuntB";
import { stringHuntDExercise } from "feature/exercisePlan/data/exerises/stringHuntD/stringHuntD";
import { stringHuntGExercise } from "feature/exercisePlan/data/exerises/stringHuntG/stringHuntG";
import { stringHuntLowEExercise } from "feature/exercisePlan/data/exerises/stringHuntLowE/stringHuntLowE";
import { NOTES } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { huntPositions, playableOctaves } from "./useNoteHunt";

describe("huntPositions", () => {
  it("finds a note across every string when no string scope is given", () => {
    // F# in frets 0-11 sits on all six strings, spanning three octaves.
    const positions = huntPositions("F#", [0, 11]);
    expect(positions.map(p => p.string).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(positions.map(p => p.octave))).toEqual(new Set([2, 3, 4]));
  });

  it("keeps only the requested string", () => {
    // G string (3rd), open = G3: F# is the 11th fret, F#4.
    expect(huntPositions("F#", [0, 11], [3])).toEqual([{ string: 3, fret: 11, midiNote: 66, octave: 4 }]);
  });

  it("returns nothing for a note name it doesn't recognise", () => {
    expect(huntPositions("H", [0, 11], [3])).toEqual([]);
  });
});

describe("playableOctaves", () => {
  it("covers the standard-tuned neck", () => {
    expect(playableOctaves("E")).toEqual([2, 3, 4, 5, 6]);
  });
});

describe("String Hunt exams", () => {
  const exercises = [
    stringHuntLowEExercise,
    stringHuntAExercise,
    stringHuntDExercise,
    stringHuntGExercise,
    stringHuntBExercise,
  ];

  // The whole premise of these exams — "play this note on THIS string" judged by
  // a pitch detector that can't hear strings — only holds because one string plus
  // a 12-fret window pins every note to a single octave. If one of these exams ever
  // loses its customGoalStrings, the hunt goes back to demanding three octaves the
  // player cannot reach on the named string, and the exam becomes unpassable.
  it.each(exercises.map(e => [e.title, e] as const))("%s scopes every note to one octave", (_title, exercise) => {
    const strings = exercise.customGoalStrings;
    const region = exercise.customGoalRegion!;
    expect(strings).toHaveLength(1);

    for (const note of NOTES) {
      const positions = huntPositions(note, [region.startFret, region.endFret], strings);
      expect(positions).toHaveLength(1);
      expect(positions[0].string).toBe(strings![0]);
    }
  });
});
