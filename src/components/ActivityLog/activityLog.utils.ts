import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";

import type { DateWithReport, ReportListInterfaceWithTimeSumary } from "./activityLog.types";

export const getEmptySlots = (dayOfWeek: number): DateWithReport[] => {
  const numOfDayWhereUiStart = 6;
  const slotsNeeded = numOfDayWhereUiStart - dayOfWeek;

  if (slotsNeeded <= 0) return [];

  return Array(slotsNeeded)
    .fill(null)
    .map(() => ({
      date: new Date(),
      report: undefined,
    }));
};

export const formatDateKey = (year: number, month: number, day: number): string => {
  const m = month + 1;
  return `${year}-${m.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

export const processRawReports = (
  rawReports: FirebaseUserExceriseLog[]
): ReportListInterfaceWithTimeSumary[] => {
  return rawReports.reduce((aggregatedReports, exerciseLog) => {
    const reportDate = new Date(exerciseLog.reportDate.seconds * 1000);

    const existingReportIndex = aggregatedReports.findIndex(
      ({ date }: { date: Date }) => {
        return (
          reportDate.getFullYear() === date.getFullYear() &&
          reportDate.getMonth() === date.getMonth() &&
          reportDate.getDate() === date.getDate()
        );
      }
    );

    if (existingReportIndex !== -1) {
      const existingReport = aggregatedReports[existingReportIndex];

      existingReport.points += exerciseLog.totalPoints;
      existingReport.totalTime += exerciseLog.bonusPoints.time;

      if (existingReport.exceriseTitle) {
        existingReport.exceriseTitle =
          exerciseLog.exceriseTitle + "  " + existingReport.exceriseTitle;
      }

      if (exerciseLog.timeSumary) {
        if (!existingReport.timeSumary) {
          existingReport.timeSumary = exerciseLog.timeSumary;
        } else {
          existingReport.timeSumary = {
            techniqueTime:
              existingReport.timeSumary.techniqueTime +
              exerciseLog.timeSumary.techniqueTime,
            theoryTime:
              existingReport.timeSumary.theoryTime +
              exerciseLog.timeSumary.theoryTime,
            hearingTime:
              existingReport.timeSumary.hearingTime +
              exerciseLog.timeSumary.hearingTime,
            creativityTime:
              existingReport.timeSumary.creativityTime +
              exerciseLog.timeSumary.creativityTime,
            sumTime:
              existingReport.timeSumary.sumTime +
              exerciseLog.timeSumary.sumTime,
          };
        }
      }

      return aggregatedReports;
    }

    aggregatedReports.push({
      points: exerciseLog.totalPoints,
      date: reportDate,
      totalTime: exerciseLog.bonusPoints.time,
      isDateBackReport: exerciseLog.isDateBackReport,
      exceriseTitle: exerciseLog.exceriseTitle,
      timeSumary: exerciseLog.timeSumary,
    });

    return aggregatedReports;
  }, [] as ReportListInterfaceWithTimeSumary[]);
}; 