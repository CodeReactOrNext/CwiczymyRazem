import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";

import type { DateWithReport, ReportListInterfaceWithTimeSumary } from "./activityLog.types";

export const getEmptySlots = (dayOfWeek: number): DateWithReport[] => {
  const slotsNeeded = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

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
  const reportsMap: Record<string, ReportListInterfaceWithTimeSumary> = {};

  rawReports.forEach((exerciseLog) => {
    const reportDate = new Date(exerciseLog.reportDate.seconds * 1000);
    const dateKey = formatDateKey(
      reportDate.getFullYear(),
      reportDate.getMonth(),
      reportDate.getDate()
    );

    if (reportsMap[dateKey]) {
      const existingReport = reportsMap[dateKey];

      existingReport.points += exerciseLog.totalPoints;
      existingReport.totalTime += exerciseLog.bonusPoints.time;

      if (existingReport.exceriseTitle) {
        exerciseLog.exceriseTitle + "  " + existingReport.exceriseTitle;
      }

      if (existingReport.activities) {
        existingReport.activities.push({
          title: exerciseLog.exceriseTitle,
          planId: exerciseLog.planId ?? undefined,
          points: exerciseLog.totalPoints,
          time: exerciseLog.bonusPoints.time,
          timeSumary: exerciseLog.timeSumary,
        });
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
    } else {
      reportsMap[dateKey] = {
        points: exerciseLog.totalPoints,
        date: reportDate,
        totalTime: exerciseLog.bonusPoints.time,
        isDateBackReport: exerciseLog.isDateBackReport,
        exceriseTitle: exerciseLog.exceriseTitle,
        timeSumary: exerciseLog.timeSumary,
        planId: exerciseLog.planId ?? undefined,
        activities: [
          {
            title: exerciseLog.exceriseTitle,
            planId: exerciseLog.planId ?? undefined,
            points: exerciseLog.totalPoints,
            time: exerciseLog.bonusPoints.time,
            timeSumary: exerciseLog.timeSumary,
          },
        ],
      };
    }
  });

  return Object.values(reportsMap);
}; 