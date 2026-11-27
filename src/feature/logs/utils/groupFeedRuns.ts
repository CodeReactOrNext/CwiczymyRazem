import type { FirebaseLogsInterface } from "feature/logs/types/logs.type";
import {
  type AnyFirebaseLog,
  getLogActivityType,
} from "feature/logs/utils/groupConsecutiveLogs";

/**
 * What makes two feed entries runs of the same thing: the same exercise (or plan) and nothing
 * else in the session. A session that also levelled up, earned achievements, played songs or
 * fought a boss has more to say than its numbers, so it keeps a row of its own.
 */
export const feedRunKey = (log: AnyFirebaseLog): string | null => {
  const type = getLogActivityType(log);
  if (type !== "exercise" && type !== "exercisePlan") return null;

  const session = log as FirebaseLogsInterface;
  if (
    !session.exerciseTitle ||
    session.newLevel?.isNewLevel ||
    (session.newAchievements?.length ?? 0) > 0 ||
    session.songTitle ||
    (session.songs?.length ?? 0) > 0 ||
    session.bossRun
  ) {
    return null;
  }

  return `${session.planId ?? ""}|${session.exerciseTitle}`;
};

/**
 * A card's entries with back-to-back runs of the same exercise folded together, so the card names
 * the exercise once and lists each run's numbers under it. Order is kept; every other entry is a
 * run of one.
 */
export const groupFeedRuns = (logs: AnyFirebaseLog[]): AnyFirebaseLog[][] => {
  const runs: AnyFirebaseLog[][] = [];
  let lastKey: string | null = null;

  for (const log of logs) {
    const key = feedRunKey(log);
    const current = runs[runs.length - 1];
    if (key !== null && key === lastKey && current) {
      current.push(log);
    } else {
      runs.push([log]);
    }
    lastKey = key;
  }

  return runs;
};
