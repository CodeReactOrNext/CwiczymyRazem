// @vitest-environment jsdom
import {
  createAudioContext,
  preferPlaybackAudioSession,
  wakeAudioContext,
} from "utils/audio/audioContext";
import { afterEach, describe, expect, it, vi } from "vitest";

const setAudioSession = (session: { type: string } | undefined) =>
  Object.defineProperty(navigator, "audioSession", {
    value: session,
    configurable: true,
  });

const fakeContext = (state: string) =>
  ({
    state,
    resume: vi.fn(() => Promise.resolve()),
  }) as unknown as AudioContext & { resume: ReturnType<typeof vi.fn> };

afterEach(() => {
  setAudioSession(undefined);
  vi.unstubAllGlobals();
});

describe("preferPlaybackAudioSession", () => {
  it("switches the iOS audio session to playback", () => {
    const session = { type: "auto" };
    setAudioSession(session);
    preferPlaybackAudioSession();
    expect(session.type).toBe("playback");
  });

  it("does nothing where the API is missing", () => {
    expect(() => preferPlaybackAudioSession()).not.toThrow();
  });
});

describe("createAudioContext", () => {
  it("sets the playback session before creating the context", () => {
    const session = { type: "auto" };
    setAudioSession(session);
    const Ctor = vi.fn(function (this: object) {
      expect(session.type).toBe("playback");
    });
    vi.stubGlobal("AudioContext", Ctor);

    expect(createAudioContext()).not.toBeNull();
    expect(Ctor).toHaveBeenCalledOnce();
  });

  it("returns null without Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(createAudioContext()).toBeNull();
  });
});

describe("wakeAudioContext", () => {
  it.each(["suspended", "interrupted"])("resumes a %s context", (state) => {
    const ctx = fakeContext(state);
    wakeAudioContext(ctx);
    expect(ctx.resume).toHaveBeenCalledOnce();
  });

  it.each(["running", "closed"])("leaves a %s context alone", (state) => {
    const ctx = fakeContext(state);
    wakeAudioContext(ctx);
    expect(ctx.resume).not.toHaveBeenCalled();
  });
});
