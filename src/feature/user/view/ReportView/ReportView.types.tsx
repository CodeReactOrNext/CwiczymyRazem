export type HabbitsType =
  | "exercise_plan"
  | "new_things"
  | "warmup"
  | "metronome"
  | "recording";

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
  skillPointsGained?: Record<string, number>;
}

export interface ReportDataInterface {
  reportDate: Date;
  totalPoints: number;
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
