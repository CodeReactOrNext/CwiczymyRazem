import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_EXERCISE_BROWSE_FILTERS,
  useExerciseBrowseFilters,
} from "./exerciseBrowseFiltersStore";

describe("exerciseBrowseFiltersStore", () => {
  beforeEach(() => {
    useExerciseBrowseFilters.getState().reset();
  });

  it("sets a filter to a plain value", () => {
    useExerciseBrowseFilters.getState().setFilter("searchQuery", "shred");
    expect(useExerciseBrowseFilters.getState().searchQuery).toBe("shred");
  });

  it("applies updater functions to the previous value", () => {
    const { setFilter } = useExerciseBrowseFilters.getState();
    setFilter("selectedModes", prev => [...prev, "noGuitar"]);
    setFilter("selectedModes", prev => [...prev, "ear"]);
    expect(useExerciseBrowseFilters.getState().selectedModes).toEqual(["noGuitar", "ear"]);
  });

  it("keeps filters between reads, as after the tab remounts", () => {
    useExerciseBrowseFilters.getState().setFilter("selectedLength", "short");
    expect(useExerciseBrowseFilters.getState().selectedLength).toBe("short");
  });

  it("resets to defaults", () => {
    const { setFilter, reset } = useExerciseBrowseFilters.getState();
    setFilter("expandedSets", ["click-hunt"]);
    reset();
    expect(useExerciseBrowseFilters.getState()).toMatchObject(DEFAULT_EXERCISE_BROWSE_FILTERS);
  });
});
