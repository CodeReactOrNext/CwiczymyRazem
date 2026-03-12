import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DailySummaryResponse, PromptConfig, WeeklySummaryResponse } from "../types/summary.types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type SummaryMode = "daily" | "weekly";

interface UsePracticeSummaryProps {
  userAuth: string;
  userLevel: number;
  streak: number;
  mode: SummaryMode;
  promptConfig?: PromptConfig;
}

interface SummaryState {
  daily: DailySummaryResponse | null;
  weekly: WeeklySummaryResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const usePracticeSummary = ({
  userAuth,
  userLevel,
  streak,
  mode,
  promptConfig,
}: UsePracticeSummaryProps) => {
  const [state, setState] = useState<SummaryState>({
    daily: null,
    weekly: null,
    isLoading: false,
    error: null,
  });

  const loadedModes = useRef<Set<SummaryMode>>(new Set());

  const generateSummary = useCallback(
    async (targetMode: SummaryMode) => {
      if (!userAuth) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const today = new Date();
        const year = today.getFullYear();
        const rawLogs = await firebaseGetUserRaprotsLogs(userAuth, year);

        if (targetMode === "daily") {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          const todayLogs = rawLogs.filter((log) => {
            const logDate = new Date(log.reportDate.seconds * 1000);
            return isSameDay(logDate, yesterday);
          });

          const exercises = todayLogs.map((log) => ({
            title: log.exceriseTitle || "Practice session",
            techniqueTime: log.timeSumary?.techniqueTime || 0,
            theoryTime: log.timeSumary?.theoryTime || 0,
            hearingTime: log.timeSumary?.hearingTime || 0,
            creativityTime: log.timeSumary?.creativityTime || 0,
            totalTime: log.timeSumary?.sumTime || 0,
            points: log.totalPoints || 0,
            songTitle: log.songTitle,
          }));

          const totalPoints = exercises.reduce((sum, e) => sum + e.points, 0);

          const res = await fetch("/api/generate-daily-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercises,
              totalPoints,
              streak,
              userLevel,
              practiceStyle: promptConfig?.practiceStyle,
              goal: promptConfig?.goal,
            }),
          });

          if (!res.ok) throw new Error("Failed to generate daily summary");
          const data = (await res.json()) as DailySummaryResponse;

          setState((prev) => ({ ...prev, daily: data, isLoading: false }));
        } else {
          const days = Array.from({ length: 7 }, (_, i) => {
            const date = getStartOfDay(today);
            const currentDay = date.getDay();
            const daysToLastMonday = (currentDay === 0 ? 6 : currentDay - 1) + 7;
            date.setDate(date.getDate() - daysToLastMonday + i);
            return date;
          });

          const dayDataList = days.map((dayStart) => {
            const dayLogs = rawLogs.filter((log) => {
              const logDate = new Date(log.reportDate.seconds * 1000);
              return isSameDay(logDate, dayStart);
            });

            const exercises = dayLogs.map((log) => ({
              title: log.exceriseTitle || "Practice session",
              totalTime: log.timeSumary?.sumTime || 0,
              techniqueTime: log.timeSumary?.techniqueTime || 0,
              theoryTime: log.timeSumary?.theoryTime || 0,
              hearingTime: log.timeSumary?.hearingTime || 0,
              creativityTime: log.timeSumary?.creativityTime || 0,
              points: log.totalPoints || 0,
              songTitle: log.songTitle,
            }));

            const totalMinutes = Math.round(
              exercises.reduce((sum, e) => sum + e.totalTime, 0) / 60
            );
            const totalPoints = exercises.reduce((sum, e) => sum + e.points, 0);

            return {
              dayName: DAY_NAMES[dayStart.getDay()],
              date: dayStart.toISOString().split("T")[0],
              exercises,
              totalMinutes,
              totalPoints,
            };
          });

          const weekTotalPoints = dayDataList.reduce(
            (sum, d) => sum + d.totalPoints,
            0
          );

          const res = await fetch("/api/generate-weekly-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              days: dayDataList,
              streak,
              userLevel,
              weekTotalPoints,
              practiceStyle: promptConfig?.practiceStyle,
              goal: promptConfig?.goal,
            }),
          });

          if (!res.ok) throw new Error("Failed to generate weekly summary");
          const data = (await res.json()) as WeeklySummaryResponse;

          setState((prev) => ({ ...prev, weekly: data, isLoading: false }));
        }

        loadedModes.current.add(targetMode);
      } catch (err) {
        console.error("usePracticeSummary error:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Could not generate summary. Try again.",
        }));
      }
    },
    [userAuth, streak, userLevel, promptConfig]
  );

  useEffect(() => {
    if (!loadedModes.current.has(mode)) {
      generateSummary(mode);
    }
  }, [mode, generateSummary]);

  const regenerate = useCallback(() => {
    generateSummary(mode);
  }, [mode, generateSummary]);

  return {
    dailySummary: state.daily,
    weeklySummary: state.weekly,
    isLoading: state.isLoading,
    error: state.error,
    regenerate,
  };
};
