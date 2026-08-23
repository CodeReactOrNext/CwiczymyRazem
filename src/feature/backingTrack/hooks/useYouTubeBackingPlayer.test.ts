// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRecordingTempoMap } from "../utils/tempoMap";
import { useYouTubeBackingPlayer } from "./useYouTubeBackingPlayer";

const baseOptions = {
  videoId: "abc123",
  isPlaying: false,
  startTime: null,
  scoreClockRef: { current: null },
  effectiveBpm: 120,
  sourceBpm: 120,
  offsetMs: 0,
  // No anchors: an even grid, exactly what sourceBpm and offsetMs described.
  tempoMap: createRecordingTempoMap({ anchors: [], offsetMs: 0, sourceBpm: 120 }),
  volume: 0.5,
  muted: false,
  realignKey: 0,
};

function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    seekTo: vi.fn(),
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    setPlaybackRate: vi.fn(),
    setVolume: vi.fn(),
    mute: vi.fn(),
    unMute: vi.fn(),
    ...overrides,
  };
}

/** A spy failing the way the real iframe API does once its element is gone:
 *  YouTube's own sendMessage reads `iframe.src` off a null element. */
const dyingCall = () =>
  vi.fn(() => {
    throw new TypeError("Cannot read properties of null (reading 'src')");
  });

describe("useYouTubeBackingPlayer", () => {
  it("hands the level to a live player on the API's 0-100 scale", () => {
    const player = makePlayer();
    const { result } = renderHook(() => useYouTubeBackingPlayer(baseOptions));

    act(() => result.current.handleReady({ target: player }));

    expect(player.setVolume).toHaveBeenCalledWith(50);
    expect(player.unMute).toHaveBeenCalled();
  });

  it("survives a player whose iframe was destroyed under it", () => {
    const player = makePlayer({ setVolume: dyingCall() });
    const { result } = renderHook(() => useYouTubeBackingPlayer(baseOptions));

    expect(() => act(() => result.current.handleReady({ target: player }))).not.toThrow();
  });

  it("drops the dead handle instead of hammering it every tick", () => {
    const player = makePlayer({ setVolume: dyingCall() });
    const { result, rerender } = renderHook(
      (props: typeof baseOptions) => useYouTubeBackingPlayer(props),
      { initialProps: baseOptions },
    );

    act(() => result.current.handleReady({ target: player }));
    // A later change would drive a live player; this one must reach nothing.
    rerender({ ...baseOptions, volume: 0.9 });

    expect(player.setVolume).toHaveBeenCalledTimes(1);
    expect(player.playVideo).not.toHaveBeenCalled();
  });

  it("takes a fresh handle after a remount, once onReady fires again", () => {
    const dead = makePlayer({ setVolume: dyingCall() });
    const live = makePlayer();
    const { result } = renderHook(() => useYouTubeBackingPlayer(baseOptions));

    act(() => result.current.handleReady({ target: dead }));
    act(() => result.current.handleReady({ target: live }));

    expect(live.setVolume).toHaveBeenCalledWith(50);
    expect(live.unMute).toHaveBeenCalled();
  });

  it("mutes through the API rather than dropping the level to zero", () => {
    const player = makePlayer();
    const { result } = renderHook(() =>
      useYouTubeBackingPlayer({ ...baseOptions, muted: true }),
    );

    act(() => result.current.handleReady({ target: player }));

    expect(player.mute).toHaveBeenCalled();
    expect(player.unMute).not.toHaveBeenCalled();
  });

  it("reports that YouTube cannot follow a tempo it has no rate for", () => {
    const { result } = renderHook(() =>
      useYouTubeBackingPlayer({ ...baseOptions, effectiveBpm: 112, sourceBpm: 120 }),
    );

    expect(result.current.canFollowTempo).toBe(false);
    expect(result.current.appliedRate).toBe(1);
  });
});

describe("useYouTubeBackingPlayer seeking policy", () => {
  const playing = () => ({ ...baseOptions, isPlaying: true, startTime: Date.now() });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps correcting while the video can hold the tempo", () => {
    vi.useFakeTimers();
    // Far from where it should be, on a tempo YouTube plays exactly (rate 1).
    const player = makePlayer({ getCurrentTime: vi.fn(() => 999) });
    const { result } = renderHook(() =>
      useYouTubeBackingPlayer({ ...playing(), effectiveBpm: 120, sourceBpm: 120 }),
    );

    act(() => result.current.handleReady({ target: player }));
    act(() => vi.advanceTimersByTime(3000));

    expect(player.seekTo.mock.calls.length).toBeGreaterThan(1);
  });

  it("aligns once and then leaves a video that cannot hold the tempo alone", () => {
    vi.useFakeTimers();
    // 112/120 = 0.933 → the player rounds towards 1, so it runs 7% fast no
    // matter what. Re-seeking that would tear the picture every couple seconds
    // and never catch up.
    const player = makePlayer({ getCurrentTime: vi.fn(() => 999) });
    const { result } = renderHook(() =>
      useYouTubeBackingPlayer({ ...playing(), effectiveBpm: 112, sourceBpm: 120 }),
    );

    act(() => result.current.handleReady({ target: player }));
    expect(player.seekTo).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(5000));

    expect(player.seekTo).toHaveBeenCalledTimes(1);
    expect(player.playVideo).toHaveBeenCalled();
  });

  it("judges what the tempo can hold by the rates the video reported", () => {
    const limited = makePlayer({ getAvailablePlaybackRates: () => [0.5, 1, 2] });
    const { result, rerender } = renderHook(
      (props: typeof baseOptions) => useYouTubeBackingPlayer(props),
      { initialProps: { ...baseOptions, effectiveBpm: 150, sourceBpm: 120 } },
    );

    // 1.25 looks fine against the default list, but this video only offers 0.5/1/2.
    act(() => result.current.handleReady({ target: limited }));
    rerender({ ...baseOptions, effectiveBpm: 150, sourceBpm: 120 });

    expect(result.current.availableRates).toEqual([0.5, 1, 2]);
    expect(result.current.canFollowTempo).toBe(false);
    expect(result.current.appliedRate).toBe(1);
  });
});
