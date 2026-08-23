// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import type { BackingAlignment } from "../types/backingTrack.types";
import { createRecordingTempoMap } from "../utils/tempoMap";
import { BackingTrackBar } from "./BackingTrackBar";

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

// Counts how often the player is actually mounted. Moving it in the React tree
// (rather than restyling it in place) would destroy the YouTube player and make
// it re-buffer — the whole reason cinema mode is a CSS switch.
const youtubeMounts = vi.hoisted(() => ({ count: 0 }));
vi.mock("react-youtube", async () => {
  const { useEffect } = await import("react");
  return {
    default: function YouTubeStub() {
      useEffect(() => {
        youtubeMounts.count += 1;
      }, []);
      return <div data-testid='youtube-player' />;
    },
  };
});

// jsdom ships no ResizeObserver, which Radix's Slider measures its thumb with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

// This project wires no vitest setup file, so RTL's auto-cleanup never runs and
// renders would otherwise pile up in one shared document across tests.
afterEach(cleanup);

/**
 * The bar is a strip now — source, files, tempo and levels all live in the
 * editor it opens, so a test about any of them has to open it first.
 */
function renderWithSettings(ui: React.ReactElement) {
  const result = render(ui);
  fireEvent.click(screen.getByText(/Mixer & sync|Set up/));
  // The editor collapses setup once a source is chosen, so open it explicitly.
  const band = screen.queryByText("Source & mix");
  if (band && band.closest("button")?.getAttribute("aria-expanded") === "false") {
    fireEvent.click(band);
  }
  return result;
}


/** The tempo map the real hook derives from an alignment. Built here too, so a
 *  test that overrides the alignment can't end up with a map describing a
 *  different recording than the one under test. */
const mapFor = (alignment: BackingAlignment) =>
  createRecordingTempoMap({
    anchors: alignment.tempoAnchors,
    offsetMs: alignment.offsetMs,
    sourceBpm: alignment.sourceBpm,
  });

