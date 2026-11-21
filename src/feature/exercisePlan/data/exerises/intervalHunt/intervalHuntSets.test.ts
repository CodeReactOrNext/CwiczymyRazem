import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { NOTES } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { intervalHuntSetExercises } from "./intervalHuntSets";

describe("interval hunt sets", () => {
  it.each(intervalHuntSetExercises.map((e) => [e.title, e] as const))(
    "%s confines every round to a fresh four-fret window holding both notes",
    (_title, exercise) => {
      expect(exercise.disableMic).toBeFalsy();
      expect(exercise.customGoalRegion).toBeDefined();
      let previous = exercise.rollHuntTarget!();
      for (let i = 0; i < 40; i++) {
        const rolled = exercise.rollHuntTarget!();
        const { startFret, endFret } = rolled.region!;
        expect(endFret - startFret).toBe(3);
        for (const note of [rolled.prompt!.title, rolled.goal]) {
          const positions = getNotePositionsInRange(NOTES.indexOf(note), startFret, endFret);
          expect(positions.length, `${note} in ${startFret}-${endFret}`).toBeGreaterThan(0);
        }
        expect(startFret).not.toBe(previous.region!.startFret);
        previous = rolled;
      }
    },
  );
});
