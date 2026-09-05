import { statisticsInitial } from "constants/userStatisticsInitialData";
import { describe, expect, it } from "vitest";

import { mergeDailyQuests } from "./dailyQuest.merge";
import userReducer, { completeQuestTask, generateDailyQuest } from "./userSlice";

/**
 * The daily quest key has changed meaning twice: player-local date → shared
 * server (UTC) date → the player's own day resolved from the zone on their
 * profile. On each of those days, some players are holding a quest stamped with
 * what now reads as *tomorrow* and others one stamped with yesterday. Neither
 * may lose a set they are part way through, or have a claimed reward come back
 * unclaimed. The state below pins the zone to UTC so these assertions test that
 * tolerance rather than the zone the suite happens to run in.
 */
const questFor = (date: string, overrides = {}) => ({
  date,
  isRewardClaimed: false,
  tasks: [
    {
      id: `quest_${date}_0`,
      type: "rate_song" as const,
      title: "Rate a Song",
      isCompleted: false,
      progress: 0,
      target: 1,
    },
  ],
  ...overrides,
});

const stateWithQuest = (quest: ReturnType<typeof questFor>) =>
  ({
    userInfo: null,
    userAuth: null,
    currentUserStats: { ...statisticsInitial, timeZone: "UTC", dailyQuest: quest },
    previousUserStats: null,
    raitingData: null,
    isFetching: null,
    isLoggedOut: null,
    timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
    providerData: {
      providerId: null,
      uid: null,
      displayName: null,
      email: null,
      photoURL: null,
    },
    currentActivity: null,
  }) as Parameters<typeof userReducer>[0];

describe("daily quest key migration", () => {
  // Fixed so the assertions do not depend on the zone the suite runs in.
  const serverToday = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  it("keeps a quest stamped with a still-future local key", () => {
    const stale = questFor(tomorrow, {
      tasks: [{ ...questFor(tomorrow).tasks[0], progress: 1, isCompleted: true }],
    });

    const next = userReducer(stateWithQuest(stale), generateDailyQuest(undefined));

    expect(next.currentUserStats?.dailyQuest?.date).toBe(tomorrow);
    expect(next.currentUserStats?.dailyQuest?.tasks[0].isCompleted).toBe(true);
  });

  it("still accepts progress on that quest", () => {
    const next = userReducer(
      stateWithQuest(questFor(tomorrow)),
      completeQuestTask({ type: "rate_song" }),
    );

    expect(next.currentUserStats?.dailyQuest?.tasks[0].isCompleted).toBe(true);
  });

  it("replaces a quest whose key is genuinely in the past", () => {
    const next = userReducer(
      stateWithQuest(questFor(yesterday)),
      generateDailyQuest(undefined),
    );

    expect(next.currentUserStats?.dailyQuest?.date).toBe(serverToday);
  });

  it("refuses progress on a quest whose day has closed", () => {
    const next = userReducer(
      stateWithQuest(questFor(yesterday)),
      completeQuestTask({ type: "rate_song" }),
    );

    expect(next.currentUserStats?.dailyQuest?.tasks[0].isCompleted).toBe(false);
  });

  it("lets the merge keep the later-dated copy across the boundary", () => {
    const merged = mergeDailyQuests(
      questFor(tomorrow, { isRewardClaimed: true }),
      questFor(yesterday),
      serverToday,
    );

    expect(merged?.date).toBe(tomorrow);
    expect(merged?.isRewardClaimed).toBe(true);
  });
});
