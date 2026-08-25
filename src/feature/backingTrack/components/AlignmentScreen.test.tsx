// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import type { BackingAlignment } from "../types/backingTrack.types";
import { createRecordingTempoMap } from "../utils/tempoMap";
import { AlignmentScreen } from "./AlignmentScreen";

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

// The capture dialog mounts a real player; jsdom has nowhere to put one.
vi.mock("react-youtube", () => ({
  default: function YouTubeStub() {
    return <div data-testid='youtube-player' />;
  },
}));

// jsdom ships no ResizeObserver, which Radix's Slider measures its thumb with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);


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
    source: "file",
    setSource: vi.fn(),
    library: [
      {
        id: "bt_1",
        name: "Do I Wanna Know",
        fileName: "Do I Wanna Know.mp3",
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
    youtubeAppliedRate: 1,
    youtubeAchievableBpms: [],
    alignment: { offsetMs: 250, sourceBpm: 120, volume: 0.8, muted: false },
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
      flush: () => Promise.resolve(),
      refresh: vi.fn(),
    },
    driftMsRef: { current: 0 },
  // An exercise with no tempo automation, where warped beats and score beats
  // are the same number — the case every one of these fixtures assumes.
  scoreClockRef: { current: null },
    playbackRate: 1,
    durationSec: null,
    isTrackLoading: false,
    error: null,
    isCinema: false,
    setCinema: vi.fn(),
    videoOverlay: false,
    setVideoOverlay: vi.fn(),
    videoAlignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
    setVideoAlignment: vi.fn(),
    stemUrls: {},
    startTime: null,
    effectiveBpm: 120,
    ...overrides,
  };

  return {
    ...base,
    tempoMap: overrides.tempoMap ?? mapFor(base.alignment),
    videoTempoMap: overrides.videoTempoMap ?? mapFor(base.videoAlignment),
  };
}

describe("AlignmentScreen", () => {
  it("names the track being aligned and shows where it currently sits", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText("Do I Wanna Know")).toBeTruthy();
    expect(screen.getByText("+250 ms")).toBeTruthy();
  });

  it("nudges the recording later", () => {
    const setAlignment = vi.fn();

    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Nudge the backing track later"));

    expect(setAlignment).toHaveBeenCalledWith({ offsetMs: 270 }, { realign: true });
  });

  it("closes on Escape, like every full-screen surface", () => {
    const onClose = vi.fn();

    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("zooms the detail lane in and out", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText("4s")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Zoom in"));
    expect(screen.getByText("2s")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Zoom out"));
    fireEvent.click(screen.getByLabelText("Zoom out"));
    expect(screen.getByText("8s")).toBeTruthy();
  });

  it("asks for a track before offering any of the tools", () => {
    const controller = buildController({ source: "off", stems: [] });

    render(<AlignmentScreen controller={controller} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText(/Pick a backing track first/)).toBeTruthy();
    expect(screen.queryByLabelText("Nudge the backing track later")).toBeNull();
  });
});

