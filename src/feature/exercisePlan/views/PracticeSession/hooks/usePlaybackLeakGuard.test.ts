// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import type { InputTap } from "hooks/guitarBufferProcessor";
import type { MutableRefObject } from "react";
import {
  PILOT_HOLD_MS,
  PILOT_HZ,
  probeCaptureLength,
} from "utils/audio/playbackLeak";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlaybackLeakGuard } from "./usePlaybackLeakGuard";

const RATE = 48000;
const WINDOW = 2048;

class FakeParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
}

const fakeNode = () => ({
  connect: vi.fn((next: unknown) => next),
  disconnect: vi.fn(),
});

/** Just enough AudioContext to play a probe and a pilot into — and to see what was played. */
const fakeContext = () => {
  const probes: Float32Array[] = [];
  const oscillators: {
    frequency: { value: number };
    stop: ReturnType<typeof vi.fn>;
  }[] = [];
  const ctx = {
    state: "running",
    sampleRate: RATE,
    currentTime: 0,
    destination: {},
    createBuffer: (_channels: number, length: number) => {
      const data = new Float32Array(length);
      probes.push(data);
      return { getChannelData: () => data };
    },
    createBufferSource: () => ({
      ...fakeNode(),
      buffer: null,
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }),
    createGain: () => ({ ...fakeNode(), gain: new FakeParam() }),
    createOscillator: () => {
      const oscillator = {
        ...fakeNode(),
        frequency: { value: 0 },
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      oscillators.push(oscillator);
      return oscillator;
    },
  };
  return { ctx: ctx as unknown as AudioContext, probes, oscillators };
};

const hiss = (length: number, amplitude: number) => {
  let state = 3;
  return Float32Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return amplitude * ((state / 0xffffffff) * 2 - 1);
  });
};

/** What the mic hears while the probe comes back 200 ms later — out of a
 *  speaker by default, or as the faint trace headphones leave in a laptop mic. */
const speakerReturn = (probe: Float32Array, gain = 0.1, roomNoise = 0.01) => {
  const heard = hiss(probeCaptureLength(RATE), roomNoise);
  const delay = Math.round(0.2 * RATE);
  for (let n = 0; n < probe.length; n++) heard[delay + n] += gain * probe[n];
  return heard;
};

/** Hands `samples` to the tap window by window, the last one padded out — the mic never stops. */
const feed = (
  tapRef: MutableRefObject<InputTap | null>,
  samples: Float32Array,
) => {
  for (let i = 0; i < samples.length; i += WINDOW) {
    const window = new Float32Array(WINDOW);
    window.set(samples.subarray(i, i + WINDOW));
    tapRef.current?.(window, RATE);
  }
};

const pilotWindow = (amplitude: number) => {
  const window = hiss(WINDOW, 0.01);
  for (let n = 0; n < WINDOW; n++)
    window[n] += amplitude * Math.sin((2 * Math.PI * PILOT_HZ * n) / RATE);
  return window;
};

const setup = (options: { previousTap?: InputTap | null } = {}) => {
  const { ctx, probes, oscillators } = fakeContext();
  const inputTapRef: MutableRefObject<InputTap | null> = {
    current: options.previousTap ?? null,
  };
  const onLeak = vi.fn();
  const hook = renderHook(() =>
    usePlaybackLeakGuard({
      enabled: true,
      isTabAudible: true,
      tabLevel: 1,
      audioContext: ctx,
      inputTapRef,
      onLeak,
    }),
  );
  return { ...hook, ctx, probes, oscillators, inputTapRef, onLeak };
};

