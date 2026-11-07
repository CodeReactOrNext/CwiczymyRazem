import { BOSSES } from "feature/bosses/data/bosses";
import { nextSavepoint } from "feature/bosses/utils/difficulty";
import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";
import { pointsToReachLvl } from "feature/levelGate/utils/levelGate.utils";
import { getNextMilestone } from "feature/progression/data/levelMilestones";
import type {
  NextAction,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";

/** A badge counts as "close" from this share of the way. */
const ACHIEVEMENT_CLOSE = 0.6;

/** The next rung of the level ladder, and what it opens or pays. */
export const progressionActions = (s: WhatNextSnapshot): NextAction[] => {
  const next = getNextMilestone(s.lvl);
  if (!next) return [];

  const feature = next.unlocks.find((unlock) => unlock.kind === "feature");
  const pointsLeft = pointsToReachLvl(s.points, next.lvl);

  return [
    {
      id: `level:${next.lvl}`,
      source: "progression",
      kind: "horizon",
      isPractice: true,
      title: { key: "progression.title", params: { lvl: next.lvl } },
      reason:
        feature && feature.kind === "feature"
          ? {
              key: "progression.unlock",
              params: {
                count: pointsLeft,
                feature: FEATURE_UNLOCKS[feature.feature].name,
              },
            }
          : { key: "progression.reward", params: { count: pointsLeft } },
      href: "/timer",
      ...(next.payout?.caseTokens && {
        reward: { caseTokens: next.payout.caseTokens },
      }),
    },
  ];
};

/** The badges nearest to unlocking — `ready` ones first, then by share done. */
export const achievementActions = (s: WhatNextSnapshot): NextAction[] =>
  (s.achievements ?? [])
    .filter(
      (entry) =>
        entry.ready ||
        (entry.max > 0 && entry.current / entry.max >= ACHIEVEMENT_CLOSE),
    )
    .sort(
      (a, b) =>
        Number(b.ready) - Number(a.ready) ||
        b.current / b.max - a.current / a.max,
    )
    .slice(0, 2)
    .map((entry) => ({
      id: `achievement:${entry.id}`,
      source: "achievements" as const,
      kind: "horizon" as const,
      isPractice: true,
      title: { key: "achievements.title", params: { name: entry.name } },
      reason: entry.ready
        ? { key: "achievements.ready" }
        : {
            key: "achievements.reason",
            params: { value: entry.current, max: entry.max },
          },
      href: "/profile/achievements",
      ...(!entry.ready && {
        progress: { value: entry.current, max: entry.max },
      }),
    }));

/**
 * One boss: the first never fought, otherwise the one whose next savepoint is
 * nearest. Bosses pay nothing of their own, so they stay on the horizon.
 */
export const bossActions = (s: WhatNextSnapshot): NextAction[] => {
  if (!s.bosses || s.sessionCount < 3) return [];
  const records = s.bosses;

  const unfought = BOSSES.find(
    (boss) => !records[boss.id] || records[boss.id].runs === 0,
  );
  if (unfought) {
    return [
      {
        id: `boss:${unfought.id}:first`,
        source: "bosses",
        kind: "horizon",
        isPractice: true,
        title: { key: "bosses.first", params: { name: unfought.name } },
        reason: { key: "bosses.first_reason" },
        href: `/practice/boss/${unfought.id}`,
      },
    ];
  }

  const closest = BOSSES.map((boss) => {
    const record = records[boss.id];
    const target = nextSavepoint(record, "normal");
    return { boss, target, gap: target - record.bestPhase };
  }).sort((a, b) => a.gap - b.gap)[0];
  if (!closest) return [];

  return [
    {
      id: `boss:${closest.boss.id}:${closest.target}`,
      source: "bosses",
      kind: "horizon",
      isPractice: true,
      title: {
        key: "bosses.next",
        params: { name: closest.boss.name, phase: closest.target },
      },
      reason: { key: "bosses.next_reason" },
      href: `/practice/boss/${closest.boss.id}`,
    },
  ];
};
