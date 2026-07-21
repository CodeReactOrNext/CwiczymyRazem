import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useIntervalAlert } from "./useIntervalAlert";

describe("useIntervalAlert", () => {
  it("does nothing while disabled", () => {
    const onAlert = vi.fn();
    const { result, rerender } = renderHook(
      ({ elapsedMs }) =>
        useIntervalAlert({
          enabled: false,
          elapsedMs,
          isRunning: true,
          intervalMs: 5000,
          onAlert,
        }),
      { initialProps: { elapsedMs: 0 } }
    );

    rerender({ elapsedMs: 20000 });

    expect(onAlert).not.toHaveBeenCalled();
    expect(result.current.remainingMs).toBeNull();
  });

  it("fires once per interval of elapsed time since it was enabled", () => {
    const onAlert = vi.fn();
    const { rerender } = renderHook(
      ({ enabled, elapsedMs }) =>
        useIntervalAlert({
          enabled,
          elapsedMs,
          isRunning: true,
          intervalMs: 5000,
          onAlert,
        }),
      { initialProps: { enabled: true, elapsedMs: 10000 } }
    );

    rerender({ enabled: true, elapsedMs: 14000 });
    expect(onAlert).not.toHaveBeenCalled();

    rerender({ enabled: true, elapsedMs: 15000 });
    expect(onAlert).toHaveBeenCalledTimes(1);

    rerender({ enabled: true, elapsedMs: 15000 });
    expect(onAlert).toHaveBeenCalledTimes(1);

    rerender({ enabled: true, elapsedMs: 20500 });
    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it("does not fire while paused", () => {
    const onAlert = vi.fn();
    const { rerender } = renderHook(
      ({ isRunning, elapsedMs }) =>
        useIntervalAlert({
          enabled: true,
          elapsedMs,
          isRunning,
          intervalMs: 5000,
          onAlert,
        }),
      { initialProps: { isRunning: false, elapsedMs: 0 } }
    );

    rerender({ isRunning: false, elapsedMs: 5000 });
    expect(onAlert).not.toHaveBeenCalled();

    rerender({ isRunning: true, elapsedMs: 5000 });
    expect(onAlert).toHaveBeenCalledTimes(1);
  });

  it("restarts the schedule from the current elapsed time when re-enabled", () => {
    const onAlert = vi.fn();
    const { rerender } = renderHook(
      ({ enabled, elapsedMs }) =>
        useIntervalAlert({
          enabled,
          elapsedMs,
          isRunning: true,
          intervalMs: 5000,
          onAlert,
        }),
      { initialProps: { enabled: false, elapsedMs: 3000 } }
    );

    rerender({ enabled: true, elapsedMs: 3000 });
    rerender({ enabled: true, elapsedMs: 7000 });
    expect(onAlert).not.toHaveBeenCalled();

    rerender({ enabled: true, elapsedMs: 8000 });
    expect(onAlert).toHaveBeenCalledTimes(1);
  });
});
