import type { DuelView } from "feature/duels/types/duel.types";
import { describe, expect, it } from "vitest";

import {
  formatClock,
  formatRatingDelta,
  formatTimeLeft,
  ratingTrail,
  recentForm,
  scoreShare,
} from "./duelFormat";

describe("formatTimeLeft", () => {
  it("prints hours and minutes, rounding a partial minute up", () => {
    expect(formatTimeLeft(24 * 3_600_000)).toBe("24h 0m");
    expect(formatTimeLeft(90 * 60_000 + 1)).toBe("1h 31m");
    expect(formatTimeLeft(45 * 60_000)).toBe("45m");
  });

  it("never shows zero while there is time left", () => {
    expect(formatTimeLeft(1)).toBe("1m");
    expect(formatTimeLeft(-5)).toBe("1m");
  });
});

describe("formatClock", () => {
  it("prints hours, minutes and seconds, padded", () => {
    expect(formatClock(24 * 3_600_000)).toBe("24:00:00");
    expect(formatClock((17 * 3600 + 42 * 60 + 9) * 1000 + 999)).toBe(
      "17:42:09",
    );
  });

  it("stops at zero", () => {
    expect(formatClock(-1000)).toBe("00:00:00");
  });
});

describe("formatRatingDelta", () => {
  it("signs gains, losses and no change", () => {
    expect(formatRatingDelta(16)).toBe("+16");
    expect(formatRatingDelta(-16)).toBe("−16");
    expect(formatRatingDelta(0)).toBe("±0");
  });
});

const settled = (
  endsAt: number,
  result: DuelView["result"],
  ratingBefore: number,
  ratingAfter: number,
  settledAt: number = endsAt,
): DuelView => ({
  id: `d${endsAt}`,
  exerciseId: "chicken_pickin",
  status: "finished",
  createdAt: endsAt - 1,
  endsAt,
  settledAt,
  me: {
    attempts: 1,
    isReady: false,
    bestScore: 1,
    bestAccuracy: 0,
    bestBpm: null,
    ratingBefore,
    ratingAfter,
  },
  opponent: { revealed: false, attempts: 1, isReady: false },
  result,
  ratingDelta: ratingAfter - ratingBefore,
});

// Newest first, the way the overview sends them.
const recent = [
  settled(4, "won", 1000, 1020),
  settled(3, "void", 1000, 1000),
  settled(2, "lost", 1016, 1000),
  settled(1, "won", 1000, 1016),
];

describe("recentForm", () => {
  it("reads oldest to newest and skips duels nobody played", () => {
    expect(recentForm(recent)).toEqual(["won", "lost", "won"]);
    expect(recentForm(recent, 2)).toEqual(["lost", "won"]);
  });
});

describe("ratingTrail", () => {
  it("starts before the first duel and follows every rating after", () => {
    expect(ratingTrail(recent)).toEqual([1000, 1016, 1000, 1020]);
  });

  it("follows the order duels were settled in, not their deadlines", () => {
    // The later duel was finished early by both players and settled first.
    const early = settled(10, "won", 1000, 1016, 1);
    const late = settled(5, "lost", 1016, 1000, 6);
    expect(ratingTrail([late, early])).toEqual([1000, 1016, 1000]);
    expect(recentForm([late, early])).toEqual(["won", "lost"]);
  });

  it("is empty without a settled duel", () => {
    expect(ratingTrail([])).toEqual([]);
    expect(ratingTrail([settled(1, "void", 1000, 1000)])).toEqual([]);
  });
});

describe("scoreShare", () => {
  it("gives the viewer's share of both best runs", () => {
    expect(scoreShare(300, 100)).toBe(0.75);
    expect(scoreShare(0, 100)).toBe(0);
    expect(scoreShare(0, 0)).toBeNull();
  });
});
