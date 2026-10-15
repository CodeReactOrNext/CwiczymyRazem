// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playUiSound, resetUiSoundsForTests, useSuppressUiSounds } from "./uiSounds";
import { useUiSoundsStore } from "./uiSoundsStore";

const started = vi.fn();

const param = () => ({
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
});

class FakeAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  resume = vi.fn(() => Promise.resolve());
  createGain() {
    return { gain: param(), connect: vi.fn((node) => node) };
  }
  createOscillator() {
    return {
      type: "sine",
      frequency: param(),
      connect: vi.fn((node) => node),
      start: started,
      stop: vi.fn(),
    };
  }
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
  useUiSoundsStore.setState({ enabled: true });
  resetUiSoundsForTests();
  started.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("playUiSound", () => {
  it("plays a cue", () => {
    playUiSound("reward");
    expect(started).toHaveBeenCalled();
  });

  it("stays quiet when the player turned sounds off", () => {
    useUiSoundsStore.setState({ enabled: false });
    playUiSound("levelUp");
    expect(started).not.toHaveBeenCalled();
  });

  /** Views mounted side by side (desktop + phone session) must not double the cue. */
  it("plays the same cue once when it fires twice at once", () => {
    playUiSound("sessionComplete");
    const once = started.mock.calls.length;
    playUiSound("sessionComplete");
    expect(started.mock.calls.length).toBe(once);

    vi.setSystemTime(new Date("2026-10-15T12:00:01Z"));
    playUiSound("sessionComplete");
    expect(started.mock.calls.length).toBe(once * 2);
  });

  it("is silent while something is listening to the guitar", () => {
    const { rerender } = renderHook(({ active }) => useSuppressUiSounds(active), {
      initialProps: { active: true },
    });
    playUiSound("reward");
    expect(started).not.toHaveBeenCalled();

    act(() => rerender({ active: false }));
    playUiSound("reward");
    expect(started).toHaveBeenCalled();
  });
});
