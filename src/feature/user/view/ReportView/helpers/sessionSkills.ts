import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";

import { MINUTE_MS } from "./sessionSongs";

/** Minutes the player typed against each skill, by skill id. */
export type SkillMinutes = Record<string, number>;

/** Same ceiling a song's category box has — eight hours on one skill. */
export const MAX_SKILL_MINUTES = 480;

const CATEGORY_BY_SKILL = new Map<string, CategoryKeys>(
  guitarSkills.map((skill) => [skill.id, skill.category]),
);

/**
 * The category boxes a by-skill log fills in: each skill's minutes go to the
 * category it belongs to. That keeps scoring, validation and the total-time
 * readout reading the same four fields as a by-category log.
 */
export const sumSkillMinutesByCategory = (
  skillMinutes: SkillMinutes,
): Record<CategoryKeys, number> => {
  const totals: Record<CategoryKeys, number> = {
    technique: 0,
    theory: 0,
    hearing: 0,
    creativity: 0,
  };
  Object.entries(skillMinutes).forEach(([skillId, minutes]) => {
    const category = CATEGORY_BY_SKILL.get(skillId);
    if (category && minutes > 0) totals[category] += minutes;
  });
  return totals;
};

/** The `skillTimeGained` a by-skill log reports, in ms. */
export const toSkillTimeGained = (
  skillMinutes: SkillMinutes,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(skillMinutes)
      .filter(
        ([skillId, minutes]) => CATEGORY_BY_SKILL.has(skillId) && minutes > 0,
      )
      .map(([skillId, minutes]) => [skillId, minutes * MINUTE_MS]),
  );
