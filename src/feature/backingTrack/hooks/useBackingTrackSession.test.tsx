// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBackingTrackSession } from "./useBackingTrackSession";

// The Firestore side is exercised through its own service; here it only has to
// exist so mounting the hook doesn't drag a real client in.
vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));
vi.mock("../services/songBackingSync.service", () => ({
  getYouTubeBackingConfig: vi.fn().mockResolvedValue(null),
  saveYouTubeBackingConfig: vi.fn().mockResolvedValue(undefined),
}));

// What the video player is asked to do is the whole question for the video, so
// the player is replaced by a recorder of its arguments.
const youtubeCalls = vi.hoisted(() => [] as { videoId: string | null; volume: number; muted: boolean }[]);
vi.mock("./useYouTubeBackingPlayer", () => ({
  useYouTubeBackingPlayer: (options: { videoId: string | null; volume: number; muted: boolean }) => {
    youtubeCalls.push(options);
    return {
      handleReady: () => {},
      driftMsRef: { current: 0 },
      appliedRate: 1,
      canFollowTempo: true,
      availableRates: [1],
      getPlayerClock: () => null,
    };
  },
}));

const baseOptions = {
  songId: "song-1",
  userId: "user-1",
  gpTempo: 96,
  isPlaying: false,
  startTime: null,
  scoreClockRef: { current: null },
  effectiveBpm: 96,
};

beforeEach(() => {
  localStorage.clear();
  youtubeCalls.length = 0;
  delete (window as { backingTracks?: unknown }).backingTracks;
});

describe("useBackingTrackSession", () => {
  it("mounts on the web build, where there is no desktop bridge at all", () => {
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.enabled).toBe(true);
    expect(result.current.desktopAvailable).toBe(false);
    expect(result.current.stems).toEqual([]);
  });

  it("stays idle for a plan that isn't a song", () => {
    const { result } = renderHook(() =>
      useBackingTrackSession({ ...baseOptions, songId: null }),
    );

    expect(result.current.enabled).toBe(false);
  });

  it("seeds the recording tempo from the score rather than a hardcoded default", () => {
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.alignment.sourceBpm).toBe(96);
  });

  it("falls back to a sane tempo when the score has none", () => {
    const { result } = renderHook(() =>
      useBackingTrackSession({ ...baseOptions, gpTempo: null }),
    );

    expect(result.current.alignment.sourceBpm).toBe(120);
  });
});

describe("useBackingTrackSession video", () => {
  it("shows a song's video unless it was hidden for that song", () => {
    const { result, unmount } = renderHook(() => useBackingTrackSession(baseOptions));
    expect(result.current.videoOverlay).toBe(true);
    unmount();

    localStorage.setItem("rq_backing_video_song-1", "0");
    const hidden = renderHook(() => useBackingTrackSession(baseOptions));
    expect(hidden.result.current.videoOverlay).toBe(false);
  });

  it("remembers hiding it, per song", () => {
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));
    act(() => result.current.setVideoOverlay(false));

    expect(result.current.videoOverlay).toBe(false);
    expect(localStorage.getItem("rq_backing_video_song-1")).toBe("0");
  });

  it("brings a newly added video on screen", () => {
    localStorage.setItem("rq_backing_video_song-1", "0");
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    act(() => result.current.setYouTubeVideoId("abc123"));

    expect(result.current.youtubeVideoId).toBe("abc123");
    expect(result.current.videoOverlay).toBe(true);
  });

  it("never lets the video make a sound — it is only ever a picture", () => {
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));
    act(() => result.current.setYouTubeVideoId("abc123"));

    const last = youtubeCalls[youtubeCalls.length - 1];
    expect(last.videoId).toBe("abc123");
    expect(last.volume).toBe(0);
    expect(last.muted).toBe(true);
  });

  it("keeps the two syncs apart: shifting the picture leaves the sound where it was", () => {
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));
    act(() => result.current.setAlignment({ offsetMs: 120 }));
    act(() => result.current.setVideoAlignment({ offsetMs: -400 }));

    expect(result.current.alignment.offsetMs).toBe(120);
    expect(result.current.videoAlignment.offsetMs).toBe(-400);
  });
});
