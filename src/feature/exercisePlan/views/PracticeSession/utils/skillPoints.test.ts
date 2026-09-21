import type { DifficultyLevel, Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { computeSkillPointsGained } from "./skillPoints";

const exercise = (difficulty: DifficultyLevel, relatedSkills: string[]) =>
  ({ difficulty, relatedSkills } as unknown as Exercise);

describe("computeSkillPointsGained", () => {
  it("scores only the exercises listed as completed", () => {
    const exercises = [
      exercise("easy", ["alternatePicking"]),
      exercise("hard", ["legato"]),
    ];

    expect(computeSkillPointsGained(exercises, [0])).toEqual({ alternatePicking: 1 });
  });

  it("scales the points with the difficulty", () => {
    const exercises = [
      exercise("beginner", ["a"]),
      exercise("easy", ["b"]),
      exercise("medium", ["c"]),
      exercise("hard", ["d"]),
    ];

    expect(computeSkillPointsGained(exercises, [0, 1, 2, 3])).toEqual({
      a: 1, b: 1, c: 2, d: 3,
    });
  });

  it("adds up exercises that train the same skill", () => {
    const exercises = [
      exercise("medium", ["bending", "vibrato"]),
      exercise("hard", ["bending"]),
    ];

    expect(computeSkillPointsGained(exercises, [0, 1])).toEqual({
      bending: 5, vibrato: 2,
    });
  });

  it("returns nothing when no exercise was completed", () => {
    expect(computeSkillPointsGained([exercise("hard", ["legato"])], [])).toEqual({});
  });

  it("skips exercises that train no skill", () => {
    expect(computeSkillPointsGained([exercise("hard", [])], [0])).toEqual({});
  });
});
