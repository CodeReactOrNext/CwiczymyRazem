export interface ReportFormikInterface {
  techniqueHours: string;
  techniqueMinutes: string;
  theoryHours: string;
  theoryMinutes: string;
  hearingHours: string;
  hearingMinutes: string;
  creativeHours: string;
  creativeMinutes: string;
  habbits: string[];
  raportData: Date;
}
export interface ReportDataInterface {
  basePoints: number;
  currentLevel: number;
  bonusPoints: {
    streak: number;
    multiplier: number;
    habitsCount: number;
    additionalPoints: number;
    time: number;
    timePoints: number;
  };
}