function buildController(overrides: Partial<BackingTrackController> = {}): BackingTrackController {
  const base: Omit<BackingTrackController, "tempoMap" | "videoTempoMap"> = {
    enabled: true,
    desktopAvailable: true,
    source: "youtube",
    setSource: vi.fn(),
    library: [],
    isImporting: false,
    importTracks: vi.fn(),
    importDroppedFiles: vi.fn(),
    deleteTrack: vi.fn(),
    stems: [],
    addStem: vi.fn(),
    removeStem: vi.fn(),
    setStem: vi.fn(),
    soloStem: vi.fn(),
    youtubeVideoId: "abc123",
    setYouTubeVideoId: vi.fn(),
    onYouTubePlayerReady: vi.fn(),
    youtubeCanFollowTempo: true,
    youtubeAppliedRate: 1,
    youtubeAchievableBpms: [90, 120, 150],
    isCinema: false,
    setCinema: vi.fn(),
    videoOverlay: false,
    setVideoOverlay: vi.fn(),
    videoAlignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
    setVideoAlignment: vi.fn(),
    stemUrls: {},
    startTime: null,
    effectiveBpm: 120,
    alignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
    setAlignment: vi.fn(),
    youtubeWaveform: {
      status: "unsupported" as const,
      peaks: null,
      onsets: null,
      peaksPerSecond: 120,
      durationSec: 0,
      coverage: 0,
      isComplete: false,
      revision: 0,
      latencyMs: null,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      watch: () => () => {},
    },
    driftMsRef: { current: 0 },
  // An exercise with no tempo automation, where warped beats and score beats
  // are the same number — the case every one of these fixtures assumes.
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

describe("BackingTrackBar sync controls", () => {
  it("shifts the track later when nudged forward", () => {
    const setAlignment = vi.fn();
    const controller = buildController({
      setAlignment,
      alignment: { offsetMs: 100, sourceBpm: 120, volume: 0.8, muted: false },
    });

    renderWithSettings(<BackingTrackBar controller={controller} sessionBpm={120} />);
    fireEvent.click(screen.getByLabelText("Nudge the backing track later"));

    expect(setAlignment).toHaveBeenCalledWith({ offsetMs: 120 }, { realign: true });
  });

  it("takes a bigger step when Shift is held", () => {
    const setAlignment = vi.fn();
    renderWithSettings(<BackingTrackBar controller={buildController({ setAlignment })} sessionBpm={120} />);

    fireEvent.click(screen.getByLabelText("Nudge the backing track earlier"), {
      shiftKey: true,
    });

    expect(setAlignment).toHaveBeenCalledWith({ offsetMs: -100 }, { realign: true });
  });

  it("nudges from the keyboard, so the player never leaves the guitar", () => {
    const setAlignment = vi.fn();
    render(<BackingTrackBar controller={buildController({ setAlignment })} sessionBpm={120} />);

    fireEvent.keyDown(window, { key: "]" });

    expect(setAlignment).toHaveBeenCalledWith({ offsetMs: 20 });
  });

  it("leaves the brackets alone while typing in a field", () => {
    const setAlignment = vi.fn();
    render(
      <>
        <input aria-label='somewhere to type' />
        <BackingTrackBar controller={buildController({ setAlignment })} sessionBpm={120} />
      </>,
    );

    fireEvent.keyDown(screen.getByLabelText("somewhere to type"), { key: "]" });

    expect(setAlignment).not.toHaveBeenCalled();
  });

  it("offers no sync controls until a source is actually playing something", () => {
    render(
      <BackingTrackBar
        controller={buildController({ source: "off", youtubeVideoId: null })}
        sessionBpm={120}
      />,
    );

    expect(screen.queryByLabelText("Nudge the backing track later")).toBeNull();
  });
});

describe("BackingTrackBar per-source controls", () => {
  it("keeps the master level and recording tempo out of the YouTube view", () => {
    renderWithSettings(<BackingTrackBar controller={buildController()} sessionBpm={120} />);

    expect(screen.queryByText("Master")).toBeNull();
    expect(screen.queryByText("Recording tempo")).toBeNull();
  });

  it("gives local stems their own tempo and master level, which they genuinely need", () => {
    const controller = buildController({
      source: "file",
      stems: [{ trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 }],
    });

    renderWithSettings(<BackingTrackBar controller={controller} sessionBpm={120} />);

    expect(screen.getByText("Master")).toBeTruthy();
    expect(screen.getByText("Recording tempo")).toBeTruthy();
  });

  it("offers one-click tempos the video can hold when it cannot hold this one", () => {
    const onSessionBpmChange = vi.fn();
    const controller = buildController({ youtubeCanFollowTempo: false });

    renderWithSettings(
      <BackingTrackBar
        controller={controller}
        sessionBpm={112}
        onSessionBpmChange={onSessionBpmChange}
      />,
    );
    fireEvent.click(screen.getByText("120 BPM"));

    expect(onSessionBpmChange).toHaveBeenCalledWith(120);
  });

  it("confirms the lock instead of warning when the tempo does hold", () => {
    renderWithSettings(<BackingTrackBar controller={buildController()} sessionBpm={120} />);

    expect(screen.getByText(/holds this tempo exactly/i)).toBeTruthy();
  });
});

describe("BackingTrackBar cinema mode", () => {
  it("turns cinema on from the video controls", () => {
    const setCinema = vi.fn();

    renderWithSettings(<BackingTrackBar controller={buildController({ setCinema })} sessionBpm={120} />);
    fireEvent.click(screen.getByText("Cinema"));

    expect(setCinema).toHaveBeenCalledWith(true);
  });

  it("offers the way back out once the video has taken the screen", () => {
    const setCinema = vi.fn();

    render(
      <BackingTrackBar
        controller={buildController({ setCinema, isCinema: true })}
        sessionBpm={120}
      />,
    );
    fireEvent.click(screen.getByText(/Leave cinema/));

    expect(setCinema).toHaveBeenCalledWith(false);
  });

  it("clears its own controls out of the picture", () => {
    render(<BackingTrackBar controller={buildController({ isCinema: true })} sessionBpm={120} />);

    expect(screen.queryByText("Backing track")).toBeNull();
    expect(screen.queryByText("Change video")).toBeNull();
    expect(screen.queryByLabelText("Nudge the backing track later")).toBeNull();
  });

  it("keeps the very same player across the switch, so it never re-buffers", () => {
    youtubeMounts.count = 0;

    const { rerender } = render(
      <BackingTrackBar controller={buildController({ isCinema: false })} sessionBpm={120} />,
    );
    expect(youtubeMounts.count).toBe(1);

    rerender(<BackingTrackBar controller={buildController({ isCinema: true })} sessionBpm={120} />);
    rerender(
      <BackingTrackBar controller={buildController({ isCinema: false })} sessionBpm={120} />,
    );

    // Two mode switches, still the original player — only its classes moved.
    expect(youtubeMounts.count).toBe(1);
    expect(screen.getByTestId("youtube-player")).toBeTruthy();
  });

  it("leaves cinema on Escape, the way every full-screen surface does", () => {
    const setCinema = vi.fn();

    render(
      <BackingTrackBar
        controller={buildController({ setCinema, isCinema: true })}
        sessionBpm={120}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });

    expect(setCinema).toHaveBeenCalledWith(false);
  });

  it("does not listen for Escape when it isn't in cinema", () => {
    const setCinema = vi.fn();

    render(<BackingTrackBar controller={buildController({ setCinema })} sessionBpm={120} />);
    fireEvent.keyDown(window, { key: "Escape" });

    expect(setCinema).not.toHaveBeenCalled();
  });

  it("has no cinema toggle for a local file — there is no picture to show", () => {
    const controller = buildController({
      source: "file",
      stems: [{ trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 }],
    });

    render(<BackingTrackBar controller={controller} sessionBpm={120} />);

    expect(screen.queryByText("Cinema")).toBeNull();
  });
});

describe("BackingTrackBar alignment mode", () => {
  it("stays out of the way until asked for", () => {
    render(<BackingTrackBar controller={buildController()} sessionBpm={120} />);

    expect(screen.queryByText(/Tap on the beat/)).toBeNull();
  });

  it("opens the alignment screen and explains why YouTube has no waveform", () => {
    render(<BackingTrackBar controller={buildController()} sessionBpm={120} />);
    fireEvent.click(screen.getByText("Mixer & sync"));

    expect(screen.getByText("Align backing track")).toBeTruthy();
    // A video's waveform has to be learned by listening, which needs tab-audio
    // capture — jsdom has none, the same as Firefox and Safari.
    expect(screen.getByText(/can't share tab audio/i)).toBeTruthy();
    // Something only the full-screen editor has — the bar underneath carries
    // its own nudge controls with the same labels.
    expect(screen.getByText("Follow playback")).toBeTruthy();
  });

  it("gives a local file the draggable bars-and-beats lane", () => {
    const controller = buildController({
      source: "file",
      stems: [{ trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 }],
    });

    render(<BackingTrackBar controller={controller} sessionBpm={120} />);
    fireEvent.click(screen.getByText("Mixer & sync"));

    expect(
      screen.getByLabelText("Backing track alignment grid — drag to move the view"),
    ).toBeTruthy();
  });

  it("closes the screen again", () => {
    render(<BackingTrackBar controller={buildController()} sessionBpm={120} />);
    fireEvent.click(screen.getByText("Mixer & sync"));
    fireEvent.click(screen.getByText("Done"));

    expect(screen.queryByText("Align backing track")).toBeNull();
  });

  it("has nothing to align when no source is playing", () => {
    const controller = buildController({ source: "off", youtubeVideoId: null });

    render(<BackingTrackBar controller={controller} sessionBpm={120} />);

    expect(screen.queryByText("Align")).toBeNull();
  });
});

describe("BackingTrackBar video over a file", () => {
  const fileController = (overrides: Partial<BackingTrackController> = {}) =>
    buildController({
      source: "file",
      stems: [{ trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 }],
      ...overrides,
    });

  it("offers the picture as an add-on to the files, not as another source", () => {
    const setVideoOverlay = vi.fn();

    renderWithSettings(<BackingTrackBar controller={fileController({ setVideoOverlay })} sessionBpm={120} />);
    fireEvent.click(screen.getByText("Video"));

    expect(setVideoOverlay).toHaveBeenCalledWith(true);
  });

  it("plays the video beside the file controls, and says which one you are hearing", () => {
    renderWithSettings(
      <BackingTrackBar controller={fileController({ videoOverlay: true })} sessionBpm={120} />,
    );

    expect(screen.getByTestId("youtube-player")).toBeTruthy();
    expect(screen.getByText(/the video is muted/i)).toBeTruthy();
    // The files are still the sound, so their own controls stay.
    expect(screen.getByText("Recording tempo")).toBeTruthy();
  });

  it("shifts the picture without moving the sound", () => {
    const setAlignment = vi.fn();
    const setVideoAlignment = vi.fn();
    const controller = fileController({
      videoOverlay: true,
      setAlignment,
      setVideoAlignment,
      videoAlignment: {
        offsetMs: 200,
        sourceBpm: 120,
        volume: 0.8,
        muted: false,
      },
    });

    renderWithSettings(<BackingTrackBar controller={controller} sessionBpm={120} />);
    fireEvent.click(screen.getByLabelText("Nudge the video later"));

    expect(setVideoAlignment).toHaveBeenCalledWith({ offsetMs: 220 });
    expect(setAlignment).not.toHaveBeenCalled();
  });

  it("asks for a video first when the song has none yet", () => {
    renderWithSettings(
      <BackingTrackBar
        controller={fileController({
          videoOverlay: true,
          youtubeVideoId: null,
        })}
        sessionBpm={120}
      />,
    );

    expect(screen.getByPlaceholderText(/youtube\.com\/watch/)).toBeTruthy();
  });

  it("takes the borrowed picture into cinema, with the files still playing", () => {
    render(
      <BackingTrackBar
        controller={fileController({ videoOverlay: true, isCinema: true })}
        sessionBpm={120}
      />,
    );

    expect(screen.getByTestId("youtube-player")).toBeTruthy();
    expect(screen.queryByText("Add files")).toBeNull();
  });
});
