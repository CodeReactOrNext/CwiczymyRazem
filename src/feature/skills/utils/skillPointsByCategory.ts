import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";

export const SKILL_CATEGORY_ORDER: CategoryKeys[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];

export interface SkillPointsEntry {
  skill: GuitarSkill;
  points: number;
  /** All-time practice on this skill, in ms. */
  timeMs: number;
}

export interface SkillCategoryPoints {
  category: CategoryKeys;
  total: number;
  skills: SkillPointsEntry[];
}

/**
 * Every known skill grouped under its category, with the player's points and
 * time.
 *
 * Skills the player has never touched stay in the list at 0 — the tab is also
 * where a player sees what they have been neglecting. Within a category the
 * strongest skill leads (points, then time); ties keep the catalogue order.
 */
export const getSkillPointsByCategory = (
  unlockedSkills: UserSkills["unlockedSkills"] | undefined,
  timeSpent?: UserSkills["timeSpent"],
): SkillCategoryPoints[] =>
  SKILL_CATEGORY_ORDER.map((category) => {
    const skills = guitarSkills
      .filter((skill) => skill.category === category)
      .map((skill) => ({
        skill,
        points: unlockedSkills?.[skill.id] ?? 0,
        timeMs: timeSpent?.[skill.id] ?? 0,
      }))
      .sort((a, b) => b.points - a.points || b.timeMs - a.timeMs);

    return {
      category,
      total: skills.reduce((sum, entry) => sum + entry.points, 0),
      skills,
    };
  });
