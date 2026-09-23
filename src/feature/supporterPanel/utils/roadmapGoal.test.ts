import { describe, expect, it } from "vitest";

import { displayDescription, displayGoal, displayTitle } from "./roadmapGoal";

describe("displayGoal", () => {
  it("drops the level the generator appends to the goal", () => {
    expect(
      displayGoal({
        id: "r",
        title: "",
        goal: "Get back into playing. Advanced level.",
      }),
    ).toBe("Get back into playing.");
  });

  it("falls back to the title when there is no goal", () => {
    expect(displayGoal({ id: "r", title: "Plan: shred", goal: "" })).toBe(
      "Plan: shred",
    );
  });
});

describe("displayTitle and displayDescription", () => {
  it("names a roadmap by its title and describes it by its goal", () => {
    const summary = {
      id: "r",
      title: "Mark Knopfler",
      goal: "Fingerstyle patterns. Intermediate level.",
    };
    expect(displayTitle(summary)).toBe("Mark Knopfler");
    expect(displayDescription(summary)).toBe("Fingerstyle patterns.");
  });

  it("falls back to the goal and drops a description that repeats it", () => {
    const summary = { id: "r", title: "", goal: "Play blues" };
    expect(displayTitle(summary)).toBe("Play blues");
    expect(displayDescription(summary)).toBeNull();
  });
});
