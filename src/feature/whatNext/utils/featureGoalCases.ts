import { FEATURE_GOALS_PER_CASE } from "feature/whatNext/data/featureGoals";

/**
 * Sessions below which an account is new. Whatever a new account has done
 * was done with the goals already there, so all of it counts.
 */
export const NEW_ACCOUNT_SESSIONS = 3;

export interface FeatureGoalCases {
  /** Goals done since the account was first seen. */
  counted: number;
  /** Free cases those goals are worth, collected or not. */
  earned: number;
  /** Free cases already collected. */
  paid: number;
  /** Free cases waiting to be collected. */
  owed: number;
  /** Goals still to do for the next free case, 1 to FEATURE_GOALS_PER_CASE. */
  toNext: number;
}

/**
 * The goals already done when the account was first seen: they were done
 * before the goals existed and earn nothing. A new account starts from none.
 */
export const featureGoalBaseline = (
  done: Iterable<string>,
  sessionCount: number,
): string[] => (sessionCount < NEW_ACCOUNT_SESSIONS ? [] : [...done]);

/** Free cases earned by the goals done since the baseline. */
export const featureGoalCases = (
  done: Iterable<string>,
  baseline: readonly string[],
  paid: number,
): FeatureGoalCases => {
  const before = new Set(baseline);
  const counted = [...new Set(done)].filter((id) => !before.has(id)).length;
  const earned = Math.floor(counted / FEATURE_GOALS_PER_CASE);
  return {
    counted,
    earned,
    paid,
    owed: Math.max(0, earned - paid),
    toNext: FEATURE_GOALS_PER_CASE - (counted % FEATURE_GOALS_PER_CASE),
  };
};

/** Free cases goals may pay in one day. */
export const FEATURE_GOAL_CASES_PER_DAY = 1;

/**
 * How many of the owed cases may be paid now: none on a day one was already
 * paid, otherwise up to the daily limit. What is left stays owed for later days.
 */
export const featureGoalCasesPayable = (
  owed: number,
  lastPaidDay: string | null,
  today: string,
): number =>
  lastPaidDay === today ? 0 : Math.min(owed, FEATURE_GOAL_CASES_PER_DAY);
