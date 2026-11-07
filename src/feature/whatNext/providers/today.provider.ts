import { getQuestTaskHref } from "feature/user/store/dailyQuest.routes";
import type {
  NextAction,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";

/** How long one slot of a suggested session runs, when nothing says otherwise. */
export const DEFAULT_SLOT_MINUTES = 10;

/**
 * A player who has never logged a session has one thing to do. A player with
 * no songs gets one more nudge, since songs are half of what the app tracks.
 */
export const onboardingActions = (s: WhatNextSnapshot): NextAction[] => {
  const actions: NextAction[] = [];

  if (s.sessionCount === 0) {
    actions.push({
      id: "onboarding:first-session",
      source: "onboarding",
      kind: "start",
      isPractice: true,
      title: { key: "onboarding.first_session.title" },
      reason: { key: "onboarding.first_session.reason" },
      href: s.quickPick
        ? `/practice/exercise/${s.quickPick.exerciseId}`
        : "/timer",
      estMinutes: DEFAULT_SLOT_MINUTES,
      ...(s.quickPick && {
        sessionItem: {
          kind: "exercise",
          exerciseId: s.quickPick.exerciseId,
          minutes: DEFAULT_SLOT_MINUTES,
        },
      }),
    });
  }

  if (
    s.songs &&
    s.songs.learning.length +
      s.songs.wantToLearn.length +
      s.songs.learnedCount ===
      0
  ) {
    actions.push({
      id: "onboarding:first-song",
      source: "onboarding",
      kind: "start",
      isPractice: false,
      title: { key: "onboarding.first_song.title" },
      reason: { key: "onboarding.first_song.reason" },
      href: "/songs?view=explore",
    });
  }

  return actions;
};

/** A streak that ends at midnight unless something is logged today. */
export const streakActions = (s: WhatNextSnapshot): NextAction[] => {
  const streak = s.streak;
  if (!streak || streak.didPracticeToday || streak.dayWithoutBreak <= 0)
    return [];

  return [
    {
      id: `streak:${new Date(s.now).toDateString()}`,
      source: "streak",
      kind: "expiring",
      isPractice: true,
      title: { key: "streak.title", params: { count: streak.dayWithoutBreak } },
      reason: { key: "streak.reason" },
      href: s.quickPick
        ? `/practice/exercise/${s.quickPick.exerciseId}`
        : "/timer",
      deadlineAt: streak.dayEndsAt,
      estMinutes: DEFAULT_SLOT_MINUTES,
      ...(s.quickPick && {
        sessionItem: {
          kind: "exercise",
          exerciseId: s.quickPick.exerciseId,
          minutes: DEFAULT_SLOT_MINUTES,
        },
      }),
    },
  ];
};

/** Each unfinished task of today's quest; the reward itself is a claim. */
export const dailyQuestActions = (s: WhatNextSnapshot): NextAction[] => {
  const quest = s.dailyQuest;
  if (!quest || quest.isRewardClaimed) return [];

  return quest.tasks
    .filter((task) => !task.isCompleted)
    .map((task) => ({
      id: `daily-quest:${quest.date}:${task.id}`,
      source: "dailyQuest" as const,
      kind: "expiring" as const,
      isPractice: true,
      title:
        task.type === "practice_specific_exercise"
          ? {
              key: "dashboard:daily_quests.tasks.practice_specific_exercise",
              params: { exercise: task.title.replace(/^Practice: /, "") },
            }
          : { key: `dashboard:daily_quests.tasks.${task.type}` },
      reason: {
        key: "daily_quest.reason",
        params: {
          progress: Math.min(task.progress, task.target),
          target: task.target,
        },
      },
      href: getQuestTaskHref(task),
      deadlineAt: s.streak?.dayEndsAt,
      progress: {
        value: Math.min(task.progress, task.target),
        max: task.target,
      },
      reward: s.dailyQuestReward,
      ...(task.type === "practice_specific_exercise" &&
        task.exerciseId && {
          sessionItem: {
            kind: "exercise" as const,
            exerciseId: task.exerciseId,
            minutes: DEFAULT_SLOT_MINUTES,
          },
        }),
    }));
};

/** Today's shared board: play it once, or climb it if not first. */
export const dailyExerciseActions = (s: WhatNextSnapshot): NextAction[] => {
  const daily = s.dailyExercise;
  if (!daily || daily.myRank === 1) return [];

  const played = daily.myRank !== null;
  return [
    {
      id: `daily-exercise:${daily.exerciseId}:${new Date(daily.endsAt).toISOString().slice(0, 10)}`,
      source: "dailyExercise",
      // Once played it is a high-score chase, not a deadline.
      kind: played ? "continue" : "expiring",
      isPractice: true,
      title: { key: "daily_exercise.title", params: { title: daily.title } },
      reason: played
        ? {
            key: "daily_exercise.improve",
            params: { rank: daily.myRank!, players: daily.players },
          }
        : daily.players > 0
          ? { key: "daily_exercise.play", params: { players: daily.players } }
          : { key: "daily_exercise.play_first" },
      href: `/practice/exercise/${daily.exerciseId}`,
      deadlineAt: daily.endsAt,
      estMinutes: 5,
      sessionItem: {
        kind: "exercise",
        exerciseId: daily.exerciseId,
        minutes: 5,
      },
    },
  ];
};

/** What the player put on today's page of the calendar, or a nudge to plan a week. */
export const calendarActions = (s: WhatNextSnapshot): NextAction[] => {
  const calendar = s.calendar;
  if (!calendar) return [];

  if (calendar.todayItems.length === 0) {
    if (calendar.hasUpcoming || s.sessionCount < 3) return [];
    return [
      {
        id: "calendar:plan-week",
        source: "calendar",
        kind: "start",
        isPractice: false,
        title: { key: "calendar.plan.title" },
        reason: { key: "calendar.plan.reason" },
        href: "/calendar/plan",
      },
    ];
  }

  const done = calendar.todayItems.filter((entry) => entry.done).length;
  const total = calendar.todayItems.length;
  if (done === total) return [];

  const minutes = calendar.todayItems
    .filter((entry) => !entry.done)
    .reduce((sum, entry) => sum + entry.item.minutes, 0);

  return [
    {
      id: `calendar:${calendar.today}`,
      source: "calendar",
      kind: "expiring",
      isPractice: true,
      playerSet: true,
      title: { key: "calendar.today.title", params: { done, total } },
      reason: { key: "calendar.today.reason", params: { minutes } },
      href: "/calendar",
      deadlineAt: s.streak?.dayEndsAt,
      progress: { value: done, max: total },
      estMinutes: minutes,
    },
  ];
};

/** Duels still waiting on the player — not played yet, or not locked in. */
export const duelActions = (s: WhatNextSnapshot): NextAction[] =>
  (s.duels ?? [])
    .filter(
      (duel) =>
        duel.status === "active" && duel.endsAt > s.now && !duel.me.isReady,
    )
    .map((duel) => {
      const notPlayed = duel.me.attempts === 0;
      return {
        id: `duel:${duel.id}`,
        source: "duels" as const,
        kind: "expiring" as const,
        isPractice: true,
        title: { key: "duels.title" },
        reason: notPlayed
          ? { key: "duels.not_played" }
          : !duel.opponent.revealed && duel.opponent.isReady
            ? { key: "duels.opponent_ready" }
            : { key: "duels.lock_in" },
        href: notPlayed
          ? `/practice/duel/${duel.id}`
          : `/duels?duel=${duel.id}`,
        deadlineAt: duel.endsAt,
        estMinutes: 5,
      };
    });
