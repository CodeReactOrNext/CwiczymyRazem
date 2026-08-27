import type { FirebaseLogsInterface } from "feature/logs/types/logs.type";

import type { AnyFirebaseLog } from "./groupConsecutiveLogs";

/**
 * Fame for one logged activity that carries no practice time — a case opened, a song rated, a
 * listing put up, a playlist created. Paid per activity, so a row of five is worth five of them.
 */
export const ACTION_FAME = 3;

/**
 * Fame per minute of logged practice. One minute, one Fame: the amount a practice row is worth is
 * the session itself, with nothing else in the formula — not the activity type, not how many
 * reports the evening arrived in.
 */
export const FAME_PER_MINUTE = 1;

/**
 * Hard ceiling on a single feed row: eight hours of practice in one group. Set clear of any real
 * day rather than as a balance lever — it exists so a fabricated or malformed log can't hand out an
 * unbounded amount, which matters because `reactionFame` freezes whatever it pays.
 */
export const MAX_ACTIVITY_FAME = 480;

/**
 * Practice time a single log may contribute, mirroring the 24h ceiling `/api/user/report/manage`
 * enforces per report. Legacy or malformed logs claiming more are clamped instead of dropped.
 */
export const MAX_TRUSTED_LOG_MS = 24 * 60 * 60 * 1000;

/** Trusted practice time on one log. Anything missing, negative or malformed counts as none. */
const getLogSessionMs = (log: AnyFirebaseLog): number => {
  const sumTime = (log as FirebaseLogsInterface).timeSumary?.sumTime;
  if (typeof sumTime !== "number" || !Number.isFinite(sumTime) || sumTime <= 0)
    return 0;

  return Math.min(sumTime, MAX_TRUSTED_LOG_MS);
};

/** Total practice time logged across a group. Non-practice logs carry no time and contribute 0. */
export const getGroupSessionMs = (logs: readonly AnyFirebaseLog[]): number =>
  logs.reduce((total, log) => total + getLogSessionMs(log), 0);

/** Logs in the group that aren't practice — the ones paid per activity rather than per minute. */
export const countActionLogs = (logs: readonly AnyFirebaseLog[]): number =>
  logs.reduce(
    (count, log) => (getLogSessionMs(log) === 0 ? count + 1 : count),
    0,
  );

/**
 * Fame owed for `sessionMs` of practice.
 *
 * Applied to the group's summed time rather than to each log, so the number is split-proof: an
 * evening filed as six short reports prices exactly like the same evening filed in one go. That
 * matters because the server rebuilds the row's group from whatever logs it can see, and its answer
 * has to match what the feed previewed.
 */
export const calculateTimeFame = (sessionMs: number): number =>
  Math.round((Math.max(0, sessionMs) / (60 * 1000)) * FAME_PER_MINUTE);

/**
 * Fame the recipient gets when a feed row is motivated: every minute practised, plus a flat amount
 * for each activity that has no time to pay for. The two add up rather than branching, so a row
 * that mixes them — a session and the exam it auto-submitted — pays for both halves.
 *
 * This is the single source of truth for the amount — `/api/logs/react` runs it server-side to
 * decide what to actually award, and the feed runs it only to preview the same number.
 */
export const calculateGroupFame = (group: {
  logs: readonly AnyFirebaseLog[];
}): number =>
  Math.min(
    MAX_ACTIVITY_FAME,
    calculateTimeFame(getGroupSessionMs(group.logs)) +
      ACTION_FAME * countActionLogs(group.logs),
  );
