import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { describe, expect, it } from "vitest";

import {
  EXERCISE_CATALOG,
  findCatalogEntry,
  isCatalogExerciseId,
  renderExerciseCatalog,
} from "./exerciseCatalog";

const playalongs = exercisesAgregat.filter((exercise) => exercise.isPlayalong);

describe("the catalog the roadmap generator sees", () => {
  it("has play-alongs to leave out in the first place", () => {
    // Guards the filter below against quietly passing on an empty set.
    expect(playalongs.length).toBeGreaterThan(0);
  });

  it("leaves every play-along out", () => {
    const listed = new Set(EXERCISE_CATALOG.map((entry) => entry.id));

    playalongs.forEach((exercise) => {
      expect(listed.has(exercise.id), exercise.id).toBe(false);
    });
    expect(EXERCISE_CATALOG).toHaveLength(
      exercisesAgregat.length - playalongs.length,
    );
  });

  it("keeps everything that is not a play-along", () => {
    const listed = new Set(EXERCISE_CATALOG.map((entry) => entry.id));

    exercisesAgregat
      .filter((exercise) => !exercise.isPlayalong)
      .forEach((exercise) => {
        expect(listed.has(exercise.id), exercise.id).toBe(true);
      });
  });

  it("never renders a play-along into the prompt", () => {
    const rendered = renderExerciseCatalog();

    playalongs.forEach((exercise) => {
      expect(rendered.includes(`${exercise.id} |`), exercise.id).toBe(false);
    });
  });

  // The converter validates the model's pick through these two, so a
  // play-along named anyway is dropped from the step rather than assigned.
  it("refuses a play-along id however it arrives", () => {
    const [playalong] = playalongs;

    expect(isCatalogExerciseId(playalong.id)).toBe(false);
    expect(findCatalogEntry(playalong.id)).toBeUndefined();
  });

  it("still finds an ordinary exercise", () => {
    expect(isCatalogExerciseId("one_chord_improv")).toBe(true);
    expect(findCatalogEntry("one_chord_improv")?.title).toBe(
      "Improv — One Chord",
    );
    expect(findCatalogEntry(null)).toBeUndefined();
  });
});
