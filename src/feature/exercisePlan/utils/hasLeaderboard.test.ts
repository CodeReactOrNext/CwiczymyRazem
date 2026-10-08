import { describe, expect, it } from "vitest";

import { hasLeaderboard } from "./hasLeaderboard";

describe("hasLeaderboard", () => {
  it("keeps the board for a regular exercise", () => {
    expect(hasLeaderboard({ id: "spider_walk" })).toBe(true);
  });

  it("drops it for the configurable entry exercises", () => {
    expect(hasLeaderboard({ id: "scale_practice_configurable" })).toBe(false);
    expect(hasLeaderboard({ id: "chord_practice_configurable" })).toBe(false);
  });

  it("drops it for a generated exercise", () => {
    expect(
      hasLeaderboard({
        id: "scale_a_minor_pentatonic_ascending_descending_pos1",
        _generatorConfig: { rootNote: "A" },
      })
    ).toBe(false);
  });
});
