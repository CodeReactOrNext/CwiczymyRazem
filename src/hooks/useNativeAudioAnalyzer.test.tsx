// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import type { NativeAudioApi, NativeAudioStreamInfo } from "types/nativeAudio";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GUITAR_DSP_ENGINE_HASH } from "./generated/guitarDspEngineHash";
import type { EngineDspEvent, EngineDspMessage } from "./guitarDspEngine";
import { useNativeAudioAnalyzer } from "./useNativeAudioAnalyzer";

// aubio's WASM is irrelevant here — only the detector constructors get called.
vi.mock("aubiojs", () => {
  class Stub {
    setTolerance() {}
    setThreshold() {}
    do() { return 0; }
    getConfidence() { return 0; }
  }
  return { default: async () => ({ Pitch: Stub, Onset: Stub }) };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

const STREAM_INFO: NativeAudioStreamInfo = {
  deviceId: 1,
  deviceName: "Audient iD4",
  channel: 0,
  sampleRate: 48000,
  frameSize: 128,
  streamLatencyFrames: 128,
  latencyMs: 5.3,
};

/** A window.nativeAudio whose start() only resolves when the test says so,
 *  recording the order of bridge calls — the whole bug is about that order. */
function installBridge({ startRejectsWith }: { startRejectsWith?: Error } = {}) {
  const calls: string[] = [];
  const startResolvers: Array<(info: NativeAudioStreamInfo) => void> = [];
  const startRejecters: Array<(err: Error) => void> = [];
  const bridge = {
    isAvailable: true as const,
    listDevices: vi.fn(async () => {
      calls.push("listDevices");
      return {
        api: "ASIO",
        devices: [{ id: 1, name: "Audient iD4", inputChannels: 2, outputChannels: 2, isDefaultInput: true }],
      };
    }),
    start: vi.fn(() => {
      calls.push("start");
      if (startRejectsWith) return Promise.reject(startRejectsWith);
      return new Promise<NativeAudioStreamInfo>((resolve, reject) => {
        startResolvers.push(resolve);
        startRejecters.push(reject);
      });
    }),
    stop: vi.fn(async () => {
      calls.push("stop");
      return true;
    }),
    getStatus: vi.fn(async () => ({ isOpen: false, info: null })),
    onFrame: vi.fn(() => () => {}),
    onConnectionIssue: vi.fn(() => () => {}),
    onDevicesChanged: vi.fn(() => () => {}),
  };
  window.nativeAudio = bridge as unknown as NativeAudioApi;
  return { bridge, calls, startResolvers, startRejecters };
}

/** Let every already-settled promise chain (listDevices → start hand-off etc.) run. */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.mocked(toast.error).mockClear();
});

afterEach(() => {
  cleanup();
  delete window.nativeAudio;
});

describe("useNativeAudioAnalyzer init/close ordering", () => {
  it("queues a new init() behind a superseded one so its start() is never undone by the old stop()", async () => {
    const { calls, startResolvers } = installBridge();
    const { result } = renderHook(() => useNativeAudioAnalyzer());

    // init #1: gets as far as sending start(), which is slow (ASIO open).
    let first!: Promise<void>;
    act(() => { first = result.current.init(); });
    await flush();
    expect(calls).toEqual(["listDevices", "start"]);

    // The mount-time dance: close() and a fresh init() while #1's start() is in flight.
    act(() => { result.current.close(); });
    let second!: Promise<void>;
    act(() => { second = result.current.init(); });
    await flush();

    // #2 must be waiting — it hasn't touched the bridge yet.
    expect(calls).toEqual(["listDevices", "start", "stop"]);

    // #1's start() finally resolves: it's superseded, so it releases its stream
    // — and only THEN does #2 open its own.
    await act(async () => { startResolvers[0](STREAM_INFO); await first; });
    await flush();
    expect(calls).toEqual(["listDevices", "start", "stop", "stop", "listDevices", "start"]);

    await act(async () => { startResolvers[1](STREAM_INFO); await second; });

    // The stream that #2 opened is the one that stays open: no stop() after its start().
    expect(calls[calls.length - 1]).toBe("start");
    expect(result.current.isListening).toBe(true);
    expect(result.current.streamInfo).toEqual(STREAM_INFO);
  });

  it("skips a queued init() entirely when close() arrived before its turn", async () => {
    const { calls, startResolvers } = installBridge();
    const { result } = renderHook(() => useNativeAudioAnalyzer());

    let first!: Promise<void>;
    act(() => { first = result.current.init(); });
    await flush();
    act(() => { result.current.close(); });
    let second!: Promise<void>;
    act(() => { second = result.current.init(); });
    act(() => { result.current.close(); }); // user toggled straight back off

    await act(async () => { startResolvers[0](STREAM_INFO); await first; await second; });
    await flush();

    // #2 never opened anything: exactly one listDevices/start pair total.
    expect(calls.filter((c) => c === "start")).toHaveLength(1);
    expect(result.current.isListening).toBe(false);
  });

  it("surfaces a real start() failure instead of leaving the mic silently 'on'", async () => {
    installBridge({ startRejectsWith: new Error("ASIO device busy") });
    const { result } = renderHook(() => useNativeAudioAnalyzer());

    await act(async () => { await result.current.init(); });

    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBe("ASIO device busy");
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain("ASIO device busy");
  });

  it("stays quiet about a failure that belongs to a superseded init()", async () => {
    const { startRejecters } = installBridge();
    const { result } = renderHook(() => useNativeAudioAnalyzer());

    let first!: Promise<void>;
    act(() => { first = result.current.init(); });
    await flush();
    act(() => { result.current.close(); });

    // The abandoned start() fails late — nobody is listening for that outcome anymore.
    await act(async () => { startRejecters[0](new Error("late failure")); await first; });

    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isListening).toBe(false);
  });
});

