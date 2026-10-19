// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useBossFightSession } from "./useBossFightSession";

const setup = (overrides: Partial<Parameters<typeof useBossFightSession>[0]> = {}) => {
  const options = {
    isActive: true,
    tabOverlay: null,
    isOver: false,
    isHolding: false,
    onNewRun: vi.fn(),
    stopTimer: vi.fn(),
    stopMetronome: vi.fn(),
    handleRestart: vi.fn(),
    hasLoggedPractice: true,
    reportPracticeTime: vi.fn(),
    onClose: vi.fn(),
    isFinishing: false,
    ...overrides,
  };
  const hook = renderHook((props) => useBossFightSession(props), { initialProps: options });
  return { options, ...hook };
};

describe("useBossFightSession", () => {
  afterEach(() => vi.useRealTimers());

  it("hides the session's score HUD and hands the tab overlay through", () => {
    const { result } = setup({ tabOverlay: "web" });
    expect(result.current.tabOverlay).toEqual({ overlay: "web", gameMode: true });
    expect(setup({ isActive: false }).result.current.tabOverlay.gameMode).toBe(false);
  });

  it("freezes the run once the fight is decided", () => {
    const { options, rerender } = setup();
    expect(options.stopTimer).not.toHaveBeenCalled();
    rerender({ ...options, isOver: true });
    expect(options.stopTimer).toHaveBeenCalledOnce();
    expect(options.stopMetronome).toHaveBeenCalledOnce();
  });

  it("holds the run while the boss changes phase", () => {
    const { options, rerender } = setup();
    rerender({ ...options, isHolding: true });
    expect(options.stopTimer).toHaveBeenCalledOnce();
  });

  it("resumes a new phase by restarting the run alone", () => {
    const { options, result } = setup();
    act(() => result.current.controls.resume());
    expect(options.handleRestart).toHaveBeenCalledOnce();
    expect(options.onNewRun).not.toHaveBeenCalled();
  });

  it("deals a new fight first and restarts once the session has caught up with it", () => {
    vi.useFakeTimers();
    const { options, result, rerender } = setup();
    act(() => result.current.controls.restart());
    expect(options.onNewRun).toHaveBeenCalledOnce();
    expect(options.handleRestart).not.toHaveBeenCalled();
    // The session re-renders at the new fight's tempo with a fresh restart.
    const freshRestart = vi.fn();
    rerender({ ...options, handleRestart: freshRestart });
    act(() => vi.runAllTimers());
    expect(freshRestart).toHaveBeenCalledOnce();
    expect(options.handleRestart).not.toHaveBeenCalled();
  });

  it("reports the practice time on finish, or just leaves before there is any", () => {
    const logged = setup();
    act(() => logged.result.current.controls.finish());
    expect(logged.options.reportPracticeTime).toHaveBeenCalledOnce();
    expect(logged.options.onClose).not.toHaveBeenCalled();

    const early = setup({ hasLoggedPractice: false });
    act(() => early.result.current.controls.finish());
    expect(early.options.reportPracticeTime).not.toHaveBeenCalled();
    expect(early.options.onClose).toHaveBeenCalledOnce();
  });
});
