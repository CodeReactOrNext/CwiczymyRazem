import type { ReportListInterface } from "types/api.types";

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ReportListInterfaceWithTimeSumary = PartiallyRequired<
  ReportListInterface,
  "timeSumary"
> & {
  activities?: ActivityDetail[];
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

export interface ActivityReport {
  date: Date;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
}

export interface DateWithReport {
  date: Date;
  report: ReportListInterfaceWithTimeSumary | undefined;
} 