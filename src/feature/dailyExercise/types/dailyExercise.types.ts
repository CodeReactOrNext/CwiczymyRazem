/** One player's best run on one day's board. */
export interface DailyExerciseEntry {
  userId: string;
  displayName: string;
  avatar: string;
  lvl: number;
  score: number;
  accuracy: number;
  bpm?: number;
  /** ms since epoch of the run that set this score. */
  updatedAt: number;
}

export interface DailyExerciseLeaderboard {
  dayKey: string;
  exerciseId: string | null;
  top: DailyExerciseEntry[];
  /** The asking player's own entry, whether or not it made the top five. */
  me: (DailyExerciseEntry & { rank: number }) | null;
  /** Everyone who has scored today. */
  players: number;
}

export interface DailyExerciseSubmission {
  dayKey: string;
  exerciseId: string;
  score: number;
  accuracy: number;
  bpm?: number;
}
