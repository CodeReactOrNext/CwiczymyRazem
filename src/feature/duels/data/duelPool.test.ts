import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { hasLeaderboard } from "feature/exercisePlan/utils/hasLeaderboard";
import { hasTablatureNotes } from "feature/exercisePlan/utils/hasTablatureNotes";
import { describe, expect, it } from "vitest";

import {
  drawDuelExercise,
  DUEL_EXERCISE_IDS,
  DUEL_POOL,
  duelScoreKind,
  getDuelExercise,
} from "./duelPool";

const MIC_HUNT_MODES = new Set([
  "octaves",
  "region",
  "interval",
  "chord",
  "accumulate",
]);

describe("DUEL_POOL", () => {
  it("resolves every id to a catalogue exercise, once", () => {
    expect(DUEL_POOL).toHaveLength(DUEL_EXERCISE_IDS.length);
    expect(new Set(DUEL_EXERCISE_IDS).size).toBe(DUEL_EXERCISE_IDS.length);
  });

  it("is about a fifth of the catalogue", () => {
    const share = DUEL_POOL.length / exercisesAgregat.length;
    expect(share).toBeGreaterThan(0.15);
    expect(share).toBeLessThan(0.25);
  });

  it("holds only medium and hard exercises a player can find in the library", () => {
    for (const exercise of DUEL_POOL) {
      expect(["medium", "hard"], exercise.id).toContain(exercise.difficulty);
      expect(exercise.isHiddenFromLibrary, exercise.id).toBeFalsy();
      expect(hasLeaderboard(exercise), exercise.id).toBe(true);
    }
  });

  it("only draws exercises the microphone scores", () => {
    for (const exercise of DUEL_POOL) {
      expect(exercise.disableMic, exercise.id).toBeFalsy();
      expect(exercise.isPlayalong, exercise.id).toBeFalsy();
      expect(exercise.earQuizConfig, exercise.id).toBeUndefined();
      expect(exercise.scoringFocus, exercise.id).not.toBe("pitch");

      const huntMode =
        exercise.noteHuntConfig?.mode ??
        (exercise.noteHuntConfig ? "octaves" : null);
      const isMicTab =
        (hasTablatureNotes(exercise.tablature) || !!exercise.gpFileUrl) &&
        !!exercise.metronomeSpeed;
      const isMicHunt = !!huntMode && MIC_HUNT_MODES.has(huntMode);
      const isPlayByEar = exercise.riddleConfig?.mode === "sequenceRepeat";
      expect(isMicTab || isMicHunt || isPlayByEar, exercise.id).toBe(true);
    }
  });

  it("mixes technique, theory and hearing", () => {
    const categories = new Set(DUEL_POOL.map((exercise) => exercise.category));
    expect(categories).toEqual(new Set(["technique", "theory", "hearing"]));
  });
});

describe("duelScoreKind", () => {
  it("judges Play by Ear on its own score and the rest on the mic score", () => {
    expect(duelScoreKind(getDuelExercise("earTrainingHard")!)).toBe(
      "earTraining",
    );
    expect(duelScoreKind(getDuelExercise("chicken_pickin")!)).toBe("mic");
    expect(duelScoreKind(getDuelExercise("whole_neck_sweep")!)).toBe("mic");
  });
});

describe("getDuelExercise", () => {
  it("refuses an exercise outside the pool", () => {
    expect(getDuelExercise("spider_basic")).toBeNull();
    expect(getDuelExercise("nope")).toBeNull();
  });
});

describe("drawDuelExercise", () => {
  it("stays inside the pool at both ends of the random range", () => {
    expect(drawDuelExercise(() => 0)).toBe(DUEL_POOL[0]);
    expect(drawDuelExercise(() => 0.999999)).toBe(
      DUEL_POOL[DUEL_POOL.length - 1],
    );
  });
});
