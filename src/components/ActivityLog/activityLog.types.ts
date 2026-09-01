import type { ReportListInterface } from "types/api.types";

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ReportListInterfaceWithTimeSumary = PartiallyRequired<
  ReportListInterface,
  "timeSumary"
> & {
  activities?: ActivityDetail[];
  /**
   * The most recent raw log of this day. `date` holds the day’s *first* report,
   * which the calendar grid needs; anything asking when the user last practised
   * wants this one.
   */
  lastActivityDate?: Date;
};

export interface ActivityDetail {
  title: string;
  planId?: string;
  points: number;
  time: number;
  timeSumary?: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  };
}

export interface FormattedActivityReport {
  date: Date;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  exceriseTitle?: string;
  totalTime: number;
  activities?: ActivityDetail[];
}

export interface DateWithReport {
  date: Date;
  report: ReportListInterfaceWithTimeSumary | undefined;
  /** Filler cell padding the first column so Jan 1 lands on its weekday row. */
  isPlaceholder?: boolean;
}