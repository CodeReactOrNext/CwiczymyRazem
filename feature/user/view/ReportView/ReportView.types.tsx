export interface ReportFormikInterface {
  techniqueHours: string;
  techniqueMinutes: string;
  theoryHours: string;
  theoryMinutes: string;
  hearingHours: string;
  hearingMinutes: string;
  creativityHours: string;
  creativityMinutes: string;
  habbits: (
    | "exercise_plan"
    | "new_things"
    | "warmup"
    | "metronome"
    | "recording"
  )[];
}
export interface ReportDataInterface {
  reportDate: Date;
  basePoints: number;
  bonusPoints: {
    multiplier: number;
    habitsCount: number;
    additionalPoints: number;
    time: number;
    timePoints: number;
  };
}
