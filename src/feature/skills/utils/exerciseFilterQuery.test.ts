import { describe, expect, it } from "vitest";

import {
  buildExerciseFilterHref,
  type ExerciseFilterPreset,
  hasExerciseFilterQuery,
  parseExerciseFilterQuery,
} from "./exerciseFilterQuery";

const EMPTY: ExerciseFilterPreset = {
  searchQuery: "",
  selectedSkills: [],
  selectedModes: [],
  selectedStatuses: [],
  selectedLength: null,
};

const queryOf = (href: string) =>
  Object.fromEntries(new URL(href, "https://riff.quest").searchParams);

describe("exerciseFilterQuery", () => {
  it("links to the browse tab with no filter params when nothing is set", () => {
    expect(buildExerciseFilterHref(EMPTY)).toBe("/profile/skills?tab=browse");
  });

  it("round-trips every filter through the URL", () => {
    const preset: ExerciseFilterPreset = {
      searchQuery: "warm up",
      selectedSkills: ["alternate_picking"],
      selectedModes: ["noGuitar", "ear"],
      selectedStatuses: ["inProgress"],
      selectedLength: "short",
    };
    const query = queryOf(buildExerciseFilterHref(preset));
    expect(query.tab).toBe("browse");
    expect(hasExerciseFilterQuery(query)).toBe(true);
    expect(parseExerciseFilterQuery(query)).toEqual(preset);
  });

  it("drops values the app no longer knows", () => {
    expect(
      parseExerciseFilterQuery({
        modes: "noGuitar,kazoo",
        skills: "not_a_skill",
        status: "mastered,bogus",
        length: "forever",
      })
    ).toEqual({ ...EMPTY, selectedModes: ["noGuitar"], selectedStatuses: ["mastered"] });
  });

  it("ignores queries without filter params", () => {
    expect(hasExerciseFilterQuery({ tab: "browse", exerciseId: "x" })).toBe(false);
  });
});
