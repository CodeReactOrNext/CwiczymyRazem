// @vitest-environment jsdom
//
// The browser path's init() awaits getUserMedia, the aubio wasm and the
// worklet module. A close() (switching exercises) or a second init() can land
// in between, and before the generation guard the stale call finished anyway:
// a stream left open after close(), or two worklets writing the same refs.

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAudioAnalyzer } from "./useAudioAnalyzer";

vi.mock("aubiojs", () => {
  class Stub {
    setTolerance() {}
    setThreshold() {}
    do() { return 0; }
    getConfidence() { return 0; }
  }
  return { default: async () => ({ Pitch: Stub, Onset: Stub }) };
});

interface FakeStream { id: number; stopped: boolean; getTracks: () => { stop: () => void }[] }

const streams: FakeStream[] = [];
const contexts: FakeContext[] = [];
const worklets: { onmessage: unknown; connected: boolean }[] = [];
let pendingGum: ((s: FakeStream) => void)[] = [];

class FakeNode {
  connect() {}
  disconnect() {}
}

class FakeContext {
  sampleRate = 48000;
  state: "running" | "suspended" | "closed" = "running";
  destination = new FakeNode();
  audioWorklet = { addModule: async () => {} };
  constructor() { contexts.push(this); }
  createMediaStreamSource() { return new FakeNode(); }
  createAnalyser() { return Object.assign(new FakeNode(), { fftSize: 0, smoothingTimeConstant: 0 }); }
  createGain() { return Object.assign(new FakeNode(), { gain: { value: 1 } }); }
  async resume() { this.state = "running"; }
  close() { this.state = "closed"; return Promise.resolve(); }
}

class FakeWorkletNode extends FakeNode {
  port = { onmessage: null as unknown };
  constructor() {
    super();
    worklets.push(this.port as unknown as { onmessage: unknown; connected: boolean });
  }
  override disconnect() { this.port.onmessage = null; }
}

function makeStream(): FakeStream {
  const s: FakeStream = { id: streams.length, stopped: false, getTracks: () => [{ stop: () => { s.stopped = true; } }] };
  streams.push(s);
  return s;
}

/** Lets the async init() run as far as it can. */
const settle = () => act(async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); });

beforeEach(() => {
  streams.length = 0;
  contexts.length = 0;
  worklets.length = 0;
  pendingGum = [];
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(() => new Promise<FakeStream>((resolve) => pendingGum.push(resolve))) },
  });
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("AudioWorkletNode", FakeWorkletNode);
  URL.createObjectURL = vi.fn(() => "blob:worklet");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const live = () => streams.filter(s => !s.stopped);
const liveWorklets = () => worklets.filter(w => w.onmessage !== null);

describe("useAudioAnalyzer init/close races", () => {
  it("close() while getUserMedia is pending leaves nothing open", async () => {
    const { result } = renderHook(() => useAudioAnalyzer());
    let initDone: Promise<void> = Promise.resolve();
    act(() => { initDone = result.current.init(); });
    act(() => { result.current.close(); });
    await act(async () => { pendingGum[0](makeStream()); await initDone; });
    await settle();

    expect(live()).toHaveLength(0);
    expect(liveWorklets()).toHaveLength(0);
    expect(result.current.isListening).toBe(false);
  });

  it("a second init() while the first is pending ends with exactly one input", async () => {
    const { result } = renderHook(() => useAudioAnalyzer());
    act(() => { void result.current.init(); });
    act(() => { void result.current.init(); });
    // Resolve the newer call first, then the stale one.
    await act(async () => { pendingGum[1](makeStream()); });
    await settle();
    await act(async () => { pendingGum[0](makeStream()); });
    await settle();

    expect(live()).toHaveLength(1);
    expect(liveWorklets()).toHaveLength(1);
    expect(contexts.filter(c => c.state !== "closed")).toHaveLength(1);
    expect(result.current.isListening).toBe(true);
  });

  it("init() over an open input closes the old one first", async () => {
    const { result } = renderHook(() => useAudioAnalyzer());
    act(() => { void result.current.init(); });
    await act(async () => { pendingGum[0](makeStream()); });
    await settle();
    expect(live()).toHaveLength(1);

    act(() => { void result.current.init(); });
    await act(async () => { pendingGum[1](makeStream()); });
    await settle();

    expect(streams[0].stopped).toBe(true);
    expect(live()).toHaveLength(1);
    expect(liveWorklets()).toHaveLength(1);
    expect(contexts[0].state).toBe("closed");
  });

  it("close() after a finished init() releases everything", async () => {
    const { result } = renderHook(() => useAudioAnalyzer());
    act(() => { void result.current.init(); });
    await act(async () => { pendingGum[0](makeStream()); });
    await settle();
    act(() => { result.current.close(); });

    expect(live()).toHaveLength(0);
    expect(liveWorklets()).toHaveLength(0);
    expect(contexts.every(c => c.state === "closed")).toBe(true);
  });
});
