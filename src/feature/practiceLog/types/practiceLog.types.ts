export type SessionType = "manual" | "plan" | "song";

export type DateRangeKey = "7d" | "30d" | "90d" | "all";

export type DurationKey = "all" | "short" | "medium" | "long";

export type SortKey = "date_desc" | "date_asc" | "time_desc" | "points_desc";

export interface SessionTimeSumary {
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  sumTime: number;
}

export interface PracticeLogSession {
  /** Firestore doc id (reportDate ISO string) — the edit/delete key. */
  id: string;
  date: Date;
  title: string;
  type: SessionType;
  points: number;
  /** Session duration in ms (bonusPoints.time). */
  timeMs: number;
  timeSumary?: SessionTimeSumary;
  description?: string;
  songTitle?: string;
  songArtist?: string;
  isDateBackReport?: string;
}

export interface PracticeLogFilters {
  range: DateRangeKey;
  /** YYYY-MM-DD; when set it wins over range. */
  date: string | null;
  type: SessionType | "all";
  duration: DurationKey;
  sort: SortKey;
}

export interface PracticeLogSummaryData {
  totalTimeMs: number;
  sessionCount: number;
  totalPoints: number;
  activeDays: number;
  avgSessionMs: number;
  perCategoryMs: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  };
  /** Per-day rows in the shape ActivityChart consumes. */
  dailyRows: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export interface DayGroup {
  dateKey: string;
  date: Date;
  totalTimeMs: number;
  totalPoints: number;
  sessions: PracticeLogSession[];
}
