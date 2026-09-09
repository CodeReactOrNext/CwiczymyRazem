// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ensureQuestForToday = vi.fn(() => ({ type: "user/ensureQuestForToday" }));
const syncDailyQuestAction = vi.fn(() => ({ type: "user/syncDailyQuest" }));
const dispatch = vi.fn();

let stats: { timeZone?: string } | null = { timeZone: "Europe/Warsaw" };

vi.mock("feature/user/store/userSlice.questActions", () => ({
  ensureQuestForToday: () => ensureQuestForToday(),
  syncDailyQuestAction: () => syncDailyQuestAction(),
}));

vi.mock("feature/user/store/userSlice", () => ({
  selectUserAuth: () => "user1",
  selectCurrentUserStats: () => stats,
}));

vi.mock("store/hooks", () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const HOUR = 60 * 60 * 1000;

/**
 * The quest day flips at the player's midnight, but nothing used to re-read the
 * key on a clock: a window left open *and focused* across that boundary fired
 * no visibilitychange, no focus, no report, so it kept showing yesterday's set.
 */
describe("useDailyQuestSync midnight rollover", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    stats = { timeZone: "Europe/Warsaw" };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rolls the quest over at the player's midnight with no interaction", async () => {
    // 23:30 in Warsaw.
    vi.setSystemTime(new Date("2026-09-08T21:30:00Z"));
    const { default: useDailyQuestSync } = await import("./useDailyQuestSync");

    renderHook(() => useDailyQuestSync());
    expect(ensureQuestForToday).not.toHaveBeenCalled();

    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(ensureQuestForToday).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(ensureQuestForToday).toHaveBeenCalledTimes(1);
  });

  it("re-arms for the following midnight instead of firing once", async () => {
    vi.setSystemTime(new Date("2026-09-08T21:30:00Z"));
    const { default: useDailyQuestSync } = await import("./useDailyQuestSync");

    renderHook(() => useDailyQuestSync());

    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(ensureQuestForToday).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(24 * HOUR);
    expect(ensureQuestForToday).toHaveBeenCalledTimes(2);
  });

  it("waits for the stored zone's midnight, not the device's", async () => {
    // 21:30 UTC is 14:30 in Los Angeles: 9.5 hours of that player's day left,
    // where the device (UTC in tests) has only 2.5.
    stats = { timeZone: "America/Los_Angeles" };
    vi.setSystemTime(new Date("2026-09-08T21:30:00Z"));
    const { default: useDailyQuestSync } = await import("./useDailyQuestSync");

    renderHook(() => useDailyQuestSync());

    vi.advanceTimersByTime(3 * HOUR);
    expect(ensureQuestForToday).not.toHaveBeenCalled();

    vi.advanceTimersByTime(7 * HOUR);
    expect(ensureQuestForToday).toHaveBeenCalledTimes(1);
  });

  it("drops the timer when the hook unmounts", async () => {
    vi.setSystemTime(new Date("2026-09-08T21:30:00Z"));
    const { default: useDailyQuestSync } = await import("./useDailyQuestSync");

    const { unmount } = renderHook(() => useDailyQuestSync());
    unmount();

    vi.advanceTimersByTime(2 * HOUR);
    expect(ensureQuestForToday).not.toHaveBeenCalled();
  });
});
