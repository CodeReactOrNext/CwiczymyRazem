import { describe, expect, it } from "vitest";

import {
  buildPickTargets,
  decidePickThrow,
  pickDayKey,
  PICKS_PER_DAY,
  picksLeftToday,
  type PickThrowerRecord,
} from "./picks.rules";

const NOW = Date.UTC(2026, 10, 26, 18, 0, 0);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const practice = (
  id: string,
  uid: string,
  agoMs: number,
  minutes: number,
  extra: Record<string, unknown> = {},
) => ({
  id,
  uid,
  userName: uid.toUpperCase(),
  avatarUrl: null,
  data: new Date(NOW - agoMs).toISOString(),
  timestamp: new Date(NOW - agoMs).toISOString(),
  newAchievements: [],
  newLevel: { isNewLevel: false, level: 1 },
  points: 10,
  timeSumary: {
    techniqueTime: minutes * MIN,
    theoryTime: 0,
    hearingTime: 0,
    creativityTime: 0,
    sumTime: minutes * MIN,
  },
  ...extra,
});

describe("picks allowance", () => {
  it("starts every UTC day full", () => {
    expect(picksLeftToday(null, NOW)).toBe(PICKS_PER_DAY);
    expect(
      picksLeftToday({ day: "2026-11-25", count: PICKS_PER_DAY }, NOW),
    ).toBe(PICKS_PER_DAY);
  });

  it("spends one pick per throw and stops at the limit", () => {
    let record: PickThrowerRecord | null = null;
    for (let i = 1; i <= PICKS_PER_DAY; i++) {
      const decision = decidePickThrow(record, NOW);
      expect(decision.ok).toBe(true);
      if (!decision.ok) return;
      expect(decision.picksLeft).toBe(PICKS_PER_DAY - i);
      record = decision.record;
    }
    expect(decidePickThrow(record, NOW)).toEqual({
      ok: false,
      reason: "DAILY_LIMIT",
    });
    expect(record).toEqual({ day: pickDayKey(NOW), count: PICKS_PER_DAY });
  });
});

describe("buildPickTargets", () => {
  it("offers one row per other player from the last day, least motivated first", () => {
    const logs = [
      practice("a2", "anna", 10 * MIN, 20, { reactions: ["x", "y"] }),
      practice("bob1", "bob", 30 * MIN, 15, { exerciseTitle: "Spider Walk" }),
      practice("me1", "me", 40 * MIN, 30),
      practice("a1", "anna", 5 * HOUR, 40),
      practice("old", "carl", 30 * HOUR, 25),
    ];

    const targets = buildPickTargets({
      logs,
      viewerId: "me",
      nowMs: NOW,
      hasOlderLogs: false,
    });

    expect(targets.map((t) => t.uid)).toEqual(["bob", "anna"]);
    expect(targets[0]).toMatchObject({
      logId: "bob1",
      minutes: 15,
      title: "Spider Walk",
      motivations: 0,
      fame: 15,
    });
    // Anna's newest row is the one offered, even though her older one has no reactions.
    expect(targets[1]).toMatchObject({ logId: "a2", motivations: 2 });
  });

  it("lands on the group's anchor, the oldest log of a run by the same player", () => {
    const logs = [
      practice("new", "dana", 5 * MIN, 10),
      practice("mid", "dana", 20 * MIN, 10),
      practice("first", "dana", 40 * MIN, 10),
    ];

    const [target] = buildPickTargets({
      logs,
      viewerId: "me",
      nowMs: NOW,
      hasOlderLogs: false,
    });

    expect(target).toMatchObject({ logId: "first", minutes: 30, fame: 30 });
  });

  it("skips a player the viewer already motivated, rather than offering their older row", () => {
    const logs = [
      practice("e2", "eve", 10 * MIN, 10, { reactions: ["me"] }),
      practice("x1", "xavi", 20 * MIN, 10),
      practice("e1", "eve", 2 * HOUR, 30),
    ];

    const targets = buildPickTargets({
      logs,
      viewerId: "me",
      nowMs: NOW,
      hasOlderLogs: false,
    });

    expect(targets.map((t) => t.uid)).toEqual(["xavi"]);
  });

  it("leaves out rows with no practice time and the group the scan cut in half", () => {
    const logs = [
      practice("f1", "finn", 10 * MIN, 0),
      practice("g1", "gia", 20 * MIN, 12),
      practice("h1", "hal", 30 * MIN, 12),
    ];

    const targets = buildPickTargets({
      logs,
      viewerId: "me",
      nowMs: NOW,
      hasOlderLogs: true,
    });

    expect(targets.map((t) => t.uid)).toEqual(["gia"]);
  });

  it("returns at most the requested number of players", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      practice(`l${i}`, `p${i}`, (i + 1) * MIN, 5),
    );

    expect(
      buildPickTargets({
        logs,
        viewerId: "me",
        nowMs: NOW,
        hasOlderLogs: false,
        limit: 4,
      }),
    ).toHaveLength(4);
  });
});
