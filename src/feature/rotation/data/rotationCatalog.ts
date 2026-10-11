import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill } from "feature/skills/skills.types";

export const EXERCISES_BY_ID = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

export const SKILLS_BY_ID = new Map<string, GuitarSkill>(
  guitarSkills.map((skill) => [skill.id, skill]),
);

/** Skills a skill item can actually play — at least one exercise trains them. */
export const PLAYABLE_SKILLS = guitarSkills.filter((skill) =>
  exercisesAgregat.some((exercise) =>
    exercise.relatedSkills.includes(skill.id),
  ),
);
