import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useTimer from "./useTimer";

describe("useTimer — count-in delay", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("does not accrue time while the start is delayed", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.startTimer(2000));
    expect(result.current.getTime()).toBe(0);

    // Still inside the delay window — the clock has not started.
    act(() => { vi.advanceTimersByTime(1999); });
    expect(result.current.getTime()).toBe(0);

    act(() => { vi.advanceTimersByTime(1001); });
    expect(result.current.getTime()).toBe(1000);
  });

  it("banks nothing when stopped mid-delay", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.startTimer(2000));
    act(() => { vi.advanceTimersByTime(500); });
    act(() => result.current.stopTimer());

    expect(result.current.getTime()).toBe(0);
  });

  it("starts immediately without a delay", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.startTimer());
    act(() => { vi.advanceTimersByTime(3000); });

    expect(result.current.getTime()).toBe(3000);
  });
});
