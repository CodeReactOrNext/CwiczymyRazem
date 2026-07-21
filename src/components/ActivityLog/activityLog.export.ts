import { getLocalDateKey } from "utils/converter";
import { buildCsv, downloadCsv } from "utils/csvExport";

import type { FormattedActivityReport } from "./activityLog.types";

const CSV_HEADERS = [
  "Date",
  "Exercise",
  "Points",
  "Total time (min)",
  "Technique (min)",
  "Theory (min)",
  "Hearing (min)",
  "Creativity (min)",
];

const msToMinutes = (ms: number) => Math.round(ms / 60000);

export const buildActivityLogCsv = (
  reports: FormattedActivityReport[]
): string => {
  const rows = reports.flatMap((report) => {
    const dateKey = getLocalDateKey(new Date(report.date));

    if (report.activities && report.activities.length > 0) {
      return report.activities.map((activity) => [
        dateKey,
        activity.title,
        activity.points,
        msToMinutes(activity.time),
        msToMinutes(activity.timeSumary?.techniqueTime ?? 0),
        msToMinutes(activity.timeSumary?.theoryTime ?? 0),
        msToMinutes(activity.timeSumary?.hearingTime ?? 0),
        msToMinutes(activity.timeSumary?.creativityTime ?? 0),
      ]);
    }

    return [
      [
        dateKey,
        report.exceriseTitle ?? "",
        0,
        msToMinutes(report.totalTime),
        msToMinutes(report.techniqueTime),
        msToMinutes(report.theoryTime),
        msToMinutes(report.hearingTime),
        msToMinutes(report.creativityTime),
      ],
    ];
  });

  return buildCsv(CSV_HEADERS, rows);
};

export const downloadActivityLogCsv = (
  reports: FormattedActivityReport[],
  filename = `riffquest-sessions-${getLocalDateKey(new Date())}.csv`
) => downloadCsv(buildActivityLogCsv(reports), filename);
