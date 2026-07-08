import { describe, expect, it } from "vitest";

import type { ActivityFeedLog } from "./groupActivityLogs";
import { groupActivityLogs } from "./groupActivityLogs";

const exerciseLog = (
  overrides: Partial<ActivityFeedLog> = {},
): ActivityFeedLog =>
  ({
    id: "ex-1",
    uid: "user-1",
    userName: "Alice",
    data: "2026-07-08T10:00:00Z",
    timestamp: "2026-07-08T10:00:00Z",
    points: 10,
    newAchievements: [],
    newLevel: { isNewLevel: false, level: 1 },
    timeSumary: {
      techniqueTime: 0,
      theoryTime: 0,
      hearingTime: 0,
      creativityTime: 0,
      sumTime: 0,
    },
    avatarUrl: null,
    planId: null,
    ...overrides,
  }) as ActivityFeedLog;

const songLog = (overrides: Partial<ActivityFeedLog> = {}): ActivityFeedLog =>
  ({
    id: "song-1",
    uid: "user-1",
    userName: "Alice",
    data: "2026-07-08T10:00:00Z",
    timestamp: "2026-07-08T10:00:00Z",
    songTitle: "Song",
    songArtist: "Artist",
    status: "added",
    avatarUrl: undefined,
    ...overrides,
  }) as ActivityFeedLog;

describe("groupActivityLogs", () => {
  it("groups sequential exercises from the same user into one item", () => {
    const logs = Array.from({ length: 6 }, (_, i) =>
      exerciseLog({ id: `ex-${i}` }),
    );

    const groups = groupActivityLogs(logs);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("exercise");
    expect(groups[0].logs).toHaveLength(6);
  });

  it("groups sequential songs from the same user into one item", () => {
    const logs = Array.from({ length: 4 }, (_, i) =>
      songLog({ id: `song-${i}` }),
    );

    const groups = groupActivityLogs(logs);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("song");
    expect(groups[0].logs).toHaveLength(4);
  });

  it("starts a new group when the activity type changes", () => {
    const logs = [
      songLog({ id: "song-0" }),
      songLog({ id: "song-1" }),
      exerciseLog({ id: "ex-0" }),
      exerciseLog({ id: "ex-1" }),
      exerciseLog({ id: "ex-2" }),
    ];

    const groups = groupActivityLogs(logs);

    expect(groups).toHaveLength(2);
    expect(groups[0].category).toBe("song");
    expect(groups[0].logs).toHaveLength(2);
    expect(groups[1].category).toBe("exercise");
    expect(groups[1].logs).toHaveLength(3);
  });

  it("starts a new group when a different user performs an activity in between", () => {
    const logs = [
      exerciseLog({ id: "ex-0", uid: "user-1" }),
      exerciseLog({ id: "ex-1", uid: "user-2" }),
      exerciseLog({ id: "ex-2", uid: "user-1" }),
    ];

    const groups = groupActivityLogs(logs);

    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.logs.length)).toEqual([1, 1, 1]);
  });

  it("never merges Exercise Plan completions, even sequential ones from the same user", () => {
    const logs = [
      exerciseLog({ id: "plan-0", planId: "plan-a" }),
      exerciseLog({ id: "plan-1", planId: "plan-a" }),
    ];

    const groups = groupActivityLogs(logs);

    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.category === "plan")).toBe(true);
    expect(groups.every((g) => g.fame === 15)).toBe(true);
  });

  it.each([
    [1, 5],
    [3, 15],
    [10, 50],
    [20, 50],
  ])(
    "awards %i grouped exercises as %i Fame (5/action, capped at 50)",
    (count, expectedFame) => {
      const logs = Array.from({ length: count }, (_, i) =>
        exerciseLog({ id: `ex-${i}` }),
      );

      const groups = groupActivityLogs(logs);

      expect(groups[0].fame).toBe(expectedFame);
    },
  );

  it("does not compute Fame for activity types the feed doesn't reward", () => {
    const topPlayersLog = {
      type: "top_players_update",
      data: "x",
      topPlayers: [],
      message: "",
    } as unknown as ActivityFeedLog;

    const groups = groupActivityLogs([topPlayersLog]);

    expect(groups[0].category).toBe("other");
    expect(groups[0].fame).toBeNull();
  });
});
