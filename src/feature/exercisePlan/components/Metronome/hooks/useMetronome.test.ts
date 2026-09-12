// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMetronome } from "./useMetronome";

/**
 * These cover one failure mode with several ways in: the metronome starts, the
 * count-in paints its first number and then never moves again ("it hangs on 4",
 * reported on the desktop build). Everything the count-in does is driven by the
 * scheduler, so anything that leaves the scheduler undriven — a worklet module
 * that hasn't loaded yet, a context swapped mid-count-in, an output device that
 * renders nothing — freezes the session for good.
 */

// Deferred `addModule` promises, one per context — resolve to simulate the
// worklet landing, leave pending to simulate a Play that beat it to it.
let moduleLoads: Array<() => void> = [];
let createdContexts: FakeAudioContext[] = [];
let workletNodes: FakeAudioWorkletNode[] = [];
// When set, the context reports a clock that never moves (a device that cannot
// be opened) — see the dead-clock watchdog.
let frozenClock = false;

class FakeAudioParam {
  value = 0;
  setValueAtTime() { /* no-op */ }
  linearRampToValueAtTime() { /* no-op */ }
  exponentialRampToValueAtTime() { /* no-op */ }
}

class FakeAudioContext {
  state: AudioContextState = "running";
  destination = {} as AudioDestinationNode;
  sinkId = "";
  setSinkId = vi.fn(async (id: string) => { this.sinkId = id; });
  resume = vi.fn(async () => { this.state = "running"; });
  close = vi.fn(async () => { this.state = "closed"; });
  audioWorklet = { addModule: () => new Promise<void>((resolve) => { moduleLoads.push(resolve); }) };
  private readonly bornAt = Date.now();

  constructor() { createdContexts.push(this); }

  // Fake timers move Date.now(), so advancing them advances the audio clock too.
  get currentTime() { return frozenClock ? 0 : (Date.now() - this.bornAt) / 1000; }

  createOscillator() {
    return { type: "", frequency: { value: 0 }, connect() {}, start() {}, stop() {} };
  }

  createGain() {
    return { gain: new FakeAudioParam(), connect() {} };
  }
}

class FakeAudioWorkletNode {
  port = { postMessage: vi.fn(), onmessage: null as unknown };
  connect = vi.fn();
  disconnect = vi.fn();
  constructor() { workletNodes.push(this); }
}

const asContext = (ctx: FakeAudioContext) => ctx as unknown as AudioContext;

beforeEach(() => {
  vi.useFakeTimers();
  moduleLoads = [];
  createdContexts = [];
  workletNodes = [];
  frozenClock = false;
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
  (globalThis as unknown as { AudioWorkletNode: unknown }).AudioWorkletNode = FakeAudioWorkletNode;
  URL.createObjectURL = vi.fn(() => "blob:metronome");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useMetronome count-in", () => {
  it("keeps counting when Play beats the AudioWorklet module to it", () => {
    const { result } = renderHook(() => useMetronome({ initialBpm: 60 }));

    // The module load is still pending — nothing has registered the processor.
    act(() => { result.current.startMetronome(); });
    expect(result.current.countInRemaining).toBe(4);
    expect(workletNodes).toHaveLength(0);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.countInRemaining).toBe(3);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.countInRemaining).toBe(2);

    // …and the count-in still ends in playback rather than sitting there.
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.countInRemaining).toBe(0);
    expect(result.current.startTime).not.toBeNull();
  });

  it("hands a running count-in over to the worklet once its module lands", async () => {
    const { result } = renderHook(() => useMetronome({ initialBpm: 60 }));

    act(() => { result.current.startMetronome(); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.countInRemaining).toBe(3);

    await act(async () => { moduleLoads[0](); });

    expect(workletNodes).toHaveLength(1);
    expect(workletNodes[0].port.postMessage).toHaveBeenCalledWith({ type: "start" });
    // The fallback ticker must be gone, or both clocks would drive the
    // scheduler: this fake worklet never ticks, so nothing may advance now.
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.countInRemaining).toBe(3);
  });

  it("carries the count-in onto a context adopted mid-count-in", () => {
    const external = new FakeAudioContext();
    const { result, rerender } = renderHook(
      ({ ctx }: { ctx: AudioContext | null }) => useMetronome({ initialBpm: 60, externalAudioContext: ctx }),
      { initialProps: { ctx: null as AudioContext | null } },
    );

    act(() => { result.current.startMetronome(); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.countInRemaining).toBe(3);

    // AlphaTab's player becomes ready mid-count-in and hands over its context.
    act(() => { rerender({ ctx: asContext(external) }); });

    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.countInRemaining).toBe(0);
    expect(result.current.startTime).not.toBeNull();
  });

  it("falls back to the default output when the chosen device renders nothing", () => {
    frozenClock = true;
    const { result } = renderHook(() => useMetronome({ initialBpm: 60 }));
    const ctx = createdContexts[0];
    ctx.sinkId = "interface-held-by-asio";

    act(() => { result.current.startMetronome(); });
    act(() => { vi.advanceTimersByTime(700); });

    expect(ctx.setSinkId).toHaveBeenCalledWith("");
  });
});
