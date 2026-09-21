import type { AchievementList } from "feature/achievements/types";
import { describe, expect, it } from "vitest";

import { buildAchievementStatsUpdate } from "./achievementStatsUpdate";

const ids = (...list: string[]) => list as AchievementList[];

/** Stands in for `FieldValue.increment`, so the shape can be read in a snapshot. */
const inc = (by: number) => ({ __increment: by });

describe("buildAchievementStatsUpdate", () => {
  it("nests the counters under `counts` instead of naming fields with a dot", () => {
    // The regression this file exists for: a key of `counts.rig_50` survives
    // `update()` but not `set(…, { merge: true })`, where it becomes a
    // top-level field the panel never reads. See the module comment.
    const update = buildAchievementStatsUpdate(ids("rig_50", "first_rare"), false, inc);

    expect(update).toEqual({
      counts: { rig_50: { __increment: 1 }, first_rare: { __increment: 1 } },
    });
    expect(Object.keys(update ?? {}).some((key) => key.includes("."))).toBe(false);
  });

  it("counts a badge once even if the report grants it twice", () => {
    const update = buildAchievementStatsUpdate(ids("rig_50", "rig_50"), false, inc);

    expect(update).toEqual({ counts: { rig_50: { __increment: 1 } } });
  });

  it("bumps the denominator only on the report that crosses the line", () => {
    expect(buildAchievementStatsUpdate(ids(), true, inc)).toEqual({
      totalPlayers: { __increment: 1 },
    });
    expect(buildAchievementStatsUpdate(ids("rig_50"), true, inc)).toEqual({
      counts: { rig_50: { __increment: 1 } },
      totalPlayers: { __increment: 1 },
    });
  });

  it("asks for no write when a report moves neither", () => {
    // Most reports. Writing `{}` would still cost a document write and bump
    // nothing, so the route skips the round trip entirely.
    expect(buildAchievementStatsUpdate(ids(), false, inc)).toBeNull();
  });
});
