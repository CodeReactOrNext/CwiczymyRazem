import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { reportUpdateUserStats } from "utils/gameLogic/reportUpdateUserState";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


describe("reportHandler", () => {
  const currentUserStats: StatisticsDataInterface = statisticsInitial;

  const emptyInputData: ReportFormikInterface = {
    techniqueHours: "0",
    techniqueMinutes: " 0",
    theoryHours: "0",
    theoryMinutes: "0",
    hearingHours: "0",
    hearingMinutes: "0",
    creativityHours: "0",
    creativityMinutes: "0",
    countBackDays: 0,
    reportTitle: "0",
    habbits: [],
    avatarUrl: null,
  };
  beforeEach(() => {
    const date = new Date(1998, 11, 19);
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count session number, date, streak and not add nothing new if is not provided in InputData. ", () => {
    const result = reportUpdateUserStats({
      currentUserStats,
      inputData: emptyInputData,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });
    expect(result.currentUserStats.actualDayWithoutBreak).toBe(1);
    expect(result.currentUserStats.dayWithoutBreak).toBe(1);
    expect(result.currentUserStats.sessionCount).toBe(1);
    expect(result.currentUserStats.lastReportDate).toBe(new Date(1998, 11, 19).toISOString());
    expect(result.currentUserStats.points).toBe(0);
    expect(result.currentUserStats.lvl).toBe(1);
    expect(result.isDateBackReport).toBe(0);
    expect(result.isNewLevel).toBe(false);
    expect(result.newAchievements).toEqual([]);
    expect(result.raitingData.totalPoints).toBe(0);
    expect(result.raitingData.bonusPoints.streak).toBe(1);
    expect(result.newRecords).toEqual({
      maxPoints: false,
      longestSession: false,
      maxStreak: true, // streak goes 0 → 1, which exceeds previous dayWithoutBreak of 0
      newLevel: false,
    });
  });

  describe("denormalized streak state (read by the reminder cron)", () => {
    const withClientContext = (
      overrides: Partial<ReportFormikInterface> = {}
    ): ReportFormikInterface => ({
      ...emptyInputData,
      clientTodayISO: "1998-12-19",
      clientNowISO: new Date(Date.UTC(1998, 11, 19, 17, 0)).toISOString(),
      clientTimeZone: "Europe/Warsaw",
      ...overrides,
    });

    const run = (inputData: ReportFormikInterface) =>
      reportUpdateUserStats({
        currentUserStats,
        inputData,
        currentUserSongLists: { wantToLearn: [], learned: [], learning: [] },
      });

    it("persists the client's log-derived streak over the stored counter", () => {
      // The reported bug: the counter drifted to 8 while the app showed 79.
      const result = run(
        withClientContext({ clientDisplayStreak: 79 })
      );

      expect(result.currentUserStats.streakDays).toBe(79);
      // The legacy counter keeps its own (wrong) value — achievements read it,
      // so healing it is a separate decision.
      expect(result.currentUserStats.actualDayWithoutBreak).toBe(1);
    });

    it("falls back to the computed streak when the client sends nothing usable", () => {
      expect(run(withClientContext()).currentUserStats.streakDays).toBe(1);
      expect(
        run(withClientContext({ clientDisplayStreak: -3 })).currentUserStats
          .streakDays
      ).toBe(1);
      expect(
        run(withClientContext({ clientDisplayStreak: 2.5 })).currentUserStats
          .streakDays
      ).toBe(1);
    });

    it("stores the practice day as the client's plain local day string", () => {
      expect(run(withClientContext()).currentUserStats.lastPracticeLocalDay).toBe(
        "1998-12-19"
      );
    });

    it("schedules the reminder at the user's local evening", () => {
      // Warsaw is UTC+1 in December, so 19:00 local is 18:00 UTC.
      const result = run(withClientContext());

      expect(result.currentUserStats.timeZone).toBe("Europe/Warsaw");
      expect(result.currentUserStats.reminderHourUtc).toBe(18);
    });

    it("leaves the stored zone alone when the browser won't report one", () => {
      const stats = {
        ...currentUserStats,
        timeZone: "America/New_York",
        reminderHourUtc: 0,
      };
      const result = reportUpdateUserStats({
        currentUserStats: stats,
        inputData: withClientContext({ clientTimeZone: "Nowhere/Fake" }),
        currentUserSongLists: { wantToLearn: [], learned: [], learning: [] },
      });

      expect(result.currentUserStats.timeZone).toBe("America/New_York");
      expect(result.currentUserStats.reminderHourUtc).toBe(0);
    });

    it("ignores the client streak on a back-dated report", () => {
      // The client's log has no entry for the day being filed, so its walk would
      // undercount — the server's own streak stands.
      const result = run(
        withClientContext({ countBackDays: 3, clientDisplayStreak: 79 })
      );

      expect(result.currentUserStats.streakDays).toBe(0);
    });
  });

  it("should detect new records when user beats previous stats", () => {
    const statsWithHistory: StatisticsDataInterface = {
      ...statisticsInitial,
      maxPoints: 5,
      time: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
        longestSession: 60000, // 1 minute
      },
      dayWithoutBreak: 2,
      actualDayWithoutBreak: 2,
      lastReportDate: new Date(1998, 11, 18).toISOString(), // yesterday
    };

    const inputWithTime: ReportFormikInterface = {
      ...emptyInputData,
      techniqueHours: "1",
      techniqueMinutes: "30",
      habbits: ["exercise_plan", "warmup", "metronome"],
    };

    const result = reportUpdateUserStats({
      currentUserStats: statsWithHistory,
      inputData: inputWithTime,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });

    // Session time is 90min = 5400000ms > longestSession 60000ms
    expect(result.newRecords.longestSession).toBe(true);
    // Points from 1.5h technique + 3 habits should exceed maxPoints of 5
    expect(result.newRecords.maxPoints).toBe(true);
    // Streak should go from 2 to 3, exceeding dayWithoutBreak of 2
    expect(result.newRecords.maxStreak).toBe(true);
  });

  it("should not detect records when user does not beat previous stats", () => {
    const statsWithHighRecords: StatisticsDataInterface = {
      ...statisticsInitial,
      maxPoints: 999,
      time: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
        longestSession: 999999999,
      },
      dayWithoutBreak: 999,
      lastReportDate: new Date(1998, 11, 18).toISOString(),
    };

    const result = reportUpdateUserStats({
      currentUserStats: statsWithHighRecords,
      inputData: emptyInputData,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });

    expect(result.newRecords.maxPoints).toBe(false);
    expect(result.newRecords.longestSession).toBe(false);
    expect(result.newRecords.maxStreak).toBe(false);
    expect(result.newRecords.newLevel).toBe(false);
  });

  it("should return the correct updated statistics when the user adds a backdated report", () => {
    const inputData: ReportFormikInterface = {
      ...emptyInputData,
      countBackDays: 3,
    };
    const result = reportUpdateUserStats({
      currentUserStats,
      inputData,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });

    // Back-dated reports should not create a streak record from a fresh account
    expect(result.currentUserStats.actualDayWithoutBreak).toBe(0);
    expect(result.currentUserStats.dayWithoutBreak).toBe(0);
    expect(result.currentUserStats.lastReportDate).toBe("");
    expect(result.isDateBackReport).toBe(3);
    expect(result.currentUserStats.sessionCount).toBe(1);
  });
});
