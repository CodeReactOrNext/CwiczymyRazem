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
    let initDone: Promise<unknown> = Promise.resolve();
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

const domError = (name: string) => Object.assign(new Error(name), { name });

/** getUserMedia that answers at once: a stream, or the error the given constraints earn. */
function stubGetUserMedia(answer: (audio: MediaTrackConstraints) => FakeStream | Error) {
  const getUserMedia = vi.fn(async ({ audio }: { audio: MediaTrackConstraints }) => {
    const result = answer(audio);
    if (result instanceof Error) throw result;
    return result;
  });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  return getUserMedia;
}

describe("useAudioAnalyzer opening the input", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    ["NotAllowedError", "denied"],
    ["NotFoundError", "no_device"],
    ["NotReadableError", "busy"],
    ["SomethingElse", "unknown"],
  ])("reports %s as %s instead of swallowing it", async (name, reason) => {
    stubGetUserMedia(() => domError(name));
    const { result } = renderHook(() => useAudioAnalyzer());
    let outcome: unknown;
    await act(async () => { outcome = await result.current.init(); });

    expect(outcome).toEqual({ ok: false, reason });
    expect(result.current.isListening).toBe(false);
    expect(result.current.errorReason).toBe(reason);
  });

  it("reports a browser without getUserMedia as unsupported", async () => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    const { result } = renderHook(() => useAudioAnalyzer());
    let outcome: unknown;
    await act(async () => { outcome = await result.current.init(); });
    expect(outcome).toEqual({ ok: false, reason: "unsupported" });
  });

  it("resolves ok once the input is open", async () => {
    stubGetUserMedia(() => makeStream());
    const { result } = renderHook(() => useAudioAnalyzer());
    let outcome: unknown;
    await act(async () => { outcome = await result.current.init(); });
    expect(outcome).toEqual({ ok: true });
    expect(result.current.isListening).toBe(true);
    expect(result.current.errorReason).toBeNull();
  });

  it("opens the device picked last time", async () => {
    localStorage.setItem("web_audio_input_device_id", "scarlett");
    const getUserMedia = stubGetUserMedia(() => makeStream());
    const { result } = renderHook(() => useAudioAnalyzer());
    await act(async () => { await result.current.init(); });

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(getUserMedia.mock.calls[0][0].audio.deviceId).toEqual({ exact: "scarlett" });
  });

  it("falls back to the default input when the picked device is gone", async () => {
    localStorage.setItem("web_audio_input_device_id", "unplugged");
    const getUserMedia = stubGetUserMedia((audio) => (audio.deviceId ? domError("OverconstrainedError") : makeStream()));
    const { result } = renderHook(() => useAudioAnalyzer());
    let outcome: unknown;
    await act(async () => { outcome = await result.current.init(); });

    expect(outcome).toEqual({ ok: true });
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(live()).toHaveLength(1);
  });

  it("does not ask twice when access is refused", async () => {
    localStorage.setItem("web_audio_input_device_id", "scarlett");
    const getUserMedia = stubGetUserMedia(() => domError("NotAllowedError"));
    const { result } = renderHook(() => useAudioAnalyzer());
    await act(async () => { await result.current.init(); });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("picking a device remembers it and reopens the input on it", async () => {
    const getUserMedia = stubGetUserMedia(() => makeStream());
    const { result } = renderHook(() => useAudioAnalyzer());
    await act(async () => { await result.current.init(); });
    await act(async () => { await result.current.webInput.selectDevice("scarlett"); });

    expect(localStorage.getItem("web_audio_input_device_id")).toBe("scarlett");
    expect(getUserMedia.mock.calls[1][0].audio.deviceId).toEqual({ exact: "scarlett" });
    expect(streams[0].stopped).toBe(true);
    expect(live()).toHaveLength(1);
  });

  it("shows which jack the worklet is reading", async () => {
    stubGetUserMedia(() => makeStream());
    const { result } = renderHook(() => useAudioAnalyzer());
    await act(async () => { await result.current.init(); });
    const port = liveWorklets()[0] as unknown as { onmessage: (event: { data: unknown }) => void };
    act(() => { port.onmessage({ data: { type: "channels", count: 2, active: 1 } }); });

    expect(result.current.webInput.channelCount).toBe(2);
    expect(result.current.webInput.activeChannel).toBe(1);
  });

  it("remembers a pinned jack and forgets it on auto", () => {
    const { result } = renderHook(() => useAudioAnalyzer());
    act(() => { result.current.webInput.selectChannel(1); });
    expect(localStorage.getItem("web_audio_input_channel")).toBe("1");
    expect(result.current.webInput.channel).toBe(1);

    act(() => { result.current.webInput.selectChannel(null); });
    expect(localStorage.getItem("web_audio_input_channel")).toBeNull();
    expect(result.current.webInput.channel).toBeNull();
  });
});
