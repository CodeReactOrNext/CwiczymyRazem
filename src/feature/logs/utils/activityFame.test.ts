import type { FirebaseLogsInterface, FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";
import { describe, expect, it } from "vitest";

import {
  calculateActivityFame,
  calculateGroupFame,
  EXERCISE_PLAN_FAME,
  getGroupSessionMs,
  getTimeFameMultiplier,
  MAX_ACTIVITY_FAME,
  MAX_GROUPED_ACTIVITY_FAME,
} from "./activityFame";

const minutes = (value: number) => value * 60 * 1000;
const hours = (value: number) => minutes(value * 60);

const practiceLog = (sumTimeMs: number): FirebaseLogsInterface =>
  ({
    uid: "user-1",
    userName: "Cookie",
    data: "2026-08-07T10:00:00.000Z",
    timestamp: "2026-08-07T10:00:00.000Z",
    points: 100,
    newAchievements: [],
    newLevel: { isNewLevel: false, level: 3 },
    avatarUrl: null,
    timeSumary: {
      techniqueTime: sumTimeMs,
      theoryTime: 0,
      hearingTime: 0,
      creativityTime: 0,
      sumTime: sumTimeMs,
    },
  }) as unknown as FirebaseLogsInterface;

const songLog = (): FirebaseLogsSongsInterface =>
  ({
    uid: "user-1",
    userName: "Cookie",
    data: "2026-08-07T10:00:00.000Z",
    timestamp: "2026-08-07T10:00:00.000Z",
    songTitle: "Sultans of Swing",
    songArtist: "Dire Straits",
    status: "learned",
    avatarUrl: undefined,
  }) as FirebaseLogsSongsInterface;

describe("calculateActivityFame", () => {
  it("pays 5 per grouped activity", () => {
    expect(calculateActivityFame(1)).toBe(5);
    expect(calculateActivityFame(4)).toBe(20);
  });

  it("treats an empty group as a single activity", () => {
    expect(calculateActivityFame(0)).toBe(5);
  });

  it("caps the count-based base", () => {
    expect(calculateActivityFame(10)).toBe(MAX_GROUPED_ACTIVITY_FAME);
    expect(calculateActivityFame(40)).toBe(MAX_GROUPED_ACTIVITY_FAME);
  });
});

describe("getGroupSessionMs", () => {
  it("sums practice time across the group", () => {
    expect(getGroupSessionMs([practiceLog(minutes(20)), practiceLog(minutes(25))])).toBe(
      minutes(45)
    );
  });

  it("ignores logs that carry no practice time", () => {
    expect(getGroupSessionMs([songLog(), songLog()])).toBe(0);
  });

  it("clamps a single log to the 24h report ceiling", () => {
    expect(getGroupSessionMs([practiceLog(hours(400))])).toBe(hours(24));
  });

  it("ignores negative and non-finite times", () => {
    expect(getGroupSessionMs([practiceLog(-minutes(30)), practiceLog(Number.NaN)])).toBe(0);
  });
});

describe("getTimeFameMultiplier", () => {
  it("pays 1x below the lowest tier", () => {
    expect(getTimeFameMultiplier(0)).toBe(1);
    expect(getTimeFameMultiplier(minutes(14))).toBe(1);
  });

  it("steps up with logged time", () => {
    expect(getTimeFameMultiplier(minutes(15))).toBe(1.25);
    expect(getTimeFameMultiplier(minutes(30))).toBe(1.5);
    expect(getTimeFameMultiplier(hours(1))).toBe(1.75);
    expect(getTimeFameMultiplier(hours(2))).toBe(2);
    expect(getTimeFameMultiplier(hours(12))).toBe(2);
  });
});

describe("calculateGroupFame", () => {
  it("leaves a couple of minutes of noodling on the count-based amount", () => {
    expect(calculateGroupFame({ type: "exercise", logs: [practiceLog(minutes(10))] })).toBe(5);
  });

  it("already pays extra for a quarter of an hour", () => {
    expect(calculateGroupFame({ type: "exercise", logs: [practiceLog(minutes(15))] })).toBe(6);
    expect(calculateGroupFame({ type: "exercise", logs: [practiceLog(minutes(30))] })).toBe(8);
  });

  it("scales a practice group by its logged time", () => {
    expect(calculateGroupFame({ type: "exercise", logs: [practiceLog(hours(1))] })).toBe(9);
    expect(
      calculateGroupFame({ type: "exercise", logs: [practiceLog(hours(2)), practiceLog(hours(2))] })
    ).toBe(20);
  });

  it("scales the fixed exercise-plan reward too", () => {
    expect(calculateGroupFame({ type: "exercisePlan", logs: [practiceLog(minutes(5))] })).toBe(
      EXERCISE_PLAN_FAME
    );
    expect(calculateGroupFame({ type: "exercisePlan", logs: [practiceLog(hours(3))] })).toBe(30);
  });

  it("pays timeless activity exactly as before", () => {
    expect(calculateGroupFame({ type: "song", logs: [songLog(), songLog(), songLog()] })).toBe(15);
  });

  it("caps the multiplied reward", () => {
    const logs = Array.from({ length: 12 }, () => practiceLog(hours(1)));
    expect(calculateGroupFame({ type: "exercise", logs })).toBe(MAX_ACTIVITY_FAME);
  });
});
