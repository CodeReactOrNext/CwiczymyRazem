import { describe, expect, it } from "vitest";

import { sumSkillMinutesByCategory, toSkillTimeGained } from "./sessionSkills";

describe("sessionSkills", () => {
  it("adds each skill's minutes to its own category", () => {
    expect(
      sumSkillMinutesByCategory({
        legato: 10,
        tapping: 5,
        chords: 15,
        ear_training: 0,
      }),
    ).toEqual({ technique: 15, theory: 15, hearing: 0, creativity: 0 });
  });

  it("reports ms per skill, leaving out empty and unknown skills", () => {
    expect(
      toSkillTimeGained({ legato: 2, chords: 0, removed_skill: 9 }),
    ).toEqual({
      legato: 120_000,
    });
  });
});
