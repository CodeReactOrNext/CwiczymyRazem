import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { getLocalDateKey } from "utils/converter";

import type {
  DayGroup,
  PracticeLogFilters,
  PracticeLogSession,
  PracticeLogSummaryData,
  SessionType,
} from "../types/practiceLog.types";

const DURATION_BOUNDS_MS = {
  short: { min: 0, max: 15 * 60 * 1000 },
  medium: { min: 15 * 60 * 1000, max: 45 * 60 * 1000 },
  long: { min: 45 * 60 * 1000, max: Infinity },
} as const;

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;

const getSessionType = (log: FirebaseUserExceriseLog): SessionType => {
  if (log.planId) return "plan";
  if (log.songId) return "song";
  return "manual";
};

const resolveTitle = (log: FirebaseUserExceriseLog, type: SessionType) => {
  if (type === "plan") {
    const plan = defaultPlans.find((p) => p.id === log.planId);
    if (plan) return plan.title;
  }
  if (type === "song" && log.songTitle) {
    return log.songArtist
      ? `${log.songTitle} — ${log.songArtist}`
      : log.songTitle;
  }
  return log.exceriseTitle || "Practice session";
};

export const mapLogToSession = (
  log: FirebaseUserExceriseLog
): PracticeLogSession | null => {
  if (!log.id || !log.reportDate?.seconds) return null;

  const type = getSessionType(log);

  return {
    id: log.id,
    date: new Date(log.reportDate.seconds * 1000),
    title: resolveTitle(log, type),
    type,
    points: log.totalPoints ?? 0,
    timeMs: log.bonusPoints?.time ?? log.timeSumary?.sumTime ?? 0,
    timeSumary: log.timeSumary,
    description: log.description,
    songTitle: log.songTitle,
    songArtist: log.songArtist,
    isDateBackReport: log.isDateBackReport,
  };
};

export const applyFilters = (
  sessions: PracticeLogSession[],
  filters: PracticeLogFilters
): PracticeLogSession[] => {
  let result = sessions;

  if (filters.date) {
    result = result.filter(
      (session) => getLocalDateKey(session.date) === filters.date
    );
  } else if (filters.range !== "all") {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[filters.range]);
    result = result.filter((session) => session.date >= cutoff);
  }

  if (filters.type !== "all") {
    result = result.filter((session) => session.type === filters.type);
  }

  if (filters.duration !== "all") {
    const { min, max } = DURATION_BOUNDS_MS[filters.duration];
    result = result.filter(
      (session) => session.timeMs >= min && session.timeMs < max
    );
  }

  return result;
};

export const applySort = (
  sessions: PracticeLogSession[],
  sort: PracticeLogFilters["sort"]
): PracticeLogSession[] => {
  const sorted = [...sessions];
  switch (sort) {
    case "date_asc":
      return sorted.sort((a, b) => a.date.getTime() - b.date.getTime());
    case "time_desc":
      return sorted.sort((a, b) => b.timeMs - a.timeMs);
    case "points_desc":
      return sorted.sort((a, b) => b.points - a.points);
    case "date_desc":
    default:
      return sorted.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
};

/** Groups sessions by local calendar day, keeping the incoming session order. */
export const groupSessionsByDay = (
  sessions: PracticeLogSession[]
): DayGroup[] => {
  const groups: DayGroup[] = [];
  const groupsByKey: Record<string, DayGroup> = {};

  sessions.forEach((session) => {
    const dateKey = getLocalDateKey(session.date);
    let group = groupsByKey[dateKey];
    if (!group) {
      group = {
        dateKey,
        date: session.date,
        totalTimeMs: 0,
        totalPoints: 0,
        sessions: [],
      };
      groupsByKey[dateKey] = group;
      groups.push(group);
    }
    group.totalTimeMs += session.timeMs;
    group.totalPoints += session.points;
    group.sessions.push(session);
  });

  return groups;
};

/**
 * Splits day groups into balanced pages without ever splitting a single day
 * across pages. A page closes once it reaches `targetPerPage` sessions, so pages
 * stay a similar height even when days hold wildly different session counts.
 */
export const paginateDayGroups = (
  dayGroups: DayGroup[],
  targetPerPage: number
): DayGroup[][] => {
  if (dayGroups.length === 0) return [];

  const pages: DayGroup[][] = [];
  let current: DayGroup[] = [];
  let count = 0;

  dayGroups.forEach((group) => {
    current.push(group);
    count += group.sessions.length;
    if (count >= targetPerPage) {
      pages.push(current);
      current = [];
      count = 0;
    }
  });

  if (current.length > 0) pages.push(current);

  return pages;
};

export const summarize = (
  sessions: PracticeLogSession[]
): PracticeLogSummaryData => {
  const perCategoryMs = {
    techniqueTime: 0,
    theoryTime: 0,
    hearingTime: 0,
    creativityTime: 0,
  };
  const dailyMap: Record<string, PracticeLogSummaryData["dailyRows"][number]> =
    {};

  let totalTimeMs = 0;
  let totalPoints = 0;

  sessions.forEach((session) => {
    totalTimeMs += session.timeMs;
    totalPoints += session.points;

    const dateKey = getLocalDateKey(session.date);
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: session.date.toISOString(),
        techniqueTime: 0,
        theoryTime: 0,
        hearingTime: 0,
        creativityTime: 0,
      };
    }

    if (session.timeSumary) {
      perCategoryMs.techniqueTime += session.timeSumary.techniqueTime;
      perCategoryMs.theoryTime += session.timeSumary.theoryTime;
      perCategoryMs.hearingTime += session.timeSumary.hearingTime;
      perCategoryMs.creativityTime += session.timeSumary.creativityTime;

      dailyMap[dateKey].techniqueTime += session.timeSumary.techniqueTime;
      dailyMap[dateKey].theoryTime += session.timeSumary.theoryTime;
      dailyMap[dateKey].hearingTime += session.timeSumary.hearingTime;
      dailyMap[dateKey].creativityTime += session.timeSumary.creativityTime;
    }
  });

  const activeDays = Object.keys(dailyMap).length;

  return {
    totalTimeMs,
    sessionCount: sessions.length,
    totalPoints,
    activeDays,
    avgSessionMs: sessions.length ? totalTimeMs / sessions.length : 0,
    perCategoryMs,
    dailyRows: Object.values(dailyMap),
  };
};
