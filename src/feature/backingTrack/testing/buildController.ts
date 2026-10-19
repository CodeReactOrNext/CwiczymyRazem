import { vi } from "vitest";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import type { BackingAlignment } from "../types/backingTrack.types";
import { createRecordingTempoMap } from "../utils/tempoMap";

/** The tempo map the real hook derives from an alignment. Built here too, so a
 *  test that overrides the alignment can't end up with a map describing a
 *  different recording than the one under test. */
const mapFor = (alignment: BackingAlignment) =>
  createRecordingTempoMap({
    anchors: alignment.tempoAnchors,
    offsetMs: alignment.offsetMs,
    sourceBpm: alignment.sourceBpm,
  });

/** A desktop session with one file on the song and nothing aligned yet. */
export function buildController(
  overrides: Partial<BackingTrackController> = {},
): BackingTrackController {
  const base: Omit<BackingTrackController, "tempoMap" | "videoTempoMap"> = {
    enabled: true,
    desktopAvailable: true,
    library: [
      {
        id: "bt_1",
        name: "Highway to Hell",
        fileName: "Highway to Hell.mp3",
        ext: ".mp3",
        mimeType: "audio/mpeg",
        size: 1,
        importedAt: 0,
      },
    ],
    isImporting: false,
    importTracks: vi.fn(),
    importDroppedFiles: vi.fn(),
    deleteTrack: vi.fn(),
    stems: [{ trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 }],
    addStem: vi.fn(),
    removeStem: vi.fn(),
    setStem: vi.fn(),
    soloStem: vi.fn(),
    youtubeVideoId: null,
    setYouTubeVideoId: vi.fn(),
    onYouTubePlayerReady: vi.fn(),
    youtubeCanFollowTempo: true,
    isCinema: false,
    setCinema: vi.fn(),
    videoOverlay: true,
    setVideoOverlay: vi.fn(),
    videoAlignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
    setVideoAlignment: vi.fn(),
    alignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
    setAlignment: vi.fn(),
    stemUrls: {},
    startTime: null,
    effectiveBpm: 120,
    driftMsRef: { current: 0 },
    // An exercise with no tempo automation, where warped beats and score beats
    // are the same number — the case every fixture here assumes.
    scoreClockRef: { current: null },
    playbackRate: 1,
    durationSec: null,
    isTrackLoading: false,
    error: null,
    ...overrides,
  };

  return {
    ...base,
    tempoMap: overrides.tempoMap ?? mapFor(base.alignment),
    videoTempoMap: overrides.videoTempoMap ?? mapFor(base.videoAlignment),
  };
}