describe("useNativeAudioAnalyzer with a shell that runs the detectors", () => {
  /** A newer shell: the readings' channel next to the blocks'. */
  function installEngineBridge() {
    const installed = installBridge();
    let onDsp: ((message: EngineDspEvent, sentAt: number) => void) | null = null;
    const configureDsp = vi.fn(async () => true);
    Object.assign(installed.bridge, {
      onDsp: vi.fn((cb: (message: EngineDspEvent, sentAt: number) => void) => { onDsp = cb; return () => { onDsp = null; }; }),
      configureDsp,
      stopDsp: vi.fn(async () => true),
    });
    return { ...installed, configureDsp, emit: (message: EngineDspEvent, sentAt: number) => onDsp?.(message, sentAt) };
  }

  const readings = (timeMs: number): EngineDspMessage => ({
    type: "readings",
    readings: {
      frequency: 196, volume: 0.4, rawVolume: 0.2, noiseFloor: 0.01, confidence: 0.9,
      lastOnsetTime: timeMs, lastTickTime: 0, lastAttackMs: timeMs - 20, lastLowAttackMs: 0, lastSoftAttackMs: 0,
      inputPeak: 0.3, active: true,
    },
    events: [{ onsetMs: timeMs - 20, pitchHz: 196, peakVolume: 0.2, attack: null }],
    attacks: [],
    spectrum: { magnitudes: new Float32Array([0, 1, 0]), binHz: 5.86 },
    timeMs,
    samples: new Float32Array(2048).fill(0.1),
    messageFrames: 256,
  });

  it("asks for it with the detectors' hash and reads what the shell sends", async () => {
    const { bridge, startResolvers, emit } = installEngineBridge();
    const { result } = renderHook(() => useNativeAudioAnalyzer());

    let init!: Promise<void>;
    act(() => { init = result.current.init(); });
    await flush();
    expect(bridge.start).toHaveBeenCalledWith(expect.objectContaining({
      dsp: expect.objectContaining({ hash: GUITAR_DSP_ENGINE_HASH }),
    }));
    await act(async () => { startResolvers[0]({ ...STREAM_INFO, dsp: true }); await init; });
    expect(result.current.isListening).toBe(true);

    const now = Date.now();
    act(() => { emit(readings(now - 5), now); });

    const refs = result.current.audioRefs;
    expect(refs.frequencyRef.current).toBe(196);
    expect(refs.noteEventsRef?.current).toHaveLength(1);
    // The same attack, wherever it is read from, on the same clock.
    expect(refs.noteEventsRef?.current[0].onsetMs).toBe(refs.lastAttackMsRef?.current);
    expect(refs.lastOnsetTimeRef.current).toBeGreaterThanOrEqual(now - 5);
    // The chord spectrum and the look back come with the readings.
    expect(refs.readSpectrum?.()?.binHz).toBe(5.86);
    expect(refs.readRecentAudio?.()?.samples).toHaveLength(2048);
  });

  it("runs the detectors itself for a shell that says it doesn't", async () => {
    const { configureDsp, startResolvers, emit } = installEngineBridge();
    const { result } = renderHook(() => useNativeAudioAnalyzer());

    let init!: Promise<void>;
    act(() => { init = result.current.init(); });
    await flush();
    // Other detectors than the shell ships: no `dsp` in what start() resolves with.
    await act(async () => { startResolvers[0](STREAM_INFO); await init; });
    expect(result.current.isListening).toBe(true);
    expect(configureDsp).not.toHaveBeenCalled();

    // Nothing the shell might still send is taken for a reading of this stream's.
    act(() => { emit({ type: "lost" }, Date.now()); });
    expect(result.current.isListening).toBe(true);
  });
});
