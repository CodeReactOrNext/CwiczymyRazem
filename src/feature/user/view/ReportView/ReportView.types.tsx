export type HabbitsType =
  | "exercise_plan"
  | "new_things"
  | "warmup"
  | "metronome"
  | "recording";

/**
 * One song a session's time was attributed to. A session can hold several of
 * them (a repeat run over the setlist); the singular `songId`/`songTitle`/
 * `songArtist` fields below stay filled with the primary one so every consumer
 * that predates multi-song reports keeps working.
 */
export interface ReportSongEntry {
  songId: string;
  songTitle: string;
  songArtist: string;
  /** Total time spent on this song, in ms — `techniqueMs` + `hearingMs`. */
  practiceMs: number;
  techniqueMs: number;
  hearingMs: number;
}

export interface ReportFormikInterface {
  techniqueHours: string;
  techniqueMinutes: string;
  theoryHours: string;
  theoryMinutes: string;
  hearingHours: string;
  hearingMinutes: string;
  creativityHours: string;
  creativityMinutes: string;
  countBackDays: number;
  reportTitle: string;
  habbits: HabbitsType[];
  avatarUrl: string | null;
  planId?: string | null;
  songId?: string;
  songTitle?: string;
  songArtist?: string;
  /** Every song of this session with its own time; empty/absent for non-song sessions. */
  songs?: ReportSongEntry[];
  skillPointsGained?: Record<string, number>;
  exerciseRecords?: {
    micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
    earTrainingHighScore?: { exerciseTitle: string; score: number };
  };
  micPerformance?: { score: number; accuracy: number };
  earTrainingPerformance?: { score: number };
  clientTodayISO?: string;
  clientNowISO?: string;
  clientDisplayStreak?: number;
  clientTimeZone?: string;
}

export interface ReportDataInterface {
  reportDate: Date;
  totalPoints: number;
  fameEarned?: number;
  /** Flat daily streak fame included in `fameEarned` (0 when already paid today). */
  fameStreakBonus?: number;
  /** Whether the high-accuracy multiplier applied to this session's fame. */
  fameAccuracyBonus?: boolean;
  /** Fame the user's rig paid for this session, already included in `fameEarned`. */
  fameRigBonus?: number;
  /**
   * Fame the pedalboard's wiring order paid, also already inside `fameEarned`.
   * Kept apart from `fameRigBonus` because it is earned by a different move:
   * that one is for owning the gear, this one for arranging it properly.
   */
  fameChainBonus?: number;
  /**
   * Fame the gear's traits paid, after the rig ceiling took its cut — also
   * already inside `fameEarned`. Reported so the post-session breakdown can name
   * it: without it the traits' share silently lands on the practice line.
   */
  fameTraitBonus?: number;
  bonusPoints: {
    multiplier: number;
    habitsCount: number;
    additionalPoints: number;
    time: number;
    timePoints: number;
  };
  skillRewardSkillId?: string; // Legacy support or new usage? keeping for now just in case
  skillRewardAmount?: number; // Legacy support or new usage? keeping for now just in case
  skillPointsGained?: Record<string, number>;
}
