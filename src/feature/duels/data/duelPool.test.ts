import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { hasLeaderboard } from "feature/exercisePlan/utils/hasLeaderboard";
import { hasTablatureNotes } from "feature/exercisePlan/utils/hasTablatureNotes";
import { describe, expect, it } from "vitest";

import {
  drawDuelExercise,
  DUEL_EXERCISE_IDS,
  DUEL_POOL,
  duelNeedsMic,
  duelScoreKind,
  getDuelExercise,
} from "./duelPool";

const MIC_HUNT_MODES = new Set(["octaves", "region", "interval", "chord", "accumulate"]);

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

  it("holds only exercises a player can find in the library", () => {
    for (const exercise of DUEL_POOL) {
      expect(exercise.isHiddenFromLibrary, exercise.id).toBeFalsy();
      expect(exercise.isPlayalong, exercise.id).toBeFalsy();
      expect(exercise.difficulty, exercise.id).not.toBe("beginner");
      expect(hasLeaderboard(exercise), exercise.id).toBe(true);
    }
  });

  it("only draws exercises that end in a score both players can be compared on", () => {
    for (const exercise of DUEL_POOL) {
      const kind = duelScoreKind(exercise);
      if (kind === "quiz" || kind === "click") continue;
      expect(exercise.disableMic, exercise.id).toBeFalsy();
      if (kind === "earTraining") continue;
      const huntMode = exercise.noteHuntConfig?.mode ?? (exercise.noteHuntConfig ? "octaves" : null);
      const isMicTab =
        (hasTablatureNotes(exercise.tablature) || !!exercise.gpFileUrl) && !!exercise.metronomeSpeed;
      const isMicHunt = !!huntMode && MIC_HUNT_MODES.has(huntMode);
      expect(isMicTab || isMicHunt, exercise.id).toBe(true);
    }
  });

  it("mixes technique, theory and hearing", () => {
    const categories = new Set(DUEL_POOL.map((exercise) => exercise.category));
    expect(categories).toEqual(new Set(["technique", "theory", "hearing"]));
  });
});

describe("duelScoreKind", () => {
  it("tells the four ways a duel run is scored apart", () => {
    expect(duelScoreKind(getDuelExercise("spider_x")!)).toBe("mic");
    expect(duelScoreKind(getDuelExercise("chromatic_note_hunt")!)).toBe("mic");
    expect(duelScoreKind(getDuelExercise("fret_click_whole_chromatic")!)).toBe("click");
    expect(duelScoreKind(getDuelExercise("ear_chord_quality_advanced")!)).toBe("quiz");
    expect(duelScoreKind({ riddleConfig: { mode: "sequenceRepeat", difficulty: "hard", noteCount: 5 } })).toBe(
      "earTraining",
    );
  });

  it("asks for the mic only where the mic does the scoring", () => {
    expect(duelNeedsMic(getDuelExercise("crazy_train_riff_preview")!)).toBe(true);
    expect(duelNeedsMic(getDuelExercise("fret_click_whole_chromatic")!)).toBe(false);
    expect(duelNeedsMic(getDuelExercise("ear_progression_basics")!)).toBe(false);
  });
});

describe("getDuelExercise", () => {
  it("refuses an exercise outside the pool", () => {
    expect(getDuelExercise("sweep_neoclassical")).toBeNull();
    expect(getDuelExercise("nope")).toBeNull();
  });
});

describe("drawDuelExercise", () => {
  it("stays inside the pool at both ends of the random range", () => {
    expect(drawDuelExercise(() => 0)).toBe(DUEL_POOL[0]);
    expect(drawDuelExercise(() => 0.999999)).toBe(DUEL_POOL[DUEL_POOL.length - 1]);
  });
});
