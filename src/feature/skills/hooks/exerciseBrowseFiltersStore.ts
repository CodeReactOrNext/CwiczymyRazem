import type { PracticeMode } from "feature/exercisePlan/utils/getExerciseModes";
import type { GuitarSkillId } from "feature/skills/skills.types";
import type { SetStateAction } from "react";
import { create } from "zustand";

export const STATUS_IDS = ["new", "untouched", "inProgress", "mastered", "favorite"] as const;
export type StatusId = (typeof STATUS_IDS)[number];
export const LENGTH_IDS = ["short", "mid", "long"] as const;
export type LengthId = (typeof LENGTH_IDS)[number];

export interface ExerciseBrowseFilters {
  searchQuery: string;
  selectedSkills: GuitarSkillId[];
  selectedModes: PracticeMode[];
  selectedStatuses: StatusId[];
  selectedLength: LengthId | null;
  expandedSets: string[];
  showMoreFilters: boolean;
}

interface ExerciseBrowseFiltersState extends ExerciseBrowseFilters {
  setFilter: <K extends keyof ExerciseBrowseFilters>(
    key: K,
    value: SetStateAction<ExerciseBrowseFilters[K]>
  ) => void;
  reset: () => void;
  /** Starts over from the defaults with these filters on top (e.g. from a link). */
  applyPreset: (preset: Partial<ExerciseBrowseFilters>) => void;
}

export const DEFAULT_EXERCISE_BROWSE_FILTERS: ExerciseBrowseFilters = {
  searchQuery: "",
  selectedSkills: [],
  selectedModes: [],
  selectedStatuses: [],
  selectedLength: null,
  expandedSets: [],
  showMoreFilters: false,
};

/**
 * Filters of the Browse Exercises tab, kept outside the component.
 *
 * Starting an exercise unmounts the whole tab (and finishing it goes through
 * /report), so local state came back empty. Living in module memory, the
 * filters survive that round trip; a full reload still starts clean, which
 * also keeps SSR and the first client render in agreement.
 */
export const useExerciseBrowseFilters = create<ExerciseBrowseFiltersState>()((set) => ({
  ...DEFAULT_EXERCISE_BROWSE_FILTERS,
  setFilter: (key, value) =>
    set((state) => ({
      [key]:
        typeof value === "function"
          ? (value as (prev: ExerciseBrowseFilters[typeof key]) => ExerciseBrowseFilters[typeof key])(state[key])
          : value,
    })),
  reset: () => set(DEFAULT_EXERCISE_BROWSE_FILTERS),
  applyPreset: (preset) => set({ ...DEFAULT_EXERCISE_BROWSE_FILTERS, ...preset }),
}));