describe("AlignmentScreen stems", () => {
  const threeStems = [
    { trackId: "backing", volume: 1, muted: false, offsetMs: 0 },
    { trackId: "guitar", volume: 0.5, muted: false, offsetMs: 0 },
    { trackId: "vocals", volume: 0.8, muted: true, offsetMs: 120 },
  ];

  const withStems = (overrides = {}) =>
    buildController({
      stems: threeStems,
      library: [
        {
          id: "backing",
          name: "Backing",
          fileName: "b.mp3",
          ext: ".mp3",
          mimeType: "audio/mpeg",
          size: 1,
          importedAt: 0,
        },
        {
          id: "guitar",
          name: "Guitar",
          fileName: "g.mp3",
          ext: ".mp3",
          mimeType: "audio/mpeg",
          size: 1,
          importedAt: 0,
        },
        {
          id: "vocals",
          name: "Vocals",
          fileName: "v.mp3",
          ext: ".mp3",
          mimeType: "audio/mpeg",
          size: 1,
          importedAt: 0,
        },
      ],
      ...overrides,
    });

  it("gives every stem its own lane", () => {
    render(<AlignmentScreen controller={withStems()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText("Backing")).toBeTruthy();
    expect(screen.getByText("Guitar")).toBeTruthy();
    expect(screen.getByText("Vocals")).toBeTruthy();
    expect(screen.getByText("3 stems")).toBeTruthy();
  });

  it("mutes one layer without touching the others", () => {
    const setStem = vi.fn();

    render(
      <AlignmentScreen controller={withStems({ setStem })} beatsPerBar={4} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("Mute Guitar"));

    expect(setStem).toHaveBeenCalledWith("guitar", { muted: true });
  });

  it("offers to unmute a layer that is already silent", () => {
    const setStem = vi.fn();

    render(
      <AlignmentScreen controller={withStems({ setStem })} beatsPerBar={4} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("Unmute Vocals"));

    expect(setStem).toHaveBeenCalledWith("vocals", { muted: false });
  });

  it("solos a layer", () => {
    const soloStem = vi.fn();

    render(
      <AlignmentScreen controller={withStems({ soloStem })} beatsPerBar={4} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("Solo Backing"));

    expect(soloStem).toHaveBeenCalledWith("backing");
  });

  it("drops a layer from the song", () => {
    const removeStem = vi.fn();

    render(
      <AlignmentScreen controller={withStems({ removeStem })} beatsPerBar={4} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("Remove Vocals from this song"));

    expect(removeStem).toHaveBeenCalledWith("vocals");
  });

  it("names a stem whose file has gone missing rather than rendering a blank strip", () => {
    render(
      <AlignmentScreen controller={withStems({ library: [] })} beatsPerBar={4} onClose={vi.fn()} />,
    );

    expect(screen.getAllByText("Missing file")).toHaveLength(3);
  });
});

describe("AlignmentScreen per-stem alignment", () => {
  const twoStems = [
    { trackId: "backing", volume: 1, muted: false, offsetMs: 0 },
    { trackId: "guitar", volume: 1, muted: false, offsetMs: 250 },
  ];

  const controllerWith = (overrides = {}) =>
    buildController({
      stems: twoStems,
      // Master at zero so a stem's own shift is unambiguous on screen.
      alignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
      library: [
        {
          id: "backing",
          name: "Backing",
          fileName: "b.mp3",
          ext: ".mp3",
          mimeType: "audio/mpeg",
          size: 1,
          importedAt: 0,
        },
        {
          id: "guitar",
          name: "Guitar",
          fileName: "g.mp3",
          ext: ".mp3",
          mimeType: "audio/mpeg",
          size: 1,
          importedAt: 0,
        },
      ],
      ...overrides,
    });

  it("shows each stem's own shift, not just the shared one", () => {
    render(<AlignmentScreen controller={controllerWith()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText("On the grid")).toBeTruthy();
    expect(screen.getByText("+250 ms")).toBeTruthy();
  });

  it("marks where the tab starts in the recording", () => {
    render(
      <AlignmentScreen
        controller={controllerWith({
          alignment: {
            offsetMs: 1500,
            sourceBpm: 120,
            volume: 0.8,
            muted: false,
          },
        })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    // The start position used to be shown twice — as seconds in the title bar
    // and as milliseconds by the nudge buttons — which is one number in two
    // units. It now lives once, next to the controls that change it.
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.getByText("+1500 ms")).toBeTruthy();
  });

  it("puts the tablature on the timeline next to the audio", () => {
    render(
      <AlignmentScreen
        controller={controllerWith()}
        beatsPerBar={4}
        measures={[{ beats: [{ duration: 1, notes: [{ string: 6, fret: 3 }] }] }]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Tablature")).toBeTruthy();
    expect(screen.getByLabelText("Tablature notes on the alignment timeline")).toBeTruthy();
  });

  it("nudging moves the whole recording, not one stem", () => {
    const setAlignment = vi.fn();
    const setStem = vi.fn();

    render(
      <AlignmentScreen
        controller={controllerWith({ setAlignment, setStem })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Nudge the backing track later"));

    expect(setAlignment).toHaveBeenCalled();
    expect(setStem).not.toHaveBeenCalled();
  });
});

describe("AlignmentScreen navigation", () => {
  const oneStem = (overrides = {}) =>
    buildController({
      stems: [{ trackId: "backing", volume: 1, muted: false, offsetMs: 0 }],
      library: [
        {
          id: "backing",
          name: "Backing",
          fileName: "b.mp3",
          ext: ".mp3",
          mimeType: "audio/mpeg",
          size: 1,
          importedAt: 0,
        },
      ],
      ...overrides,
    });

  const drag = (lane: HTMLElement, fromX: number, toX: number, init: object = {}) => {
    fireEvent.pointerDown(lane, { clientX: fromX, button: 0, pointerId: 1, ...init });
    fireEvent.pointerMove(lane, { clientX: toX, pointerId: 1 });
    fireEvent.pointerUp(lane, { clientX: toX, pointerId: 1 });
  };

  it("moves the view, not the audio, until told otherwise", () => {
    // The screen used to have no way to look elsewhere: a drag always shifted
    // the recording, and the overview map was the only other view control.
    const setStem = vi.fn();
    render(<AlignmentScreen controller={oneStem({ setStem })} beatsPerBar={4} onClose={vi.fn()} />);

    drag(screen.getByLabelText(/drag to move the view/), 500, 380);

    expect(setStem).not.toHaveBeenCalled();
  });

  it("shifts the stem once the drag tool is switched to it", () => {
    const setStem = vi.fn();
    render(<AlignmentScreen controller={oneStem({ setStem })} beatsPerBar={4} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Move audio"));
    drag(screen.getByLabelText(/drag to shift the recording/), 500, 380);

    expect(setStem).toHaveBeenCalled();
    expect(setStem.mock.calls[0][0]).toBe("backing");
  });

  it("still pans on the middle button while the audio tool is chosen", () => {
    // Middle-drag is the one gesture that means the same thing in every editor.
    const setStem = vi.fn();
    render(<AlignmentScreen controller={oneStem({ setStem })} beatsPerBar={4} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Move audio"));
    drag(screen.getByLabelText(/drag to shift the recording/), 500, 380, { button: 1 });

    expect(setStem).not.toHaveBeenCalled();
  });

  it("follows the playhead until the view is moved by hand", () => {
    render(<AlignmentScreen controller={oneStem()} beatsPerBar={4} onClose={vi.fn()} />);

    const follow = screen.getByText("Follow playback").closest("button")!;
    expect(follow.getAttribute("aria-pressed")).toBe("true");

    drag(screen.getByLabelText(/drag to move the view/), 500, 380);

    // Grabbing the timeline means wanting to stay where you put it.
    expect(follow.getAttribute("aria-pressed")).toBe("false");
  });

  it("goes back to following when asked", () => {
    render(<AlignmentScreen controller={oneStem()} beatsPerBar={4} onClose={vi.fn()} />);

    const follow = screen.getByText("Follow playback").closest("button")!;
    drag(screen.getByLabelText(/drag to move the view/), 500, 380);
    fireEvent.click(follow);

    expect(follow.getAttribute("aria-pressed")).toBe("true");
  });

  it("names which tool the drag is set to", () => {
    render(<AlignmentScreen controller={oneStem()} beatsPerBar={4} onClose={vi.fn()} />);

    const moveView = screen.getByText("Move view").closest("button")!;
    const moveAudio = screen.getByText("Move audio").closest("button")!;
    expect(moveView.getAttribute("aria-pressed")).toBe("true");
    expect(moveAudio.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(moveAudio);
    expect(moveView.getAttribute("aria-pressed")).toBe("false");
    expect(moveAudio.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("AlignmentScreen transport", () => {
  it("starts and stops the session without leaving the screen", () => {
    // Lining a recording up means listening to it, and the session's own play
    // button is behind this full-screen surface.
    const onTogglePlay = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Start playback"));

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("offers to stop while the session is running", () => {
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        isPlaying
        onTogglePlay={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Stop playback")).toBeTruthy();
  });

  it("leaves the transport out when the session cannot be driven from here", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.queryByLabelText("Start playback")).toBeNull();
  });

  it("prints the nudge keys on the buttons they drive", () => {
    // The shortcut used to live in a sentence under the controls, where nobody
    // connected the two.
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Nudge the backing track earlier").textContent).toContain("[");
    expect(screen.getByLabelText("Nudge the backing track later").textContent).toContain("]");
  });

  it("no longer offers the by-ear tools", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.queryByText(/Tap on the beat/)).toBeNull();
    expect(screen.queryByText(/Snap to first sound/)).toBeNull();
  });
});

describe("AlignmentScreen tempo precision", () => {
  const ruler = () => screen.getByLabelText(/Bar ruler/);

  // In jsdom the canvas never paints, so the ruler keeps its initial view:
  // 0.004 s per pixel, starting at second 0. The default alignment puts the
  // tab's beat 0 at 250 ms, so bar N sits at (0.25 + 2·(N−1)) seconds.
  const OFFSET_SEC = 0.25;
  const xOfBar = (bar: number) => (OFFSET_SEC + 2 * (bar - 1)) / 0.004;
  /** The tempo a written anchor implies, measured from the tab's start. */
  const bpmOf = (anchor: { beat: number; sec: number }) =>
    (anchor.beat * 60) / (anchor.sec - OFFSET_SEC);

  /** The anchors the last setAlignment call wrote. */
  const anchorsFrom = (setAlignment: ReturnType<typeof vi.fn>) => {
    const calls = setAlignment.mock.calls.filter((call) => call[0]?.tempoAnchors);
    return calls[calls.length - 1]?.[0].tempoAnchors as { beat: number; sec: number }[];
  };

  const dragBarLine = (fromX: number, byPx: number) => {
    fireEvent.pointerDown(ruler(), { clientX: fromX, button: 0, pointerId: 1 });
    fireEvent.pointerMove(ruler(), { clientX: fromX + byPx, pointerId: 1 });
    fireEvent.pointerUp(ruler(), { clientX: fromX + byPx, pointerId: 1 });
  };

  it("picks a bar for the tempo box when its line is clicked", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    fireEvent.pointerDown(ruler(), { clientX: xOfBar(2), button: 0, pointerId: 1 });
    fireEvent.pointerUp(ruler(), { clientX: xOfBar(2), pointerId: 1 });

    expect(screen.getByText("Bar 2")).toBeTruthy();
    expect(screen.getByLabelText("Tempo of the selected bar")).toBeTruthy();
  });

  it("leaves bar 1 alone, because that is the offset and has no tempo", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    fireEvent.pointerDown(ruler(), { clientX: xOfBar(1), button: 0, pointerId: 1 });
    fireEvent.pointerUp(ruler(), { clientX: xOfBar(1), pointerId: 1 });

    expect(screen.queryByLabelText("Tempo of the selected bar")).toBeNull();
  });

  it("moves the tempo by the same amount per pixel however long the span is", () => {
    // This is the whole point. Dragging the position moved BPM by
    // BPM²/(60·beats) per second, so the same gesture was worth 0.02 BPM on a
    // long span and over 5 on a short one.
    const near = vi.fn();
    const { unmount } = render(
      <AlignmentScreen
        controller={buildController({ setAlignment: near })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );
    dragBarLine(xOfBar(2), -100); // bar 2 — four beats from the start
    const nearAnchor = anchorsFrom(near).find((a) => a.beat === 4)!;
    unmount();

    const far = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment: far })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );
    dragBarLine(xOfBar(4), -100); // bar 4 — twelve beats from the start
    const farAnchor = anchorsFrom(far).find((a) => a.beat === 12)!;

    // 100 px left at 0.05 BPM a pixel is +5 BPM, on both spans.
    expect(bpmOf(nearAnchor)).toBeCloseTo(125, 4);
    expect(bpmOf(farAnchor)).toBeCloseTo(125, 4);
  });

  it("slows the bar down when dragged later", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    dragBarLine(xOfBar(2), 100);

    expect(bpmOf(anchorsFrom(setAlignment).find((a) => a.beat === 4)!)).toBeCloseTo(115, 4);
  });

  it("moves a fifth as far with Shift held", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    fireEvent.pointerDown(ruler(), { clientX: xOfBar(2), button: 0, pointerId: 1 });
    fireEvent.pointerMove(ruler(), { clientX: xOfBar(2) - 100, pointerId: 1, shiftKey: true });
    fireEvent.pointerUp(ruler(), { clientX: xOfBar(2) - 100, pointerId: 1, shiftKey: true });

    // 100 px at the fine rate of 0.01 BPM a pixel is +1, not +5.
    expect(bpmOf(anchorsFrom(setAlignment).find((a) => a.beat === 4)!)).toBeCloseTo(121, 4);
  });

  it("takes an exact tempo typed into the box", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    fireEvent.pointerDown(ruler(), { clientX: xOfBar(2), button: 0, pointerId: 1 });
    fireEvent.pointerUp(ruler(), { clientX: xOfBar(2), pointerId: 1 });

    const box = screen.getByLabelText("Tempo of the selected bar");
    fireEvent.change(box, { target: { value: "91.63" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(bpmOf(anchorsFrom(setAlignment).find((a) => a.beat === 4)!)).toBeCloseTo(91.63, 4);
  });

  it("steps by a hundredth, which dragging could never land on reliably", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    fireEvent.pointerDown(ruler(), { clientX: xOfBar(2), button: 0, pointerId: 1 });
    fireEvent.pointerUp(ruler(), { clientX: xOfBar(2), pointerId: 1 });
    fireEvent.click(screen.getByLabelText("Faster by a hundredth"));

    expect(bpmOf(anchorsFrom(setAlignment).find((a) => a.beat === 4)!)).toBeCloseTo(120.01, 4);
  });
});

describe("AlignmentScreen orientation", () => {
  it("says where you are, in the recording and in the tab", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Position in the recording")).toBeTruthy();
    expect(screen.getByText("Bar 1")).toBeTruthy();
  });

  it("offers zoom presets, so reaching the whole song is not eight clicks", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    // One bar at 120 BPM in 4/4 is two seconds.
    fireEvent.click(screen.getByText("1 bar"));
    expect(screen.getByText("2s")).toBeTruthy();

    fireEvent.click(screen.getByText("4 bars"));
    expect(screen.getByText("8s")).toBeTruthy();
  });

  it("offers a way back to the playhead only once the view has left it", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    // Following: the playhead is on screen by definition, so there is nothing
    // to go back to.
    expect(screen.queryByLabelText("Bring the playhead into view")).toBeNull();

    fireEvent.click(screen.getByText("Follow playback"));
    expect(screen.getByLabelText("Bring the playhead into view")).toBeTruthy();
  });

  it("names the first thing to do until it has been done", () => {
    // Untouched: nothing pinned and the start still at zero.
    render(
      <AlignmentScreen
        controller={buildController({
          alignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false },
        })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/drag bar 1 on the ruler/i)).toBeTruthy();
  });

  it("stops nagging once the recording has been placed", () => {
    // The default fixture already sits at +250 ms, so the job is done.
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.queryByText(/drag bar 1 on the ruler/i)).toBeNull();
  });

  it("lists every shortcut behind one key, instead of a sentence nobody reads", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    fireEvent.keyDown(window, { key: "?" });

    const sheet = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    expect(sheet.textContent).toContain("Space");
    expect(sheet.textContent).toContain("Alt + drag");
  });

  it("closes the shortcut list before it closes the screen", () => {
    const onClose = vi.fn();
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "?" });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Keyboard shortcuts" })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("plays on space, the way the rest of the app does", () => {
    const onTogglePlay = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        onClose={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { code: "Space" });

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("leaves space alone while a tempo is being typed", () => {
    const onTogglePlay = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        onClose={vi.fn()}
      />,
    );

    const box = screen.getByLabelText("The recording's own tempo");
    box.focus();
    fireEvent.keyDown(box, { code: "Space" });

    expect(onTogglePlay).not.toHaveBeenCalled();
  });
});

describe("AlignmentScreen file drop", () => {
  const audioFile = (name: string) => new File([new Uint8Array([1, 2])], name, { type: "audio/mpeg" });

  /** A drag carrying files, the way the browser reports one. */
  const fileDrag = (files: File[]) => ({
    dataTransfer: { types: ["Files"], files },
  });

  it("takes files dropped anywhere on the screen", () => {
    const importDroppedFiles = vi.fn();
    const { container } = render(
      <AlignmentScreen
        controller={buildController({ importDroppedFiles })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    const screenEl = container.firstElementChild!;
    const files = [audioFile("guitar.mp3")];
    fireEvent.dragOver(screenEl, fileDrag(files));
    fireEvent.drop(screenEl, fileDrag(files));

    expect(importDroppedFiles).toHaveBeenCalledTimes(1);
    expect(importDroppedFiles.mock.calls[0][0][0].name).toBe("guitar.mp3");
  });

  it("says what a drop will do while the files are still in the air", () => {
    const { container } = render(
      <AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />,
    );

    fireEvent.dragOver(container.firstElementChild!, fileDrag([audioFile("a.mp3")]));

    expect(screen.getByText("Drop to add as a stem")).toBeTruthy();
  });

  it("ignores a drag that carries no files, so lane drags are unaffected", () => {
    const importDroppedFiles = vi.fn();
    const { container } = render(
      <AlignmentScreen
        controller={buildController({ importDroppedFiles })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    const textDrag = { dataTransfer: { types: ["text/plain"], files: [] } };
    fireEvent.dragOver(container.firstElementChild!, textDrag);
    fireEvent.drop(container.firstElementChild!, textDrag);

    expect(screen.queryByText("Drop to add as a stem")).toBeNull();
    expect(importDroppedFiles).not.toHaveBeenCalled();
  });

  it("says so up front, rather than leaving the drop target invisible", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText(/Drop audio files anywhere/i)).toBeTruthy();
  });
});

describe("AlignmentScreen base tempo", () => {
  it("lets the recording's own tempo be typed, not just read", () => {
    // It used to be a word in the toolbar and a field two panels deep.
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    const box = screen.getByLabelText("The recording's own tempo");
    fireEvent.change(box, { target: { value: "138.5" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(setAlignment).toHaveBeenCalledWith({ sourceBpm: 138.5 }, { realign: true });
  });

  it("refuses a tempo no recording could have", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    const box = screen.getByLabelText("The recording's own tempo");
    fireEvent.change(box, { target: { value: "9000" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(setAlignment).toHaveBeenCalledWith({ sourceBpm: 400 }, { realign: true });
  });

  it("drops an abandoned edit on Escape", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    const box = screen.getByLabelText("The recording's own tempo");
    fireEvent.change(box, { target: { value: "77" } });
    fireEvent.keyDown(box, { key: "Escape" });

    expect(setAlignment).not.toHaveBeenCalled();
    expect((box as HTMLInputElement).value).toBe("120.00");
  });
});

describe("AlignmentScreen transport behaviour", () => {
  it("plays from the beat the tab was clicked on", () => {
    const onSeekToBeat = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onSeekToBeat={onSeekToBeat}
        onClose={vi.fn()}
      />,
    );

    // Same view maths as the ruler: 0.004 s per pixel from second 0, and the
    // tab's beat 0 sits at the 250 ms offset.
    fireEvent.pointerDown(screen.getByLabelText(/click to play from there/), { clientX: 562.5 });

    expect(onSeekToBeat).toHaveBeenCalledTimes(1);
    expect(onSeekToBeat.mock.calls[0][0]).toBeCloseTo(4, 3);
  });

  it("leaves the tab inert when there is no transport to drive", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.queryByLabelText(/click to play from there/)).toBeNull();
    expect(screen.getByLabelText("Tablature notes on the alignment timeline")).toBeTruthy();
  });

  it("moves the session's tempo with the recording's, so the sound is unchanged", () => {
    // The playback rate is effectiveBpm ÷ sourceBpm. Naming the song's tempo
    // must not re-pitch it; only the session's speed control should do that.
    const setAlignment = vi.fn();
    const onSessionBpmChange = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onSessionBpmChange={onSessionBpmChange}
        onClose={vi.fn()}
      />,
    );

    const box = screen.getByLabelText("The recording's own tempo");
    fireEvent.change(box, { target: { value: "138" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(setAlignment).toHaveBeenCalledWith({ sourceBpm: 138 }, { realign: true });
    expect(onSessionBpmChange).toHaveBeenCalledWith(138);
  });

  it("still sets the recording's tempo when the session tempo is locked", () => {
    // Exam mode withholds the session tempo; the grid still has to be nameable.
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({ setAlignment })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    const box = screen.getByLabelText("The recording's own tempo");
    fireEvent.change(box, { target: { value: "138" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(setAlignment).toHaveBeenCalledWith({ sourceBpm: 138 }, { realign: true });
    expect(screen.queryByText("sets the session too")).toBeNull();
  });
});

describe("instrument mixer", () => {
  const tracks = [
    { id: "main", name: "Główny Instrument", trackType: "guitar" as const, volume: 1, isMuted: false },
    { id: "gp-2", name: "Drums", trackType: "drums" as const, volume: 0.6, isMuted: false },
  ];

  const openMixer = () => fireEvent.click(screen.getByLabelText("Instrument levels"));

  it("keeps the levels behind the tablature header until they are asked for", () => {
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={vi.fn()}
        mixerTracks={tracks}
        onMixerChange={vi.fn()}
      />,
    );

    expect(screen.queryByText("Main instrument")).toBeNull();

    openMixer();

    expect(screen.getByText("Mix")).toBeTruthy();
    expect(screen.getByText("Main instrument")).toBeTruthy();
    expect(screen.getByText("Drums")).toBeTruthy();
  });

  it("reports which instrument was muted", () => {
    const onMixerChange = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={vi.fn()}
        mixerTracks={tracks}
        onMixerChange={onMixerChange}
      />,
    );

    openMixer();
    fireEvent.click(screen.getByTitle("Mute Drums"));

    expect(onMixerChange).toHaveBeenCalledWith("gp-2", { isMuted: true });
  });

  it("closes on Escape without closing the editor behind it", () => {
    const onClose = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={onClose}
        mixerTracks={tracks}
        onMixerChange={vi.fn()}
      />,
    );

    openMixer();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Main instrument")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("leaves the button out when the exercise has no instruments to balance", () => {
    render(<AlignmentScreen controller={buildController()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.queryByLabelText("Instrument levels")).toBeNull();
  });

  it("no longer draws a drum lane of its own", () => {
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={vi.fn()}
        mixerTracks={tracks}
        onMixerChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Tablature")).toBeTruthy();
    expect(screen.queryByLabelText(/Drum part/)).toBeNull();
  });
});

describe("capturing a video's waveform", () => {
  /** A video source whose waveform could be captured but has not been. */
  const withVideo = (overrides: Partial<BackingTrackController["youtubeWaveform"]> = {}) => {
    const base = buildController();
    return buildController({
      source: "youtube",
      youtubeVideoId: "abc",
      youtubeWaveform: { ...base.youtubeWaveform, status: "idle", ...overrides },
    });
  };

  it("offers a capture rather than listening on its own", () => {
    render(<AlignmentScreen controller={withVideo()} beatsPerBar={4} onClose={vi.fn()} />);

    expect(screen.getByText("No waveform captured yet")).toBeTruthy();
    expect(screen.getByText("Capture waveform")).toBeTruthy();
  });

  it("stops the session on the way in, so only one video is heard", () => {
    const onTogglePlay = vi.fn();
    render(
      <AlignmentScreen
        controller={withVideo()}
        beatsPerBar={4}
        onClose={vi.fn()}
        isPlaying
        onTogglePlay={onTogglePlay}
      />,
    );

    fireEvent.click(screen.getByText("Capture waveform"));

    expect(onTogglePlay).toHaveBeenCalled();
    expect(screen.getByText("Capture the waveform")).toBeTruthy();
  });

  it("asks for more of a video it already knows some of", () => {
    render(
      <AlignmentScreen
        controller={withVideo({ coverage: 0.4 })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("40% of the video captured")).toBeTruthy();
    expect(screen.getByText("Capture more")).toBeTruthy();
  });

  it("has nothing left to ask for once the whole video is known", () => {
    render(
      <AlignmentScreen
        controller={withVideo({ coverage: 1, isComplete: true })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Whole video captured.")).toBeTruthy();
    expect(screen.queryByText(/^Capture/)).toBeNull();
  });
});

describe("silencing a lane", () => {
  const tracks = [
    { id: "main", name: "Główny Instrument", trackType: "guitar" as const, volume: 1, isMuted: false },
    { id: "gp-2", name: "Drums", trackType: "drums" as const, volume: 0.6, isMuted: false },
  ];

  const renderWithMix = (mixerTracks: typeof tracks, onMixerChange = vi.fn()) => {
    render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={vi.fn()}
        mixerTracks={mixerTracks}
        onMixerChange={onMixerChange}
      />,
    );
    return onMixerChange;
  };

  it("mutes every instrument the tablature plays at once", () => {
    const onMixerChange = renderWithMix(tracks);

    fireEvent.click(screen.getByLabelText("Mute the tablature"));

    expect(onMixerChange).toHaveBeenCalledWith("main", { isMuted: true });
    expect(onMixerChange).toHaveBeenCalledWith("gp-2", { isMuted: true });
  });

  it("counts as muted only once nothing is left making a sound", () => {
    renderWithMix([tracks[0], { ...tracks[1], isMuted: true }]);

    // One instrument off is a mix, not a mute.
    expect(screen.getByLabelText("Mute the tablature")).toBeTruthy();
    expect(screen.getByText("what you play")).toBeTruthy();
  });

  it("hands back the mix it silenced rather than turning everything on", () => {
    // The drums were already off before the lane was muted, so unmuting must
    // not switch them back on — that would be a mix nobody asked for.
    const onMixerChange = vi.fn();
    const { rerender } = render(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={vi.fn()}
        mixerTracks={[tracks[0], { ...tracks[1], isMuted: true }]}
        onMixerChange={onMixerChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Mute the tablature"));
    expect(onMixerChange).toHaveBeenCalledTimes(1);
    expect(onMixerChange).toHaveBeenCalledWith("main", { isMuted: true });

    // The session applies it and hands the new levels back.
    rerender(
      <AlignmentScreen
        controller={buildController()}
        beatsPerBar={4}
        onClose={vi.fn()}
        mixerTracks={tracks.map((track) => ({ ...track, isMuted: true }))}
        onMixerChange={onMixerChange}
      />,
    );

    expect(screen.getByText("muted")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Unmute the tablature"));

    expect(onMixerChange).toHaveBeenLastCalledWith("main", { isMuted: false });
    expect(onMixerChange).toHaveBeenCalledTimes(2);
  });

  it("mutes the video from its own lane", () => {
    const setAlignment = vi.fn();
    render(
      <AlignmentScreen
        controller={buildController({
          source: "youtube",
          youtubeVideoId: "abc",
          setAlignment,
        })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Mute the video"));

    expect(setAlignment).toHaveBeenCalledWith({ muted: true });
  });

  it("says so on the video lane once it is silent", () => {
    render(
      <AlignmentScreen
        controller={buildController({
          source: "youtube",
          youtubeVideoId: "abc",
          alignment: { offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: true },
        })}
        beatsPerBar={4}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Unmute the video")).toBeTruthy();
    expect(screen.queryByText("tap to align")).toBeNull();
  });
});
