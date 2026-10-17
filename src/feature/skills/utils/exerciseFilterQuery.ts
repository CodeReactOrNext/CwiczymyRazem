import { PRACTICE_MODES,type PracticeMode } from "feature/exercisePlan/utils/getExerciseModes";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import {
  type ExerciseBrowseFilters,
  LENGTH_IDS,
  type LengthId,
  STATUS_IDS,
  type StatusId,
} from "feature/skills/hooks/exerciseBrowseFiltersStore";
import type { GuitarSkillId } from "feature/skills/skills.types";
import type { ParsedUrlQuery } from "querystring";

/** The part of the Browse Exercises filters a link (or a pinned shortcut) can carry. */
export type ExerciseFilterPreset = Pick<
  ExerciseBrowseFilters,
  "searchQuery" | "selectedSkills" | "selectedModes" | "selectedStatuses" | "selectedLength"
>;

/** Query params read by the Browse Exercises tab, removed from the URL once applied. */
export const EXERCISE_FILTER_QUERY_KEYS = ["q", "skills", "modes", "status", "length"] as const;

const SKILL_IDS = new Set<string>(guitarSkills.map(skill => skill.id));

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** Comma-separated values, keeping only the ones the app still knows. */
const listParam = <T extends string>(
  value: string | string[] | undefined,
  isKnown: (entry: string) => boolean
): T[] => {
  const raw = firstValue(value);
  if (!raw) return [];
  const entries = raw.split(",").map(entry => entry.trim());
  return Array.from(new Set(entries.filter(isKnown))) as T[];
};

export const hasExerciseFilterQuery = (query: ParsedUrlQuery): boolean =>
  EXERCISE_FILTER_QUERY_KEYS.some(key => query[key] !== undefined);

/**
 * Reads filters from a URL query. Unknown skills, modes or statuses (renamed
 * or removed since the link was made) are dropped rather than failing.
 */
export const parseExerciseFilterQuery = (query: ParsedUrlQuery): ExerciseFilterPreset => {
  const length = firstValue(query.length);
  return {
    searchQuery: (firstValue(query.q) ?? "").trim(),
    selectedSkills: listParam<GuitarSkillId>(query.skills, entry => SKILL_IDS.has(entry)),
    selectedModes: listParam<PracticeMode>(query.modes, entry =>
      (PRACTICE_MODES as string[]).includes(entry)
    ),
    selectedStatuses: listParam<StatusId>(query.status, entry =>
      (STATUS_IDS as readonly string[]).includes(entry)
    ),
    selectedLength: length && (LENGTH_IDS as readonly string[]).includes(length)
      ? (length as LengthId)
      : null,
  };
};

/** A link to the Browse Exercises tab that opens with exactly these filters. */
export const buildExerciseFilterHref = (preset: ExerciseFilterPreset): string => {
  const params = new URLSearchParams({ tab: "browse" });
  const search = preset.searchQuery.trim();
  if (search) params.set("q", search);
  if (preset.selectedSkills.length) params.set("skills", preset.selectedSkills.join(","));
  if (preset.selectedModes.length) params.set("modes", preset.selectedModes.join(","));
  if (preset.selectedStatuses.length) params.set("status", preset.selectedStatuses.join(","));
  if (preset.selectedLength) params.set("length", preset.selectedLength);
  return `/profile/skills?${params.toString()}`;
};
