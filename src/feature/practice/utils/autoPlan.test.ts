import type {
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
} from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  countExercises,
  filterExercises,
  isEverythingSelected,
  isFilterEmpty,
  matchesFilter,
  pickExercisesWithinTime,
  selectAllAvailable,
  toggleCategory,
  toggleDifficulty,
  toggleDifficultyEverywhere,
} from "./autoPlan";

const makeExercise = (
  id: string,
  category: ExerciseCategory,
  difficulty: DifficultyLevel,
  timeInMinutes = 10,
): Exercise =>
  ({
    id,
    category,
    difficulty,
    timeInMinutes,
    title: id,
    description: id,
    instructions: [],
    tips: [],
    metronomeSpeed: null,
    relatedSkills: [],
  }) as unknown as Exercise;

describe("isFilterEmpty", () => {
  it("treats a filter with only empty categories as empty", () => {
    expect(isFilterEmpty({})).toBe(true);
    expect(isFilterEmpty({ technique: [], hearing: [] })).toBe(true);
    expect(isFilterEmpty({ technique: ["easy"] })).toBe(false);
  });
});

describe("toggleDifficulty", () => {
  it("adds and removes a single difficulty inside one category", () => {
    const withEasy = toggleDifficulty({}, "technique", "easy");
    expect(withEasy).toEqual({ technique: ["easy"] });

    expect(toggleDifficulty(withEasy, "technique", "easy")).toEqual({
      technique: [],
    });
  });

  it("keeps difficulties in beginner→hard order regardless of click order", () => {
    const filter = toggleDifficulty(
      toggleDifficulty({}, "theory", "hard"),
      "theory",
      "easy",
    );

    expect(filter.theory).toEqual(["easy", "hard"]);
  });

  it("leaves the other categories untouched", () => {
    const filter = toggleDifficulty(
      { hearing: ["easy"] },
      "technique",
      "medium",
    );

    expect(filter).toEqual({ hearing: ["easy"], technique: ["medium"] });
  });
});

describe("toggleCategory", () => {
  it("selects every difficulty, then clears them all", () => {
    const all = toggleCategory({}, "technique");
    expect(all.technique).toEqual(["beginner", "easy", "medium", "hard"]);

    expect(toggleCategory(all, "technique").technique).toEqual([]);
  });

  it("completes a partially selected category instead of clearing it", () => {
    expect(toggleCategory({ theory: ["easy"] }, "theory").theory).toEqual([
      "beginner",
      "easy",
      "medium",
      "hard",
    ]);
  });
});

describe("toggleDifficultyEverywhere", () => {
  it("adds the difficulty to every category when at least one is missing it", () => {
    const filter = toggleDifficultyEverywhere({ technique: ["easy"] }, "easy");

    expect(filter).toEqual({
      technique: ["easy"],
      theory: ["easy"],
      creativity: ["easy"],
      hearing: ["easy"],
    });
  });

  it("removes the difficulty everywhere once all categories have it", () => {
    const all = toggleDifficultyEverywhere({}, "hard");
    const cleared = toggleDifficultyEverywhere(all, "hard");

    expect(isFilterEmpty(cleared)).toBe(true);
  });

  it("does not disturb difficulties picked in other columns", () => {
    const filter = toggleDifficultyEverywhere({ hearing: ["medium"] }, "easy");

    expect(filter.hearing).toEqual(["easy", "medium"]);
  });
});

describe("selectAllAvailable", () => {
  const counts = countExercises([
    makeExercise("a", "technique", "easy"),
    makeExercise("b", "technique", "hard"),
    makeExercise("c", "hearing", "medium"),
  ]);

  it("picks every pair that has exercises behind it and skips the empty ones", () => {
    expect(selectAllAvailable(counts)).toEqual({
      technique: ["easy", "hard"],
      hearing: ["medium"],
    });
  });

  it("reports when there is nothing left to select", () => {
    expect(isEverythingSelected(selectAllAvailable(counts), counts)).toBe(true);
    expect(isEverythingSelected({ technique: ["easy"] }, counts)).toBe(false);
    expect(isEverythingSelected({}, counts)).toBe(false);
  });

  it("selects nothing when there are no exercises at all", () => {
    expect(selectAllAvailable({})).toEqual({});
  });
});

