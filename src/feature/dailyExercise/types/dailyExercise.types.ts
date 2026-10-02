import type { PartId, PartTier } from "feature/arsenal/types/arsenal.types";

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
  /** What this day's #1 wins — fixed for the day, shown before anyone plays. */
  prize: DailyExercisePrize;
}

/** What a day's #1 wins: one rare mod or one Legendary part, fixed for the day. */
export type DailyExercisePrize =
  | {
      kind: "mod";
      /** Which pool it fits — a pedal mod never goes on a guitar. */
      modKind: "guitar" | "effect";
      featureId: string;
      label: string;
      points: number;
      /** The stat it raises, as the Arsenal names it ("Play Feeling", "Tone"…). */
      statLabel: string;
    }
  | {
      kind: "part";
      partId: PartId;
      label: string;
      tier: PartTier;
    };

export interface DailyExerciseSubmission {
  dayKey: string;
  exerciseId: string;
  score: number;
  accuracy: number;
  bpm?: number;
}
