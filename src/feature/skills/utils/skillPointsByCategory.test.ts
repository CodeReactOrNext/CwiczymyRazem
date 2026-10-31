import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getSkillPointsByCategory } from "feature/skills/utils/skillPointsByCategory";
import { describe, expect, it } from "vitest";

describe("getSkillPointsByCategory", () => {
  it("lists every catalogue skill exactly once, at 0 without data", () => {
    const groups = getSkillPointsByCategory(undefined);
    const ids = groups.flatMap((group) => group.skills.map((e) => e.skill.id));

    expect(ids.sort()).toEqual(guitarSkills.map((skill) => skill.id).sort());
    expect(groups.every((group) => group.total === 0)).toBe(true);
  });

  it("sums points per category and puts the strongest skill first", () => {
    const groups = getSkillPointsByCategory({
      legato: 3,
      alternate_picking: 7,
    });
    const technique = groups.find((group) => group.category === "technique")!;

    expect(technique.total).toBe(10);
    expect(technique.skills[0]).toMatchObject({
      skill: { id: "alternate_picking" },
      points: 7,
    });
    expect(technique.skills[1]).toMatchObject({
      skill: { id: "legato" },
      points: 3,
    });
  });

  it("carries each skill's time and ranks by it when points tie", () => {
    const groups = getSkillPointsByCategory(
      {},
      { tapping: 60_000, legato: 300_000 },
    );
    const technique = groups.find((group) => group.category === "technique")!;

    expect(technique.skills[0]).toMatchObject({
      skill: { id: "legato" },
      timeMs: 300_000,
    });
    expect(technique.skills[1]).toMatchObject({
      skill: { id: "tapping" },
      timeMs: 60_000,
    });
  });

  it("ignores stored ids the catalogue no longer has", () => {
    const groups = getSkillPointsByCategory({ removed_skill: 99 });
    expect(groups.reduce((sum, group) => sum + group.total, 0)).toBe(0);
  });
});
