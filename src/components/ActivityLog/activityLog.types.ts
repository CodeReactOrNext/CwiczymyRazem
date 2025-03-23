import type { ReportListInterface } from "types/api.types";

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ReportListInterfaceWithTimeSumary = PartiallyRequired<
  ReportListInterface,
  "timeSumary"
>;

export interface ActivityReport {
  date: Date;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
}

export interface DateWithReport {
  date: Date;
  report: ReportListInterface | undefined;
} 