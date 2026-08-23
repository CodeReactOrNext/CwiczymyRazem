import { statisticsInitial } from "constants/userStatisticsInitialData";
import { describe, expect, it } from "vitest";

import reducer from "./userSlice";

const MIN = 60 * 1000;

const buildState = (timer: {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
}) => ({
  userInfo: null,
  userAuth: null,
  currentUserStats: { ...statisticsInitial },
  previousUserStats: null,
  raitingData: null,
  isFetching: null,
  isLoggedOut: null,
  timer,
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    photoURL: null,
  },
  currentActivity: null,
});

/** A finished report, as the thunk resolves it — only the fields the reducer reads. */
const reportFulfilled = (inputData: Record<string, string>) => ({
  type: "user/updateUserStats/fulfilled",
  payload: { raitingData: null },
  meta: { arg: { inputData }, requestId: "test", requestStatus: "fulfilled" },
});

describe("updateUserStats.fulfilled — timer bookkeeping", () => {
  it("clears the time the report logged", () => {
    const state = buildState({ technique: 3 * MIN, theory: 0, hearing: 0, creativity: 0 });

    const next = reducer(
      state as never,
      reportFulfilled({
        techniqueHours: "0",
        techniqueMinutes: "3",
        theoryHours: "0",
        theoryMinutes: "0",
        hearingHours: "0",
        hearingMinutes: "0",
        creativityHours: "0",
        creativityMinutes: "0",
      }) as never
    );

    expect(next.timer).toEqual({ technique: 0, theory: 0, hearing: 0, creativity: 0 });
  });

  it("leaves unreported time from another category alone", () => {
    // An abandoned scale drill (theory) left 3 min behind; the session that
    // follows practises technique only and must not swallow them.
    const state = buildState({ technique: 3 * MIN, theory: 3 * MIN, hearing: 0, creativity: 0 });

    const next = reducer(
      state as never,
      reportFulfilled({
        techniqueHours: "0",
        techniqueMinutes: "3",
        theoryHours: "0",
        theoryMinutes: "0",
        hearingHours: "0",
        hearingMinutes: "0",
        creativityHours: "0",
        creativityMinutes: "0",
      }) as never
    );

    expect(next.timer.technique).toBe(0);
    expect(next.timer.theory).toBe(3 * MIN);
  });
});