let now = 0;
beforeEach(() => {
  now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("usePlaybackLeakGuard — the probe", () => {
  it("plays a probe and a pilot the moment the tab sound is on", () => {
    const { probes, oscillators } = setup();
    expect(probes).toHaveLength(1);
    expect(oscillators.map((o) => o.frequency.value)).toEqual([PILOT_HZ]);
  });

  it("reports the speakers when the probe comes back through the mic", async () => {
    const { probes, inputTapRef, onLeak, result } = setup();
    feed(inputTapRef, speakerReturn(probes[0]));
    await vi.waitFor(() => expect(onLeak).toHaveBeenCalledWith("probe"));
    expect(result.current.current).toBe(true);
  });

  it("stays quiet in headphones, where the mic hears only the room", async () => {
    const { inputTapRef, onLeak, result } = setup();
    feed(inputTapRef, hiss(probeCaptureLength(RATE), 0.01));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onLeak).not.toHaveBeenCalled();
    expect(result.current.current).toBe(false);
  });

  it("stays quiet when the probe only bleeds out of the headphones, too faint to score", async () => {
    const { probes, inputTapRef, onLeak, result } = setup();
    // Clear as a bell in a silent room, and 40 dB under anything that counts.
    feed(inputTapRef, speakerReturn(probes[0], 0.0002, 0.00002));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onLeak).not.toHaveBeenCalled();
    expect(result.current.current).toBe(false);
  });

  it("does nothing while the tab sound is off", () => {
    const { ctx } = fakeContext();
    const inputTapRef: MutableRefObject<InputTap | null> = { current: null };
    renderHook(() =>
      usePlaybackLeakGuard({
        enabled: true,
        isTabAudible: false,
        tabLevel: 1,
        audioContext: ctx,
        inputTapRef,
        onLeak: vi.fn(),
      }),
    );
    expect(inputTapRef.current).toBeNull();
  });
});

describe("usePlaybackLeakGuard — the pilot", () => {
  /** Enough pilot windows to stand for PILOT_HOLD_MS, after a quiet room before it starts. */
  const pilotStands = (
    inputTapRef: MutableRefObject<InputTap | null>,
    windows = Math.ceil((PILOT_HOLD_MS / 1000) * (RATE / WINDOW)) + 1,
  ) => {
    for (let i = 0; i < 5; i++) inputTapRef.current?.(hiss(WINDOW, 0.01), RATE);
    now = 500;
    for (let i = 0; i < windows; i++)
      inputTapRef.current?.(pilotWindow(0.003), RATE);
  };

  it("doesn't report on the pilot alone — it sends the probe to check", async () => {
    const { probes, inputTapRef, onLeak } = setup();
    pilotStands(inputTapRef);
    expect(probes).toHaveLength(2);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onLeak).not.toHaveBeenCalled();
  });

  it("reports the speakers once the probe the pilot sent comes back", async () => {
    const { probes, inputTapRef, onLeak } = setup();
    pilotStands(inputTapRef);
    feed(inputTapRef, speakerReturn(probes[1]));
    await vi.waitFor(() => expect(onLeak).toHaveBeenCalledWith("pilot"));
  });

  it("sends the probe once while the pilot stands, not on every window", () => {
    const { probes, inputTapRef } = setup();
    pilotStands(inputTapRef, 100);
    expect(probes).toHaveLength(2);
  });

  it("ignores a tone the room already had at the pilot's pitch", () => {
    const { probes, inputTapRef, onLeak } = setup();
    for (let i = 0; i < 5; i++) inputTapRef.current?.(pilotWindow(0.003), RATE);
    now = 500;
    for (let i = 0; i < 40; i++)
      inputTapRef.current?.(pilotWindow(0.003), RATE);
    expect(probes).toHaveLength(1);
    expect(onLeak).not.toHaveBeenCalled();
  });
});

describe("usePlaybackLeakGuard — devices and cleanup", () => {
  it("asks again after a device change, and reports again if the speakers are still there", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const devices = new EventTarget();
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: devices });
    const { probes, inputTapRef, onLeak, result } = setup();

    feed(inputTapRef, speakerReturn(probes[0]));
    vi.runOnlyPendingTimers();
    expect(onLeak).toHaveBeenCalledTimes(1);

    devices.dispatchEvent(new Event("devicechange"));
    vi.advanceTimersByTime(600);
    expect(probes).toHaveLength(2);
    expect(result.current.current).toBe(false);

    feed(inputTapRef, speakerReturn(probes[1]));
    vi.runOnlyPendingTimers();
    expect(onLeak).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("hands the input back and silences the pilot when the tab sound stops", () => {
    const previousTap = vi.fn();
    const { inputTapRef, oscillators, unmount, result } = setup({
      previousTap,
    });
    expect(inputTapRef.current).not.toBe(previousTap);
    unmount();
    expect(inputTapRef.current).toBe(previousTap);
    expect(oscillators[0].stop).toHaveBeenCalled();
    expect(result.current.current).toBe(false);
  });
});
