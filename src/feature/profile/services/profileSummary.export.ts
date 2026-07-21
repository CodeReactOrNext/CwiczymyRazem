import type { StatisticsDataInterface } from "types/api.types";
import { getLocalDateKey } from "utils/converter";
import { buildCsv, downloadCsv } from "utils/csvExport";

const msToMinutes = (ms: number) => Math.round(ms / 60000);

export const buildProfileSummaryCsv = (stats: StatisticsDataInterface): string => {
  const rows: Array<[string, string | number]> = [
    ["Level", stats.lvl],
    ["Total points", stats.points],
    ["Sessions logged", stats.sessionCount],
    ["Current streak (days)", stats.actualDayWithoutBreak],
    ["Longest streak (days)", stats.dayWithoutBreak],
    ["Achievements unlocked", stats.achievements?.length ?? 0],
    ["Technique time (min)", msToMinutes(stats.time.technique)],
    ["Theory time (min)", msToMinutes(stats.time.theory)],
    ["Hearing time (min)", msToMinutes(stats.time.hearing)],
    ["Creativity time (min)", msToMinutes(stats.time.creativity)],
    ["Longest session (min)", msToMinutes(stats.time.longestSession)],
    ["Last practice date", stats.lastReportDate ?? ""],
  ];

  return buildCsv(["Metric", "Value"], rows);
};

export const downloadProfileSummaryCsv = (
  stats: StatisticsDataInterface,
  filename = `riffquest-profile-summary-${getLocalDateKey(new Date())}.csv`
) => downloadCsv(buildProfileSummaryCsv(stats), filename);
