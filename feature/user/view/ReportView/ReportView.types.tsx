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
