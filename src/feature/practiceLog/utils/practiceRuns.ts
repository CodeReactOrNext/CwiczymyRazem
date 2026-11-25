import { STREAK_MILESTONES } from "constants/streakMilestones";
import { addDays, startOfDay } from "date-fns";
import { getLocalDateKey } from "utils/converter";

import { parseDateKey } from "./practiceLog.utils";

export type RunEdge = "single" | "start" | "middle" | "end";

/**
 * Where each practice day sits in its row of the calendar's chain: neighbours
 * practised back to back join into one ribbon, which is cut at the week's edge.
 */
export const getRunEdges = (dateKeys: string[]): Record<RunEdge, Date[]> => {
  const practised = new Set(dateKeys);
  const edges: Record<RunEdge, Date[]> = {
    single: [],
    start: [],
    middle: [],
    end: [],
  };

  practised.forEach((key) => {
    const date = parseDateKey(key);
    const weekday = (date.getDay() + 6) % 7;
    const joinsLeft =
      weekday > 0 && practised.has(getLocalDateKey(addDays(date, -1)));
    const joinsRight =
      weekday < 6 && practised.has(getLocalDateKey(addDays(date, 1)));
    const edge: RunEdge = joinsLeft
      ? joinsRight
        ? "middle"
        : "end"
      : joinsRight
        ? "start"
        : "single";
    edges[edge].push(date);
  });

  return edges;
};

/** The day the running streak reaches its next milestone if played daily from here. */
export const getNextStreakMilestone = (
  streak: number,
  didPracticeToday: boolean,
  now: Date = new Date(),
): { days: number; date: Date } | null => {
  if (streak < 1) return null;
  const days = STREAK_MILESTONES.find((milestone) => milestone > streak);
  if (!days) return null;
  const left = days - streak - (didPracticeToday ? 0 : 1);
  return { days, date: addDays(startOfDay(now), left) };
};
