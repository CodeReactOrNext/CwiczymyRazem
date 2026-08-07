/**
 * Fame is the shop currency (cases cost 150–400), so it deliberately does NOT
 * track points 1:1 the way it used to. Points stay linear with practice time —
 * they drive levels and the leaderboard, where "more is more" is the right
 * feeling. Fame instead pays out on a concave curve so that:
 *
 *  - a short daily session is worth more per minute than a marathon,
 *  - the curve reads the user's DAILY total, not the single session, so
 *    splitting 2h into six 20-minute reports earns exactly the same as one 2h
 *    report,
 *  - self-reported time can't inflate the economy without bound — the curve
 *    component is capped per day.
 *
 * Consistency is rewarded with a flat daily bonus (paid once per day) rather
 * than the old streak multiplier, which stacked multiplicatively with session
 * length and paid marathon-plus-streak users the most.
 */

/** `fame = FAME_CURVE_FACTOR * sqrt(dailyMinutes)` — 1h ≈ 23, 2h ≈ 33, 4h ≈ 46. */
export const FAME_CURVE_FACTOR = 3;

/** Ceiling on the curve component alone. Flat bonuses are added on top. */
export const MAX_DAILY_CURVE_FAME = 60;

/** Mic accuracy (%) at or above which the session's curve fame is multiplied. */
export const HIGH_ACCURACY_THRESHOLD = 85;

export const HIGH_ACCURACY_MULTIPLIER = 1.25;

/** Flat "you showed up" fame, paid once per day. Checked longest streak first. */
export const STREAK_FAME_BONUSES: ReadonlyArray<{ minStreak: number; fame: number }> = [
  { minStreak: 30, fame: 15 },
  { minStreak: 7, fame: 8 },
  { minStreak: 3, fame: 3 },
];

/**
 * Back-dated reports pay a fixed token instead of feeding the curve: their
 * minutes belong to a past day whose counter is gone, so letting them through
 * would be a free way around the daily cap.
 */
export const BACKDATED_REPORT_FAME = 5;

/** Per-user, per-day fame counter persisted at `statistics.fameDay`. */
export interface FameDayState {
  /** Local calendar day (`YYYY-MM-DD`) the counter belongs to. */
  date: string;
  /** Practice minutes already paid out on the curve for that day. */
  minutes: number;
  /** Whether the flat streak bonus has been paid for that day. */
  streakBonusClaimed: boolean;
}

export interface SessionFameInput {
  /** This session's practice time, in milliseconds. */
  sessionTimeMs: number;
  /** The user's local day (`YYYY-MM-DD`) this session is being logged on. */
  dayKey: string;
  /** Streak in days after this report. */
  streak: number;
  /** The stored counter, whatever day it happens to be from. */
  fameDay?: FameDayState | null;
  /** Mic accuracy (0–100) when the session was mic-scored. */
  accuracy?: number;
  /** Days back — non-zero marks a back-dated report. */
  isDateBackReport?: number;
}

export interface SessionFameResult {
  /** Total fame to credit for this session. */
  fame: number;
  /** The curve component, after the accuracy multiplier. */
  curveFame: number;
  /** The flat streak component (0 when already paid today). */
  streakBonus: number;
  /** Whether the accuracy multiplier applied — the UI can call it out. */
  accuracyBonusApplied: boolean;
  /** The counter to persist. */
  fameDay: FameDayState;
}

/** Cumulative fame owed for `minutes` of practice in one day. Monotone, so the
 * difference between two calls is never negative. */
export const cumulativeDailyFame = (minutes: number): number =>
  Math.min(
    MAX_DAILY_CURVE_FAME,
    Math.round(FAME_CURVE_FACTOR * Math.sqrt(Math.max(0, minutes)))
  );

export const getStreakFameBonus = (streak: number): number =>
  STREAK_FAME_BONUSES.find((tier) => streak >= tier.minStreak)?.fame ?? 0;

export const calculateSessionFame = ({
  sessionTimeMs,
  dayKey,
  streak,
  fameDay,
  accuracy,
  isDateBackReport,
}: SessionFameInput): SessionFameResult => {
  // A counter from an earlier day is stale — the new day starts from zero.
  const isSameDay = fameDay?.date === dayKey;
  const minutesBefore = isSameDay ? Math.max(0, fameDay?.minutes ?? 0) : 0;
  const streakBonusClaimed = isSameDay ? Boolean(fameDay?.streakBonusClaimed) : false;

  if (isDateBackReport) {
    return {
      fame: BACKDATED_REPORT_FAME,
      curveFame: BACKDATED_REPORT_FAME,
      streakBonus: 0,
      accuracyBonusApplied: false,
      // Untouched: a back-dated report must not consume today's allowance.
      fameDay: { date: dayKey, minutes: minutesBefore, streakBonusClaimed },
    };
  }

  const sessionMinutes = Math.max(0, sessionTimeMs) / 60000;
  const minutesAfter = minutesBefore + sessionMinutes;
  const rawCurveFame = cumulativeDailyFame(minutesAfter) - cumulativeDailyFame(minutesBefore);

  const accuracyBonusApplied =
    rawCurveFame > 0 && accuracy !== undefined && accuracy >= HIGH_ACCURACY_THRESHOLD;
  const curveFame = accuracyBonusApplied
    ? Math.round(rawCurveFame * HIGH_ACCURACY_MULTIPLIER)
    : rawCurveFame;

  // The bonus is for practicing today at all, so it needs a session that
  // actually earned something — an empty report shouldn't claim it.
  const streakBonus = !streakBonusClaimed && curveFame > 0 ? getStreakFameBonus(streak) : 0;

  return {
    fame: curveFame + streakBonus,
    curveFame,
    streakBonus,
    accuracyBonusApplied,
    fameDay: {
      date: dayKey,
      minutes: minutesAfter,
      streakBonusClaimed: streakBonusClaimed || streakBonus > 0,
    },
  };
};
