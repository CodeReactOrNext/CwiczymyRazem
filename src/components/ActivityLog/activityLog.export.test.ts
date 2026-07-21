import { describe, expect, it } from "vitest";

import { buildActivityLogCsv } from "./activityLog.export";
import type { FormattedActivityReport } from "./activityLog.types";

describe("buildActivityLogCsv", () => {
  it("includes a header row and one row per activity", () => {
    const reports: FormattedActivityReport[] = [
      {
        date: new Date(2024, 0, 15),
        techniqueTime: 600000,
        theoryTime: 300000,
        hearingTime: 0,
        creativityTime: 0,
        exceriseTitle: "Warm up",
        totalTime: 900000,
        activities: [
          {
            title: "Chromatic scale",
            points: 10,
            time: 600000,
            timeSumary: {
              techniqueTime: 600000,
              theoryTime: 0,
              hearingTime: 0,
              creativityTime: 0,
              sumTime: 600000,
            },
          },
          {
            title: "Ear training",
            points: 5,
            time: 300000,
            timeSumary: {
              techniqueTime: 0,
              theoryTime: 300000,
              hearingTime: 0,
              creativityTime: 0,
              sumTime: 300000,
            },
          },
        ],
      },
    ];

    const csv = buildActivityLogCsv(reports);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      "Date,Exercise,Points,Total time (min),Technique (min),Theory (min),Hearing (min),Creativity (min)"
    );
    expect(lines[1]).toBe("2024-01-15,Chromatic scale,10,10,10,0,0,0");
    expect(lines[2]).toBe("2024-01-15,Ear training,5,5,0,5,0,0");
  });

  it("falls back to day-level totals when there are no activities", () => {
    const reports: FormattedActivityReport[] = [
      {
        date: new Date(2024, 2, 1),
        techniqueTime: 60000,
        theoryTime: 0,
        hearingTime: 0,
        creativityTime: 0,
        exceriseTitle: "Legacy session",
        totalTime: 60000,
      },
    ];

    const csv = buildActivityLogCsv(reports);
    const lines = csv.split("\n");

    expect(lines[1]).toBe("2024-03-01,Legacy session,0,1,1,0,0,0");
  });

  it("escapes commas and quotes in exercise titles", () => {
    const reports: FormattedActivityReport[] = [
      {
        date: new Date(2024, 4, 5),
        techniqueTime: 0,
        theoryTime: 0,
        hearingTime: 0,
        creativityTime: 0,
        totalTime: 0,
        activities: [
          {
            title: 'Riffs, "solos" and licks',
            points: 1,
            time: 60000,
          },
        ],
      },
    ];

    const csv = buildActivityLogCsv(reports);
    const lines = csv.split("\n");

    expect(lines[1]).toBe(
      '2024-05-05,"Riffs, ""solos"" and licks",1,1,0,0,0,0'
    );
  });
});
