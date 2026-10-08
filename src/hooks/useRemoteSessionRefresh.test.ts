// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getDoc = vi.fn();
const invalidateActivityLogsCache = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  getDoc: () => getDoc(),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

vi.mock("feature/logs/services/getUserRaprotsLogs.service", () => ({
  invalidateActivityLogsCache: (uid: string) => invalidateActivityLogsCache(uid),
}));

const remoteCount = (sessionCount: number) =>
  getDoc.mockResolvedValue({ data: () => ({ statistics: { sessionCount } }) });

const focus = async () => {
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
  });
};

/**
 * User stats have no live listener: practicing on the phone left a computer
 * tab showing today unticked until a full reload.
 */
describe("useRemoteSessionRefresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("bumps the nonce when another device reported a session", async () => {
    const { useRemoteSessionRefresh } = await import("./useRemoteSessionRefresh");
    remoteCount(11);

    const { result } = renderHook(() => useRemoteSessionRefresh("user1", 10));
    await focus();

    expect(result.current).toBe(1);
    expect(invalidateActivityLogsCache).toHaveBeenCalledWith("user1");
  });

  it("stays put when nothing changed remotely", async () => {
    const { useRemoteSessionRefresh } = await import("./useRemoteSessionRefresh");
    remoteCount(10);

    const { result } = renderHook(() => useRemoteSessionRefresh("user1", 10));
    await focus();

    expect(result.current).toBe(0);
    expect(invalidateActivityLogsCache).not.toHaveBeenCalled();
  });

  it("ignores a session this tab already reported", async () => {
    const { useRemoteSessionRefresh } = await import("./useRemoteSessionRefresh");
    remoteCount(11);

    const { result, rerender } = renderHook(
      ({ count }) => useRemoteSessionRefresh("user1", count),
      { initialProps: { count: 10 } }
    );
    rerender({ count: 11 });
    await focus();

    expect(result.current).toBe(0);
  });

  it("reads the user document at most once per interval", async () => {
    const { useRemoteSessionRefresh } = await import("./useRemoteSessionRefresh");
    remoteCount(10);

    renderHook(() => useRemoteSessionRefresh("user1", 10));
    await focus();
    await focus();
    expect(getDoc).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-10-08T12:00:31Z"));
    await focus();
    expect(getDoc).toHaveBeenCalledTimes(2);
  });

  it("does nothing without a signed-in user", async () => {
    const { useRemoteSessionRefresh } = await import("./useRemoteSessionRefresh");

    renderHook(() => useRemoteSessionRefresh(null, 0));
    await focus();

    expect(getDoc).not.toHaveBeenCalled();
  });
});
