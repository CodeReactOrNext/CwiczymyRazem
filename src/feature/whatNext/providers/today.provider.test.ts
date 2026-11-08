import type { DuelView } from "feature/duels/types/duel.types";
import {
  DAY,
  HOUR,
  NOW,
  snapshot,
} from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import {
  calendarActions,
  dailyExerciseActions,
  duelActions,
  onboardingActions,
  streakActions,
} from "./today.provider";

const duel = (overrides: Partial<DuelView> = {}): DuelView => ({
  id: "d1",
  exerciseId: "spider_1",
  status: "active",
  createdAt: NOW - DAY,
  endsAt: NOW + 6 * HOUR,
  settledAt: null,
  me: {
    attempts: 0,
    isReady: false,
    bestScore: 0,
    bestAccuracy: 0,
    bestBpm: null,
    ratingBefore: 1000,
    ratingAfter: null,
  },
  opponent: { revealed: false, attempts: 2, isReady: false },
  result: null,
  ratingDelta: null,
  ...overrides,
});

describe("onboardingActions", () => {
  it("asks a brand-new player for a first session", () => {
    const actions = onboardingActions(snapshot({ sessionCount: 0 }));
    expect(actions.map((a) => a.id)).toEqual(["onboarding:first-session"]);
  });

  it("stays quiet once a session is logged — the rest are What Next goals", () => {
    expect(
      onboardingActions(
        snapshot({ songs: { learning: [], wantToLearn: [], learnedCount: 0 } }),
      ),
    ).toEqual([]);
  });
});

describe("streakActions", () => {
  const dayEndsAt = NOW + 9 * HOUR;

  it("warns about a running streak with no practice today", () => {
    const [action] = streakActions(
      snapshot({
        streak: { dayWithoutBreak: 12, didPracticeToday: false, dayEndsAt },
      }),
    );
    expect(action).toMatchObject({ kind: "expiring", deadlineAt: dayEndsAt });
    expect(action.title.params).toEqual({ count: 12 });
  });

  it("says nothing once today is done, or with no streak to lose", () => {
    expect(
      streakActions(
        snapshot({
          streak: { dayWithoutBreak: 12, didPracticeToday: true, dayEndsAt },
        }),
      ),
    ).toEqual([]);
    expect(
      streakActions(
        snapshot({
          streak: { dayWithoutBreak: 0, didPracticeToday: false, dayEndsAt },
        }),
      ),
    ).toEqual([]);
  });
});

describe("dailyExerciseActions", () => {
  const daily = {
    exerciseId: "e1",
    title: "Alternate picking",
    players: 23,
    endsAt: NOW + 9 * HOUR,
  };

  it("is a deadline before the first run", () => {
    const [action] = dailyExerciseActions(
      snapshot({ dailyExercise: { ...daily, myRank: null } }),
    );
    expect(action.kind).toBe("expiring");
  });

  it("becomes a score chase once played, and disappears at #1", () => {
    const [action] = dailyExerciseActions(
      snapshot({ dailyExercise: { ...daily, myRank: 7 } }),
    );
    expect(action.kind).toBe("continue");
    expect(action.reason?.params).toEqual({ rank: 7, players: 23 });
    expect(
      dailyExerciseActions(
        snapshot({ dailyExercise: { ...daily, myRank: 1 } }),
      ),
    ).toEqual([]);
  });
});

describe("calendarActions", () => {
  const item = (id: string, minutes: number) => ({
    id,
    kind: "exercise" as const,
    area: "technique" as const,
    minutes,
    role: "main" as const,
    auto: false,
    done: false,
    exerciseId: id,
  });

  it("sums what is left of today", () => {
    const [action] = calendarActions(
      snapshot({
        calendar: {
          today: "2026-11-07",
          hasUpcoming: true,
          todayItems: [
            { item: item("a", 10), done: true },
            { item: item("b", 15), done: false },
            { item: item("c", 5), done: false },
          ],
        },
      }),
    );
    expect(action.title.params).toEqual({ done: 1, total: 3 });
    expect(action.estMinutes).toBe(20);
  });

  it("offers to plan a week only when nothing is planned at all", () => {
    expect(
      calendarActions(
        snapshot({
          calendar: { today: "x", hasUpcoming: false, todayItems: [] },
        }),
      )[0].id,
    ).toBe("calendar:plan-week");
    expect(
      calendarActions(
        snapshot({
          calendar: { today: "x", hasUpcoming: true, todayItems: [] },
        }),
      ),
    ).toEqual([]);
  });
});

describe("duelActions", () => {
  it("sends an unplayed duel straight to the duel", () => {
    const [action] = duelActions(snapshot({ duels: [duel()] }));
    expect(action.href).toBe("/practice/duel/d1");
    expect(action.reason?.key).toBe("duels.not_played");
  });

  it("asks to lock in once played, louder when the opponent already has", () => {
    const played = { ...duel().me, attempts: 2 };
    const [action] = duelActions(
      snapshot({
        duels: [
          duel({
            me: played,
            opponent: { revealed: false, attempts: 3, isReady: true },
          }),
        ],
      }),
    );
    expect(action.reason?.key).toBe("duels.opponent_ready");
  });

  it("skips duels that are locked in or over", () => {
    expect(
      duelActions(
        snapshot({
          duels: [
            duel({ me: { ...duel().me, isReady: true } }),
            duel({ id: "d2", endsAt: NOW - 1 }),
          ],
        }),
      ),
    ).toEqual([]);
  });
});
