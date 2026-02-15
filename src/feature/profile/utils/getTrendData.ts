import type { ReportListInterface } from "types/api.types";

interface DayReport {
  date: Date;
  report: ReportListInterface | undefined;
}

type TrendDataKey = 'points' | 'time';

interface TrendDataOptions {
  days?: number;
}

const getDayKey = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getValueFromReport = (report: ReportListInterface | undefined, key: TrendDataKey): number => {
  if (!report) return 0;

  if (key === 'time') {
    return report.totalTime / 3600000;
  }

  return report.points;
};

export const getTrendData = (
  datasWithReports: DayReport[] | null,
  key: TrendDataKey,
  options: TrendDataOptions = { days: 14 }
): number[] => {
  if (!datasWithReports) return [];

  const { days = 14 } = options;
  const now = new Date();

  const reportMap = datasWithReports.reduce((acc, dayReport) => {
    if (dayReport && dayReport.date) {
      acc[getDayKey(dayReport.date)] = dayReport.report;
    }
    return acc;
  }, {} as Record<string, ReportListInterface | undefined>);

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - index));
    const dayKey = getDayKey(date);

    const dayReport = reportMap[dayKey];
    return getValueFromReport(dayReport, key);
  });
}; 