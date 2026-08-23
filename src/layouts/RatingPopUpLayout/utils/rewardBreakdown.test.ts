import { describe, expect, it } from "vitest";

import type { BreakdownRow } from "./rewardBreakdown";
import { buildFameBreakdown, buildPointsBreakdown } from "./rewardBreakdown";

const sum = (rows: BreakdownRow[]) => rows.reduce((acc, row) => acc + row.amount, 0);

const rowFor = (rows: BreakdownRow[], key: string) => rows.find((row) => row.key === key);

describe("buildFameBreakdown", () => {
  it("splits a session into practice, streak and rig", () => {
    const rows = buildFameBreakdown({
      fame: 46,
      streakBonus: 15,
      streakDays: 30,
      rigBonus: 14,
      chainBonus: 4,
      traitBonus: 2,
    });

    expect(rows.map((row) => [row.key, row.amount])).toEqual([
      ["practice", 11],
      ["streak", 15],
      ["rig", 20],
    ]);
    expect(sum(rows)).toBe(46);
  });

  it("keeps adding up when a component is missing from the report", () => {
    // A report filed before traits existed: the 2 fame they paid has no field of
    // its own, so it lands on the practice line rather than going missing.
    const rows = buildFameBreakdown({ fame: 46, streakBonus: 15, rigBonus: 18 });

    expect(sum(rows)).toBe(46);
    expect(rowFor(rows, "practice")).toMatchObject({ amount: 13 });
  });

  it("names the streak row after the streak", () => {
    const rows = buildFameBreakdown({ fame: 20, streakBonus: 8, streakDays: 7 });

    expect(rowFor(rows, "streak")?.label).toBe("7-day streak");
  });

  it("does not name a streak the bonus cannot have come from", () => {
    // 7 days pay 8, so a 15 next to them means the counters disagree — the row
    // says nothing rather than something arithmetically impossible.
    const rows = buildFameBreakdown({ fame: 30, streakBonus: 15, streakDays: 7 });

    expect(rowFor(rows, "streak")?.label).toBe("Daily streak");
  });

  it("falls back to a generic streak label on day one", () => {
    const rows = buildFameBreakdown({ fame: 20, streakBonus: 3, streakDays: 1 });

    expect(rowFor(rows, "streak")?.label).toBe("Daily streak");
  });

  it("quotes the accuracy bonus as a multiplier, not as fame", () => {
    const rows = buildFameBreakdown({ fame: 20, accuracyBonus: true });

    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(20);
    expect(rows[0].subs).toEqual([
      { key: "accuracy", label: "Clean playing", value: "×1.25" },
    ]);
  });

  it("lists every rig source, including the ones that paid nothing", () => {
    const rows = buildFameBreakdown({ fame: 30, rigBonus: 10 });

    expect(rowFor(rows, "rig")?.subs).toEqual([
      { key: "level", label: "Rig level", value: "+10", muted: false },
      { key: "chain", label: "Signal path", value: "—", muted: true },
      { key: "traits", label: "Traits", value: "—", muted: true },
    ]);
  });

  it("drops rows that earned nothing", () => {
    expect(buildFameBreakdown({ fame: 12 }).map((row) => row.key)).toEqual(["practice"]);
  });

  it("never shows a negative practice line", () => {
    expect(buildFameBreakdown({ fame: 10, rigBonus: 20 }).map((row) => row.key)).toEqual(["rig"]);
  });
});

describe("buildPointsBreakdown", () => {
  it("splits points into time, habits and the streak multiplier", () => {
    // 20 + 4, multiplied by 1.15 → 27 total, so the streak line is worth 3.
    const rows = buildPointsBreakdown({
      totalPoints: 27,
      timePoints: 20,
      habitPoints: 4,
      streakMultiplier: 0.15,
    });

    expect(rows.map((row) => [row.key, row.amount])).toEqual([
      ["time", 20],
      ["habits", 4],
      ["streak", 3],
    ]);
    expect(sum(rows)).toBe(27);
  });

  it("quotes the multiplier under the streak line", () => {
    const rows = buildPointsBreakdown({ totalPoints: 27, timePoints: 24, streakMultiplier: 0.15 });

    expect(rowFor(rows, "streak")?.subs).toEqual([
      { key: "rate", label: "On everything above", value: "+15%" },
    ]);
  });

  it("says nothing about a report it cannot break down", () => {
    // No named parts to multiply, so the total is not claimed for the streak.
    const rows = buildPointsBreakdown({ totalPoints: 27, streakMultiplier: 0.15 });

    expect(rows).toEqual([]);
  });
  it("leaves out the streak line when the streak paid nothing", () => {
    const rows = buildPointsBreakdown({ totalPoints: 24, timePoints: 20, habitPoints: 4 });

    expect(rows.map((row) => row.key)).toEqual(["time", "habits"]);
  });
});
