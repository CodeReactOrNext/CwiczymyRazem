import {
  DAILY_BOARD_GRACE_MS,
  DAILY_EXERCISE_POOL,
  DAILY_LEADERBOARD_SIZE,
  DAILY_PRIZE_MIN_PLAYERS,
} from "feature/dailyExercise/utils/dailyExercise";

export interface CompetitionPageProps {
  daily: {
    /** Exercises the day's pick is drawn from. */
    poolSize: number;
    /** Places the day's board lists. */
    boardSize: number;
    /** Players a board needs before anyone can win its prize. */
    minPlayers: number;
    /** Minutes after midnight UTC that yesterday's runs still land. */
    graceMinutes: number;
  };
}

/** Read at build time: the daily pool filters the whole exercise catalogue. */
export const buildCompetitionProps = (): CompetitionPageProps => ({
  daily: {
    poolSize: DAILY_EXERCISE_POOL.length,
    boardSize: DAILY_LEADERBOARD_SIZE,
    minPlayers: DAILY_PRIZE_MIN_PLAYERS,
    graceMinutes: DAILY_BOARD_GRACE_MS / 60_000,
  },
});
