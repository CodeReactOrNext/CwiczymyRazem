import type { FirebaseLogsInterface } from "feature/logs/types/logs.type";

import type { AnyFirebaseLog, LogGroupType } from "./groupConsecutiveLogs";

/** Fame awarded per activity inside a grouped feed row. */
export const FAME_PER_ACTIVITY = 5;

/** Cap on the count-based part of a grouped activity, before the practice-time multiplier. */
export const MAX_GROUPED_ACTIVITY_FAME = 50;

/** Fixed base Fame for Exercise Plan activity — not affected by grouping. */
export const EXERCISE_PLAN_FAME = 15;

/** Hard ceiling on a single feed row's Fame, after the practice-time multiplier. */
export const MAX_ACTIVITY_FAME = 100;

/**
 * Practice-time multipliers, richest tier first. A longer session is worth more to motivate,
 * but the payout is stepped rather than linear on purpose: logged time is self-reported, and a
 * linear reward would pay out proportionally for inflating it.
 *
 * The first step sits at a quarter of an hour, so a real sit-down session is already worth more
 * than a couple of minutes of noodling; everything below that pays the flat base.
 */
export const TIME_FAME_TIERS: ReadonlyArray<{ minMs: number; multiplier: number }> = [
  { minMs: 2 * 60 * 60 * 1000, multiplier: 2 },
  { minMs: 60 * 60 * 1000, multiplier: 1.75 },
  { minMs: 30 * 60 * 1000, multiplier: 1.5 },
  { minMs: 15 * 60 * 1000, multiplier: 1.25 },
];

/**
 * Practice time a single log may contribute, mirroring the 24h ceiling `/api/user/report/manage`
 * enforces per report. Legacy or malformed logs claiming more are clamped instead of dropped.
 */
export const MAX_TRUSTED_LOG_MS = 24 * 60 * 60 * 1000;

/** Fame reward for a feed row grouping `activityCount` consecutive activities of the same type. */
export const calculateActivityFame = (activityCount: number): number =>
  Math.min(MAX_GROUPED_ACTIVITY_FAME, FAME_PER_ACTIVITY * Math.max(1, activityCount));

/** Total practice time logged across a group. Non-practice logs carry no time and contribute 0. */
export const getGroupSessionMs = (logs: readonly AnyFirebaseLog[]): number =>
  logs.reduce((total, log) => {
    const sumTime = (log as FirebaseLogsInterface).timeSumary?.sumTime;
    if (typeof sumTime !== "number" || !Number.isFinite(sumTime) || sumTime <= 0) return total;

    return total + Math.min(sumTime, MAX_TRUSTED_LOG_MS);
  }, 0);

/** Multiplier the logged practice time earns. Sessions under the lowest tier pay out at 1x. */
export const getTimeFameMultiplier = (sessionMs: number): number =>
  TIME_FAME_TIERS.find((tier) => sessionMs >= tier.minMs)?.multiplier ?? 1;

/**
 * Fame the recipient gets when a feed row is motivated: a count-based (or, for plans, fixed) base,
 * scaled by how much practice time the row represents.
 *
 * This is the single source of truth for the amount — `/api/logs/react` runs it server-side to
 * decide what to actually award, and the feed runs it only to preview the same number.
 */
export const calculateGroupFame = (group: {
  type: LogGroupType;
  logs: readonly AnyFirebaseLog[];
}): number => {
  const base =
    group.type === "exercisePlan" ? EXERCISE_PLAN_FAME : calculateActivityFame(group.logs.length);
  const multiplier = getTimeFameMultiplier(getGroupSessionMs(group.logs));

  return Math.min(MAX_ACTIVITY_FAME, Math.round(base * multiplier));
};
