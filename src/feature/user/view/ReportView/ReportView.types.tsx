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
}
