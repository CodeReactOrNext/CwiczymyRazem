import type { StatisticsDataInterface } from "types/api.types";

import { getFocusSuggestion } from "./getFocusSuggestion";
import type { PracticeArea } from "./types";

export interface MetricsResult {
  totalTime: number;
  avgSessionLength: number;
  avgPointsPerHour: number;
  practiceAreas: PracticeArea[];
  strongestArea: PracticeArea;
  focusSuggestion: ReturnType<typeof getFocusSuggestion>;
}

export const calculateMetrics = (
  time: StatisticsDataInterface["time"],
  points: number,
  sessionCount: number
): MetricsResult => {
  const totalTime = time.technique + time.theory + time.hearing + time.creativity;

  const avgSessionLength = sessionCount > 0 ? totalTime / sessionCount : 0;

  const avgPointsPerHour = totalTime > 0 ? (points / totalTime) * 3600000 : 0;

  const practiceAreas: PracticeArea[] = [
    { name: "technique", time: time.technique },
    { name: "theory", time: time.theory },
    { name: "hearing", time: time.hearing },
    { name: "creativity", time: time.creativity },
  ];

  const strongestArea = practiceAreas.reduce((prev, current) =>
    current.time > prev.time ? current : prev
  );

  const focusSuggestion = getFocusSuggestion(practiceAreas);

  return {
    totalTime,
    avgSessionLength,
    avgPointsPerHour,
    practiceAreas,
    strongestArea,
    focusSuggestion,
  };
}; 