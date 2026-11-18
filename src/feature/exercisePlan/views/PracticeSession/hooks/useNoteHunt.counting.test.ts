// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNoteHunt } from "./useNoteHunt";

// A4 = 440 Hz: the note "A", octave 4.
const A4 = 440;

const renderHunt = (counting: boolean) => {
  const frequencyRef = { current: A4 };
  const volumeRef = { current: 0.5 };
  return renderHook(
    ({ isCounting }) =>
      useNoteHunt("A", frequencyRef, volumeRef, true, undefined, undefined, 0, false, undefined, 0, isCounting),
    { initialProps: { isCounting: counting } },
  );
};

/** Lets the hunt's sampling loop hear a few frames of the held note. */
const listen = () => act(() => void vi.advanceTimersByTime(400));

beforeEach(() => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "Date", "setTimeout"] }));
afterEach(() => vi.useRealTimers());

describe("useNoteHunt — before Start", () => {
  it("shows what the mic hears but finds nothing", () => {
    const { result } = renderHunt(false);
    listen();

    expect(result.current.state.detectedNote).toBe("A");
    expect(result.current.state.isMatch).toBe(false);
    expect(result.current.state.foundOctaves).toEqual([]);
    expect(result.current.state.gameState.score).toBe(0);
  });

  it("ignores a hand-marked octave too", () => {
    const { result } = renderHunt(false);
    act(() => result.current.markOctave(4));

    expect(result.current.state.foundOctaves).toEqual([]);
  });

  it("starts counting the moment the session is running", () => {
    const { result, rerender } = renderHunt(false);
    listen();
    rerender({ isCounting: true });
    listen();

    expect(result.current.state.foundOctaves).toEqual([4]);
    expect(result.current.state.isMatch).toBe(true);
  });
});
