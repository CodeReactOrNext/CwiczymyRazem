// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONTROLS_LINGER_MS,
  INSTALL_HINT_SEEN_KEY,
  useLingeringControls,
  useTabFullscreen,
} from "./useTabFullscreen";

const root = document.documentElement as unknown as {
  requestFullscreen?: () => Promise<void>;
};

describe("useTabFullscreen", () => {
  beforeEach(() => {
    localStorage.clear();
    delete root.requestFullscreen;
  });

  afterEach(() => {
    delete root.requestFullscreen;
    vi.restoreAllMocks();
  });

  it("asks the browser for full screen where it can give it", () => {
    const request = vi.fn(() => Promise.resolve());
    root.requestFullscreen = request;
    const { result } = renderHook(() => useTabFullscreen());

    act(() => result.current.enter());

    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current.isFullscreen).toBe(true);
    expect(result.current.showInstallHint).toBe(false);
  });

  it("still goes full screen when the browser refuses", async () => {
    root.requestFullscreen = vi.fn(() => Promise.reject(new Error("denied")));
    const { result } = renderHook(() => useTabFullscreen());

    await act(async () => result.current.enter());

    expect(result.current.isFullscreen).toBe(true);
  });

  it("tips the home screen once where the browser has no full screen", () => {
    const { result } = renderHook(() => useTabFullscreen());

    act(() => result.current.enter());
    expect(result.current.isFullscreen).toBe(true);
    expect(result.current.showInstallHint).toBe(true);
    expect(localStorage.getItem(INSTALL_HINT_SEEN_KEY)).toBe("1");

    act(() => result.current.exit());
    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.showInstallHint).toBe(false);

    act(() => result.current.enter());
    expect(result.current.showInstallHint).toBe(false);
  });

  it("leaves on Escape and when the browser's full screen is let go", () => {
    const { result } = renderHook(() => useTabFullscreen());

    act(() => result.current.enter());
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isFullscreen).toBe(false);

    act(() => result.current.enter());
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(false);
  });
});

describe("useLingeringControls", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stays while paused", () => {
    const { result } = renderHook(() => useLingeringControls(true, false));
    act(() => vi.advanceTimersByTime(CONTROLS_LINGER_MS * 3));
    expect(result.current.visible).toBe(true);
  });

  it("goes a moment after the last touch while playing, and a touch brings it back", () => {
    const { result } = renderHook(() => useLingeringControls(true, true));
    expect(result.current.visible).toBe(true);

    act(() => vi.advanceTimersByTime(CONTROLS_LINGER_MS - 1000));
    act(() => result.current.wake());
    act(() => vi.advanceTimersByTime(CONTROLS_LINGER_MS - 1000));
    expect(result.current.visible).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.visible).toBe(false);

    act(() => result.current.wake());
    expect(result.current.visible).toBe(true);
  });

  it("comes back when the tab stops", () => {
    const { result, rerender } = renderHook(
      ({ playing }) => useLingeringControls(true, playing),
      { initialProps: { playing: true } },
    );
    act(() => vi.advanceTimersByTime(CONTROLS_LINGER_MS));
    expect(result.current.visible).toBe(false);

    rerender({ playing: false });
    expect(result.current.visible).toBe(true);
  });
});
