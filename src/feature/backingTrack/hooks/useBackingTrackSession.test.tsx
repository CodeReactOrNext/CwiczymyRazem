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

const baseOptions = {
  songId: "song-1",
  userId: "user-1",
  gpTempo: 96,
  isPlaying: false,
  startTime: null,
  scoreClockRef: { current: null },
  effectiveBpm: 96,
  sessionBpm: 96,
};

beforeEach(() => {
  localStorage.clear();
  delete (window as { backingTracks?: unknown }).backingTracks;
});

/** Enough of the preload bridge for the file source to be on offer at all. */
const stubDesktopBridge = () => {
  (window as unknown as { backingTracks: unknown }).backingTracks = {
    isAvailable: true,
    listTracks: vi.fn().mockResolvedValue([]),
    importTracks: vi.fn().mockResolvedValue([]),
    deleteTrack: vi.fn().mockResolvedValue(undefined),
    readTrack: vi.fn().mockResolvedValue(null),
    getAssignment: vi.fn().mockResolvedValue(null),
    saveAssignment: vi.fn().mockResolvedValue(null),
    clearAssignment: vi.fn().mockResolvedValue(undefined),
  };
};

describe("useBackingTrackSession", () => {
  it("mounts on the web build, where there is no desktop bridge at all", () => {
    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.enabled).toBe(true);
    expect(result.current.desktopAvailable).toBe(false);
    expect(result.current.source).toBe("off");
    expect(result.current.stems).toEqual([]);
  });

  it("stays idle for a plan that isn't a song", () => {
    const { result } = renderHook(() =>
      useBackingTrackSession({ ...baseOptions, songId: null }),
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.source).toBe("off");
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

  it("does not offer the file source when a stored choice points at a machine without it", () => {
    localStorage.setItem("rq_backing_source_song-1", "file");

    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.source).toBe("off");
  });

  it("keeps a stored YouTube choice, which works on any build", () => {
    localStorage.setItem("rq_backing_source_song-1", "youtube");

    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.source).toBe("youtube");
  });
});

describe("useBackingTrackSession video over files", () => {
  it("lets the picture come from YouTube while the sound comes from local files", () => {
    stubDesktopBridge();
    localStorage.setItem("rq_backing_source_song-1", "file");
    localStorage.setItem("rq_backing_video_song-1", "1");

    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.source).toBe("file");
    expect(result.current.videoOverlay).toBe(true);
  });

  it("has no picture to add while YouTube is already the sound", () => {
    localStorage.setItem("rq_backing_source_song-1", "youtube");
    localStorage.setItem("rq_backing_video_song-1", "1");

    const { result } = renderHook(() => useBackingTrackSession(baseOptions));

    expect(result.current.videoOverlay).toBe(false);
  });

  it("remembers the choice for this song, since it depends on there being a video worth watching", () => {
    stubDesktopBridge();
    localStorage.setItem("rq_backing_source_song-1", "file");

    const { result } = renderHook(() => useBackingTrackSession(baseOptions));
    act(() => result.current.setVideoOverlay(true));

    expect(result.current.videoOverlay).toBe(true);
    expect(localStorage.getItem("rq_backing_video_song-1")).toBe("1");
  });

  it("keeps the two layers apart: shifting the picture leaves the sound where it was", () => {
    stubDesktopBridge();
    localStorage.setItem("rq_backing_source_song-1", "file");

    const { result } = renderHook(() => useBackingTrackSession(baseOptions));
    act(() => result.current.setAlignment({ offsetMs: 120 }));
    act(() => result.current.setVideoAlignment({ offsetMs: -400 }));

    expect(result.current.alignment.offsetMs).toBe(120);
    expect(result.current.videoAlignment.offsetMs).toBe(-400);
  });
});
