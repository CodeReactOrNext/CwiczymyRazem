import type {
  FirebaseLogsDonationInterface,
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { describe, expect, it } from "vitest";

import {
  ACTION_FAME,
  calculateGroupFame,
  calculateTimeFame,
  countActionLogs,
  DONATION_FAME,
  getGroupSessionMs,
  MAX_ACTIVITY_FAME,
  MAX_DAILY_DONATIONS,
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

const donationLog = (
  overrides: Partial<FirebaseLogsDonationInterface> = {},
): FirebaseLogsDonationInterface => ({
  type: "donation_received",
  data: "2026-08-07T10:00:00.000Z",
  timestamp: "2026-08-07T10:00:00.000Z",
  supporterName: "Cookie",
  amount: 5,
  kind: "one_off",
  uid: "user-1",
  userName: "Cookie",
  ...overrides,
});

describe("getGroupSessionMs", () => {
  it("sums the practice time across the group", () => {
    expect(
      getGroupSessionMs([practiceLog(minutes(20)), practiceLog(minutes(25))]),
    ).toBe(minutes(45));
  });

  it("ignores logs that carry no practice time", () => {
    expect(getGroupSessionMs([songLog(), songLog()])).toBe(0);
  });

  it("clamps a single log to the trusted daily ceiling", () => {
    expect(getGroupSessionMs([practiceLog(hours(400))])).toBe(hours(24));
  });

  it("ignores negative and non-finite times", () => {
    expect(
      getGroupSessionMs([practiceLog(-minutes(30)), practiceLog(Number.NaN)]),
    ).toBe(0);
  });
});

describe("countActionLogs", () => {
  it("counts only the logs with no practice time on them", () => {
    expect(
      countActionLogs([songLog(), practiceLog(minutes(30)), songLog()]),
    ).toBe(2);
  });

  it("counts a malformed practice log as an action rather than dropping it", () => {
    expect(countActionLogs([practiceLog(Number.NaN)])).toBe(1);
  });

  it("leaves donations out — they are priced on their own", () => {
    expect(countActionLogs([donationLog(), songLog()])).toBe(1);
  });
});

describe("calculateTimeFame", () => {
  it("pays a Fame a minute", () => {
    expect(calculateTimeFame(minutes(1))).toBe(1);
    expect(calculateTimeFame(minutes(30))).toBe(30);
    expect(calculateTimeFame(hours(1))).toBe(60);
  });
});

describe("calculateGroupFame", () => {
  it("pays the flat amount for a single action", () => {
    expect(calculateGroupFame({ logs: [songLog()] })).toBe(ACTION_FAME);
  });

  it("pays per action, so a run of them stacks", () => {
    expect(
      calculateGroupFame({ logs: Array.from({ length: 5 }, songLog) }),
    ).toBe(5 * ACTION_FAME);
  });

  it("prices practice by the minute", () => {
    expect(calculateGroupFame({ logs: [practiceLog(minutes(30))] })).toBe(30);
    expect(calculateGroupFame({ logs: [practiceLog(hours(2))] })).toBe(120);
  });

  it("pays the same however the same practice time is split across logs", () => {
    expect(
      calculateGroupFame({
        logs: [
          practiceLog(minutes(20)),
          practiceLog(minutes(20)),
          practiceLog(minutes(20)),
        ],
      }),
    ).toBe(calculateGroupFame({ logs: [practiceLog(hours(1))] }));
  });

  it("adds both halves of a mixed row", () => {
    expect(
      calculateGroupFame({ logs: [practiceLog(minutes(30)), songLog()] }),
    ).toBe(30 + ACTION_FAME);
  });

  it("pays a donation far more than a plain action", () => {
    expect(calculateGroupFame({ logs: [donationLog()] })).toBe(DONATION_FAME);
  });

  it("stacks the coffees of one day", () => {
    expect(calculateGroupFame({ logs: [donationLog(), donationLog()] })).toBe(
      2 * DONATION_FAME,
    );
  });

  it("stops paying past the day's fourth coffee", () => {
    const logs = Array.from({ length: 7 }, () => donationLog());
    expect(calculateGroupFame({ logs })).toBe(
      MAX_DAILY_DONATIONS * DONATION_FAME,
    );
  });

  it("caps a single row", () => {
    const logs = Array.from({ length: 12 }, () => practiceLog(hours(1)));
    expect(calculateGroupFame({ logs })).toBe(MAX_ACTIVITY_FAME);
  });
});
