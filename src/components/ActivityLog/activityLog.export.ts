import { getLocalDateKey } from "utils/converter";

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
  "Plan ID",
];

const msToMinutes = (ms: number) => Math.round(ms / 60000);

const escapeCsvField = (value: string | number) => {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const toCsvRow = (fields: Array<string | number>) =>
  fields.map(escapeCsvField).join(",");

export const buildActivityLogCsv = (
  reports: FormattedActivityReport[]
): string => {
  const rows = reports.flatMap((report) => {
    const dateKey = getLocalDateKey(new Date(report.date));

    if (report.activities && report.activities.length > 0) {
      return report.activities.map((activity) =>
        toCsvRow([
          dateKey,
          activity.title,
          activity.points,
          msToMinutes(activity.time),
          msToMinutes(activity.timeSumary?.techniqueTime ?? 0),
          msToMinutes(activity.timeSumary?.theoryTime ?? 0),
          msToMinutes(activity.timeSumary?.hearingTime ?? 0),
          msToMinutes(activity.timeSumary?.creativityTime ?? 0),
          activity.planId ?? "",
        ])
      );
    }

    return [
      toCsvRow([
        dateKey,
        report.exceriseTitle ?? "",
        0,
        msToMinutes(report.totalTime),
        msToMinutes(report.techniqueTime),
        msToMinutes(report.theoryTime),
        msToMinutes(report.hearingTime),
        msToMinutes(report.creativityTime),
        "",
      ]),
    ];
  });

  return [toCsvRow(CSV_HEADERS), ...rows].join("\n");
};

export const downloadActivityLogCsv = (
  reports: FormattedActivityReport[],
  filename = `riffquest-sessions-${getLocalDateKey(new Date())}.csv`
) => {
  const csv = buildActivityLogCsv(reports);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
