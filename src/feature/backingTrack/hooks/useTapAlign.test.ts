// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTapAlign } from "./useTapAlign";

const START = 1_000_000;

/** 120 BPM → 500 ms per beat, so beat 4 sits 2000 ms after the start. */
const baseOptions = {
  enabled: true,
  startTime: START,
  effectiveBpm: 120,
  sourceBpm: 120,
  offsetMs: 0,
  onOffsetChange: () => {},
};

afterEach(() => {
  vi.useRealTimers();
});

function atWallClock(ms: number) {
  vi.useFakeTimers();
  vi.setSystemTime(ms);
}

describe("useTapAlign", () => {
  it("pushes the offset out when the recording's beat lands late", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 2_060);
    const { result } = renderHook(() => useTapAlign({ ...baseOptions, onOffsetChange }));

    act(() => result.current.tap());

    expect(onOffsetChange).toHaveBeenCalledWith(60);
  });

  it("pulls it back when the beat lands early", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 1_940);
    const { result } = renderHook(() =>
      useTapAlign({ ...baseOptions, offsetMs: 500, onOffsetChange }),
    );

    act(() => result.current.tap());

    expect(onOffsetChange).toHaveBeenCalledWith(440);
  });

  it("converts the tap into the recording's own timeline", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 2_080);
    const { result } = renderHook(() =>
      useTapAlign({ ...baseOptions, effectiveBpm: 240, sourceBpm: 120, onOffsetChange }),
    );

    // 240 BPM → 250 ms per beat, so this tap is 80 ms after beat 8, and the
    // recording is being read at 2×, making that 160 ms of recording.
    act(() => result.current.tap());

    expect(onOffsetChange).toHaveBeenCalledWith(160);
  });

  it("ignores a tap before the session is running", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START);
    const { result } = renderHook(() =>
      useTapAlign({ ...baseOptions, startTime: null, onOffsetChange }),
    );

    act(() => result.current.tap());

    expect(onOffsetChange).not.toHaveBeenCalled();
  });

  it("throws away a run when a tap misses by more than half a beat", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 2_060);
    const { result } = renderHook(() => useTapAlign({ ...baseOptions, onOffsetChange }));

    act(() => result.current.tap());
    expect(result.current.tapCount).toBe(1);

    // 260 ms past the beat at 120 BPM — that was a different beat entirely.
    act(() => {
      vi.setSystemTime(START + 4_260);
      result.current.tap();
    });

    expect(result.current.tapCount).toBe(0);
    expect(onOffsetChange).toHaveBeenCalledTimes(1);
  });

  it("counts a run of good taps", () => {
    atWallClock(START + 2_030);
    const { result } = renderHook(() => useTapAlign(baseOptions));

    act(() => result.current.tap());
    act(() => {
      vi.setSystemTime(START + 2_530);
      result.current.tap();
    });

    expect(result.current.tapCount).toBe(2);
    expect(result.current.errorMs).toBe(30);
  });

  it("taps from the keyboard", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 2_040);
    renderHook(() => useTapAlign({ ...baseOptions, onOffsetChange }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
    });

    expect(onOffsetChange).toHaveBeenCalledWith(40);
  });

  it("leaves T alone while the player is typing", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 2_040);
    renderHook(() => useTapAlign({ ...baseOptions, onOffsetChange }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "t", bubbles: true }));
    });
    input.remove();

    expect(onOffsetChange).not.toHaveBeenCalled();
  });

  it("does not listen at all when alignment is closed", () => {
    const onOffsetChange = vi.fn();
    atWallClock(START + 2_040);
    renderHook(() => useTapAlign({ ...baseOptions, enabled: false, onOffsetChange }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
    });

    expect(onOffsetChange).not.toHaveBeenCalled();
  });

  it("forgets an abandoned run after a long pause", () => {
    atWallClock(START + 2_030);
    const { result } = renderHook(() => useTapAlign(baseOptions));

    act(() => result.current.tap());
    act(() => {
      vi.setSystemTime(START + 20_030);
      result.current.tap();
    });

    expect(result.current.tapCount).toBe(1);
  });
});

describe("useTapAlign feedback", () => {
  it("says so when a tap was too ambiguous to act on", () => {
    atWallClock(START + 2_240);
    const { result } = renderHook(() => useTapAlign(baseOptions));

    act(() => result.current.tap());

    expect(result.current.wasAmbiguous).toBe(true);
    expect(result.current.tapCount).toBe(0);
  });

  it("clears the warning once a clean tap lands", () => {
    atWallClock(START + 2_240);
    const { result } = renderHook(() => useTapAlign(baseOptions));

    act(() => result.current.tap());
    act(() => {
      vi.setSystemTime(START + 2_530);
      result.current.tap();
    });

    expect(result.current.wasAmbiguous).toBe(false);
    expect(result.current.tapCount).toBe(1);
  });
});
