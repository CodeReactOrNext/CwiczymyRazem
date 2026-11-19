import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface, userSliceInitialState } from "types/api.types";

/**
 * The made-up player the dev simulator logs in as. Its id matches no real
 * account, and the simulator only runs signed out, so nothing it triggers can
 * read or write a real player's data.
 */
export const SIM_UID = "mascot-sim-player";

const dayKey = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const simStats = (over: Partial<StatisticsDataInterface> = {}): StatisticsDataInterface => ({
  ...statisticsInitial,
  lvl: 7,
  points: 1840,
  currentLevelMaxPoints: 2200,
  sessionCount: 42,
  habitsCount: 18,
  dayWithoutBreak: 4,
  actualDayWithoutBreak: 4,
  maxPoints: 260,
  lastReportDate: dayKey(0),
  fame: 350,
  time: { technique: 520, theory: 120, hearing: 90, creativity: 140, longestSession: 75 },
  ...over,
});

/** A streak that broke: last session three days ago. */
export const simBrokenStreak = () =>
  simStats({ actualDayWithoutBreak: 0, dayWithoutBreak: 0, lastReportDate: dayKey(3) });

export const simUserState = (stats: StatisticsDataInterface = simStats()): Partial<userSliceInitialState> => ({
  userAuth: SIM_UID,
  userInfo: { displayName: "Kostek Tester", avatar: "" },
  currentUserStats: stats,
  previousUserStats: stats,
  isLoggedOut: null,
});

/** What the session report carries into the summary. `points: 0` is a too-short session. */
export const simReport = (points: number): ReportDataInterface => ({
  reportDate: new Date(),
  totalPoints: points,
  fameEarned: points > 0 ? 35 : 0,
  bonusPoints: {
    multiplier: points > 0 ? 1.2 : 1,
    habitsCount: points > 0 ? 2 : 0,
    additionalPoints: points > 0 ? 20 : 0,
    time: points > 0 ? 1500 : 60,
    timePoints: points > 0 ? 100 : 0,
  },
});