describe("matchesFilter", () => {
  const exercise = makeExercise("a", "technique", "medium");

  it("accepts everything while the filter is empty", () => {
    expect(matchesFilter(exercise, {})).toBe(true);
  });

  it("matches only the difficulties picked for the exercise's own category", () => {
    expect(matchesFilter(exercise, { technique: ["medium"] })).toBe(true);
    expect(matchesFilter(exercise, { technique: ["easy"] })).toBe(false);
    expect(matchesFilter(exercise, { theory: ["medium"] })).toBe(false);
  });
});

describe("filterExercises", () => {
  const exercises = [
    makeExercise("tech-medium", "technique", "medium"),
    makeExercise("tech-hard", "technique", "hard"),
    makeExercise("hearing-easy", "hearing", "easy"),
    makeExercise("hearing-hard", "hearing", "hard"),
    makeExercise("theory-easy", "theory", "easy"),
  ];

  it("keeps a different difficulty per category", () => {
    const kept = filterExercises(exercises, {
      technique: ["medium"],
      hearing: ["easy"],
    });

    expect(kept.map((exercise) => exercise.id)).toEqual([
      "tech-medium",
      "hearing-easy",
    ]);
  });

  it("returns everything when nothing is picked", () => {
    expect(filterExercises(exercises, { technique: [] })).toHaveLength(
      exercises.length,
    );
  });
});

describe("countExercises", () => {
  it("counts each category × difficulty pair", () => {
    const counts = countExercises([
      makeExercise("a", "technique", "easy"),
      makeExercise("b", "technique", "easy"),
      makeExercise("c", "technique", "hard"),
      makeExercise("d", "hearing", "easy"),
    ]);

    expect(counts.technique?.easy).toBe(2);
    expect(counts.technique?.hard).toBe(1);
    expect(counts.hearing?.easy).toBe(1);
    expect(counts.theory?.easy).toBeUndefined();
  });
});

describe("pickExercisesWithinTime", () => {
  // Fisher-Yates with a random() this close to 1 always swaps an element with itself.
  const keepOrder = () => 0.999999;

  it("never exceeds the available time", () => {
    const picked = pickExercisesWithinTime(
      [
        makeExercise("a", "technique", "easy", 20),
        makeExercise("b", "technique", "easy", 20),
        makeExercise("c", "technique", "easy", 20),
      ],
      30,
      keepOrder,
    );

    expect(
      picked.reduce((sum, exercise) => sum + exercise.timeInMinutes, 0),
    ).toBeLessThanOrEqual(30);
  });

  it("spreads the plan across categories instead of draining the biggest one", () => {
    const picked = pickExercisesWithinTime(
      [
        ...Array.from({ length: 10 }, (_, index) =>
          makeExercise(`tech-${index}`, "technique", "medium", 5),
        ),
        makeExercise("hearing-1", "hearing", "easy", 5),
        makeExercise("hearing-2", "hearing", "easy", 5),
      ],
      30,
      keepOrder,
    );

    expect(picked.some((exercise) => exercise.category === "hearing")).toBe(
      true,
    );
  });

  it("skips exercises that no longer fit and keeps filling the slot", () => {
    const picked = pickExercisesWithinTime(
      [
        makeExercise("long", "technique", "easy", 25),
        makeExercise("too-long-now", "technique", "easy", 20),
        makeExercise("short", "technique", "easy", 5),
      ],
      30,
      keepOrder,
    );

    expect(picked.map((exercise) => exercise.id)).toEqual(["long", "short"]);
  });

  it("falls back to the shortest exercise when nothing fits", () => {
    const picked = pickExercisesWithinTime(
      [
        makeExercise("long", "technique", "easy", 60),
        makeExercise("shortest", "theory", "easy", 45),
      ],
      15,
      keepOrder,
    );

    expect(picked.map((exercise) => exercise.id)).toEqual(["shortest"]);
  });

  it("returns nothing for an empty pool", () => {
    expect(pickExercisesWithinTime([], 30, keepOrder)).toEqual([]);
  });
});
