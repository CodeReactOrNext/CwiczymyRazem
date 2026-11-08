import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { SCALE_TREE_NODES } from "feature/scaleTree/data/scaleTreeNodes";
import { describe, expect, it } from "vitest";

import {
  checkUserDocGoal,
  hasBossRun,
  hasCalendarItems,
  hasClearedScale,
  hasClearedTempo,
  hasJourneyStep,
  hasSecondDayInStats,
  hasWeeklyClaim,
  SETTLED_SESSION_COUNT,
  spansTwoDays,
} from "./featureGoalChecks";

describe("checkUserDocGoal", () => {
  it("reads sessions, guitars and badges off the statistics and the stash", () => {
    expect(checkUserDocGoal("first_session", {})).toBe(false);
    expect(
      checkUserDocGoal("first_session", { statistics: { sessionCount: 1 } }),
    ).toBe(true);
    expect(
      checkUserDocGoal("first_guitar", { arsenal: { inventory: [{ id: "g" }] } }),
    ).toBe(true);
    expect(
      checkUserDocGoal("achievement", { statistics: { achievements: ["x"] } }),
    ).toBe(true);
  });

  it("wants time in all four categories", () => {
    const time = { technique: 5, theory: 5, hearing: 5, creativity: 0 };
    expect(
      checkUserDocGoal("all_categories", { statistics: { time } }),
    ).toBe(false);
    expect(
      checkUserDocGoal("all_categories", {
        statistics: { time: { ...time, creativity: 1 } },
      }),
    ).toBe(true);
  });

  it("does not take the starter guitar for an opened case", () => {
    expect(
      checkUserDocGoal("open_case", { arsenal: { dexGuitars: ["starter"] } }),
    ).toBe(false);
    expect(
      checkUserDocGoal("open_case", {
        arsenal: { dexGuitars: ["starter"], dexEffects: ["fuzz"] },
      }),
    ).toBe(true);
    expect(checkUserDocGoal("open_case", { casePity: { basic: {} } })).toBe(
      true,
    );
  });

  it("counts a favourite of any kind", () => {
    expect(checkUserDocGoal("favorite", { favoriteExerciseIds: [] })).toBe(false);
    expect(checkUserDocGoal("favorite", { favoriteSongIds: ["s"] })).toBe(true);
  });

  it("counts a rig only once it differs from the one everybody starts with", () => {
    expect(checkUserDocGoal("rig", { arsenal: { rig: DEFAULT_RIG } })).toBe(
      false,
    );
    expect(
      checkUserDocGoal("rig", {
        arsenal: { rig: { ...DEFAULT_RIG, ampId: "amp-1" } },
      }),
    ).toBe(true);
  });

  it("counts a guild by its id", () => {
    expect(checkUserDocGoal("guild", { guildId: "" })).toBe(false);
    expect(checkUserDocGoal("guild", { guildId: "g1" })).toBe(true);
  });
});

describe("hasSecondDayInStats", () => {
  it("counts a best streak of two days, or an account that is not new", () => {
    expect(hasSecondDayInStats({})).toBe(false);
    expect(
      hasSecondDayInStats({ statistics: { sessionCount: 3, dayWithoutBreak: 1 } }),
    ).toBe(false);
    expect(hasSecondDayInStats({ statistics: { dayWithoutBreak: 2 } })).toBe(
      true,
    );
    expect(
      hasSecondDayInStats({
        statistics: { sessionCount: SETTLED_SESSION_COUNT },
      }),
    ).toBe(true);
  });
});

describe("spansTwoDays", () => {
  it("needs two logs on different days", () => {
    expect(spansTwoDays(undefined, undefined)).toBe(false);
    expect(
      spansTwoDays("2026-11-01T10:00:00.000Z", "2026-11-01T10:00:00.000Z"),
    ).toBe(false);
    expect(
      spansTwoDays("2026-11-01T10:00:00.000Z", "2026-11-01T18:00:00.000Z", "UTC"),
    ).toBe(false);
    expect(
      spansTwoDays("2026-11-01T10:00:00.000Z", "2026-11-02T08:00:00.000Z", "UTC"),
    ).toBe(true);
  });

  it("reads the day in the player's own time zone", () => {
    // 23:30 and 00:30 UTC are the same evening in New York.
    expect(
      spansTwoDays(
        "2026-11-01T23:30:00.000Z",
        "2026-11-02T00:30:00.000Z",
        "America/New_York",
      ),
    ).toBe(false);
  });
});

describe("tempo progress", () => {
  it("counts any cleared tempo for the skill tree", () => {
    expect(hasClearedTempo(new Map([["a", []]]))).toBe(false);
    expect(hasClearedTempo(new Map([["a", [80]]]))).toBe(true);
  });

  it("counts the scale tree only at a scale exercise's own tempo", () => {
    const req = SCALE_TREE_NODES[0].requiredExercises[0];
    expect(hasClearedScale(new Map([[req.exerciseId, [1]]]))).toBe(false);
    expect(
      hasClearedScale(new Map([[req.exerciseId, [req.requiredBpm]]])),
    ).toBe(true);
  });
});

describe("settings documents", () => {
  it("reads Journey, calendar, bosses and weekly goals", () => {
    expect(hasJourneyStep(undefined)).toBe(false);
    expect(
      hasJourneyStep({
        moduleProgress: { m: { steps: { s: { completed: true } } } },
      }),
    ).toBe(true);
    expect(hasCalendarItems({ days: { "2026-11-08": [] } })).toBe(false);
    expect(hasCalendarItems({ days: { "2026-11-08": [{ id: "i" }] } })).toBe(
      true,
    );
    expect(hasBossRun({ colossus: { runs: 0, bestPhase: 0 } })).toBe(false);
    expect(hasBossRun({ colossus: { runs: 2 } })).toBe(true);
    expect(hasWeeklyClaim({ claims: {} })).toBe(false);
    expect(hasWeeklyClaim({ claims: { 1: { weekKey: "w" } } })).toBe(true);
  });
});
