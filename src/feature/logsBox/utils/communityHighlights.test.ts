import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { describe, expect, it } from "vitest";

import { buildCommunityHighlights } from "./communityHighlights";

const NOW = Date.UTC(2026, 10, 18, 12);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const iso = (ms: number) => new Date(ms).toISOString();

const session = (
  ageMs: number,
  extra: Record<string, unknown> = {},
): AnyFirebaseLog =>
  ({
    uid: "u1",
    userName: "sakkmatt",
    exerciseTitle: "Open G Repeats",
    data: iso(NOW - ageMs),
    timestamp: iso(NOW - ageMs),
    ...extra,
  }) as unknown as AnyFirebaseLog;

const duelWaiting = (ageMs: number, expiresInMs: number): AnyFirebaseLog =>
  ({
    type: "duel_waiting",
    ticketId: "t1",
    data: iso(NOW - ageMs),
    timestamp: iso(NOW - ageMs),
    expiresAt: NOW + expiresInMs,
  }) as unknown as AnyFirebaseLog;

const duelResult = (ageMs: number): AnyFirebaseLog =>
  ({
    type: "duel_result",
    kind: "win",
    data: iso(NOW - ageMs),
    timestamp: iso(NOW - ageMs),
    players: [{ displayName: "Ann" }, { displayName: "Bob" }],
  }) as unknown as AnyFirebaseLog;

describe("buildCommunityHighlights", () => {
  it("returns nothing when nothing is going on", () => {
    expect(
      buildCommunityHighlights({ logs: [session(HOUR)], now: NOW }),
    ).toEqual([]);
  });

  it("orders cells by freshness and keeps at most four", () => {
    const result = buildCommunityHighlights({
      logs: [
        session(3 * HOUR, { micPerformance: { score: 1, accuracy: 1, rank: 1 } }),
        duelResult(10 * MINUTE),
        session(5 * HOUR, {
          planId: "boss-colossus",
          exerciseTitle: "Colossus",
          bossRun: { bossId: "colossus", phase: 2 },
        }),
      ],
      improvTake: {
        userName: "Mira",
        createdAt: NOW - HOUR,
        trackTitle: "Slow Blues in A",
        youtubeId: "dQw4w9WgXcQ",
      },
      challenge: { daysLeft: 12, submissionCount: 7 },
      now: NOW,
    });

    expect(result.map((item) => item.kind)).toEqual([
      "duelResult",
      "improv",
      "record",
      "boss",
    ]);
  });

  it("moves the monthly board to the front in its last days", () => {
    const result = buildCommunityHighlights({
      logs: [duelResult(10 * MINUTE)],
      challenge: { daysLeft: 2, submissionCount: 7 },
      now: NOW,
    });

    expect(result[0]).toMatchObject({ kind: "challenge", isUrgent: true });
  });

  it("prefers an open duel over a settled one and ignores a lapsed ticket", () => {
    const open = buildCommunityHighlights({
      logs: [duelResult(MINUTE), duelWaiting(HOUR, HOUR)],
      now: NOW,
    });
    expect(open.map((item) => item.kind)).toEqual(["duelWaiting"]);

    const lapsed = buildCommunityHighlights({
      logs: [duelResult(MINUTE), duelWaiting(HOUR, -MINUTE)],
      now: NOW,
    });
    expect(lapsed.map((item) => item.kind)).toEqual(["duelResult"]);
  });

  it("drops feed events older than two days", () => {
    const result = buildCommunityHighlights({
      logs: [
        duelResult(3 * DAY),
        session(3 * DAY, { micPerformance: { score: 1, accuracy: 1, rank: 1 } }),
      ],
      now: NOW,
    });

    expect(result).toEqual([]);
  });

  it("only counts a first place as a record", () => {
    const result = buildCommunityHighlights({
      logs: [
        session(HOUR, { micPerformance: { score: 1, accuracy: 1, rank: 2 } }),
        session(2 * HOUR, {
          userName: "Ryan",
          exerciseIds: ["ear-1"],
          earTrainingPerformance: { score: 9, rank: 1 },
        }),
      ],
      now: NOW,
    });

    expect(result).toEqual([
      {
        kind: "record",
        at: NOW - 2 * HOUR,
        userName: "Ryan",
        avatarUrl: null,
        exerciseTitle: "Open G Repeats",
        exerciseId: "ear-1",
      },
    ]);
  });
});
