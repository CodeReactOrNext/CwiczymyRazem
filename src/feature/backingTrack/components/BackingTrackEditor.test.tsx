// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildController } from "../testing/buildController";
import type { BackingAlignment } from "../types/backingTrack.types";
import type { RecordingFeatures } from "../utils/audioFeatures";
import { BackingTrackEditor } from "./BackingTrackEditor";

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

// jsdom ships no ResizeObserver, which Radix's Slider measures its thumb with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

// The recording's analysis and the sync worker, under the test's control.
const analysisState = vi.hoisted(() => ({ features: null as RecordingFeatures | null }));
vi.mock("../hooks/useRecordingAnalysis", () => ({
  PEAKS_PER_SECOND: 120,
  useRecordingAnalysis: () => ({
    peaks: null,
    durationSec: 0,
    isLoading: false,
    features: analysisState.features,
    isAnalysing: !analysisState.features,
  }),
  // Never settles while there are no features — an analysis still running.
  recordingFeatures: () =>
    analysisState.features ? Promise.resolve(analysisState.features) : new Promise(() => {}),
}));
const requestAutoSync = vi.hoisted(() => vi.fn());
vi.mock("../services/analysisClient", () => ({ requestAutoSync }));

const FEATURES: RecordingFeatures = {
  onset: new Float32Array(10),
  onsetFps: 172,
  chroma: new Float32Array(120),
  chromaFps: 43,
  durationSec: 60,
};
/** Four bars of quarter notes — enough tab for automatic sync to work on. */
const MEASURES = Array.from({ length: 4 }, () => ({
  beats: Array.from({ length: 4 }, () => ({ duration: 1, notes: [{ string: 6, fret: 0 }] })),
}));

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  // Every test but the intro's own starts past the intro.
  localStorage.setItem("rq_backing_intro_seen", "1");
  analysisState.features = null;
  requestAutoSync.mockReset();
});

const renderEditor = (
  controller = buildController(),
  props: Partial<React.ComponentProps<typeof BackingTrackEditor>> = {},
) =>
  render(
    <BackingTrackEditor controller={controller} beatsPerBar={4} onClose={vi.fn()} {...props} />,
  );

describe("BackingTrackEditor without a recording", () => {
  it("asks for the song's files first, and opens the picker", () => {
    const importTracks = vi.fn();
    renderEditor(buildController({ stems: [], importTracks }));

    expect(screen.getByText("Add the song's backing track")).toBeTruthy();
    // One in the empty state, one on the panel beside it.
    fireEvent.click(screen.getAllByRole("button", { name: "Add files" })[0]);

    expect(importTracks).toHaveBeenCalled();
  });

  it("says where backing tracks live on the web, and still offers the video", () => {
    renderEditor(buildController({ stems: [], desktopAvailable: false }));

    expect(screen.getByText("Backing tracks live in the desktop app")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add files" })).toBeNull();
    expect(screen.getByLabelText("YouTube link")).toBeTruthy();
  });
});

describe("BackingTrackEditor steps", () => {
  it("starts with bar 1", () => {
    renderEditor();

    expect(screen.getByText("Step 1 of 2")).toBeTruthy();
    expect(screen.getByText(/drag the yellow Bar 1 line/i)).toBeTruthy();
  });

  it("moves on to listening once bar 1 has been placed", () => {
    renderEditor(
      buildController({ alignment: { offsetMs: 140, sourceBpm: 120, volume: 0.8, muted: false } }),
    );

    expect(screen.getByText("Step 2 of 2")).toBeTruthy();
    expect(screen.getByText(/Press Play and listen/)).toBeTruthy();
  });
});

describe("BackingTrackEditor sync numbers", () => {
  it("moves every bar later, and further with Shift", () => {
    const setAlignment = vi.fn();
    renderEditor(
      buildController({
        setAlignment,
        alignment: { offsetMs: 100, sourceBpm: 120, volume: 0.8, muted: false },
      }),
    );

    fireEvent.click(screen.getByLabelText("Move all bars later"));
    fireEvent.click(screen.getByLabelText("Move all bars earlier"), { shiftKey: true });

    expect(setAlignment).toHaveBeenNthCalledWith(1, { offsetMs: 120 }, { realign: true });
    expect(setAlignment).toHaveBeenNthCalledWith(2, { offsetMs: 0 }, { realign: true });
  });

  it("carries pinned bars along, so moving everything never bends the tempo", () => {
    const setAlignment = vi.fn();
    renderEditor(
      buildController({
        setAlignment,
        alignment: {
          offsetMs: 100,
          sourceBpm: 120,
          volume: 0.8,
          muted: false,
          tempoAnchors: [{ beat: 16, sec: 8.2 }],
        },
      }),
    );

    fireEvent.click(screen.getByLabelText("Move all bars later"));

    const [patch, options] = setAlignment.mock.calls[0];
    expect(patch.offsetMs).toBe(120);
    expect(patch.tempoAnchors[0].beat).toBe(16);
    expect(patch.tempoAnchors[0].sec).toBeCloseTo(8.22, 9);
    expect(options).toEqual({ realign: true });
  });

  it("moves every bar as far as the handle is dragged", () => {
    // 1000 px across a 4 s window: 4 ms a pixel.
    const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
    const setAlignment = vi.fn();
    renderEditor(
      buildController({
        setAlignment,
        alignment: { offsetMs: 100, sourceBpm: 120, volume: 0.8, muted: false },
      }),
    );

    const handle = screen.getByText("Drag here to move all bars").closest("button") as HTMLButtonElement;
    fireEvent.pointerDown(handle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 225, pointerId: 1 });

    expect(setAlignment).toHaveBeenLastCalledWith({ offsetMs: 200 }, { realign: true });
    width.mockRestore();
  });

  it("takes a typed start", () => {
    const setAlignment = vi.fn();
    renderEditor(buildController({ setAlignment }));

    const input = screen.getByLabelText("Move all bars");
    fireEvent.change(input, { target: { value: "-250" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(setAlignment).toHaveBeenCalledWith({ offsetMs: -250 }, { realign: true });
  });

  it("moves the session tempo with the recording's, so the recording is not re-pitched", () => {
    const setAlignment = vi.fn();
    const onSessionBpmChange = vi.fn();
    renderEditor(buildController({ setAlignment }), { onSessionBpmChange });

    const input = screen.getByLabelText("Recording tempo");
    fireEvent.change(input, { target: { value: "117,5" } });
    fireEvent.blur(input);

    expect(setAlignment).toHaveBeenCalledWith({ sourceBpm: 117.5 }, { realign: true });
    expect(onSessionBpmChange).toHaveBeenCalledWith(117.5);
  });

  it("counts pinned bars and lets them all go at once", () => {
    const setAlignment = vi.fn();
    renderEditor(
      buildController({
        setAlignment,
        alignment: {
          offsetMs: 100,
          sourceBpm: 120,
          volume: 0.8,
          muted: false,
          tempoAnchors: [
            { beat: 16, sec: 8.2 },
            { beat: 32, sec: 16.5 },
          ],
        },
      }),
    );

    expect(screen.getByText("2 bars")).toBeTruthy();
    fireEvent.click(screen.getByText("Unpin all"));

    expect(setAlignment).toHaveBeenCalledWith({ tempoAnchors: [] }, { realign: true });
  });
});

describe("BackingTrackEditor recordings", () => {
  it("mutes and removes a file from the song", () => {
    const setStem = vi.fn();
    const removeStem = vi.fn();
    renderEditor(buildController({ setStem, removeStem }));

    fireEvent.click(screen.getByLabelText("Mute Highway to Hell"));
    fireEvent.click(screen.getByLabelText("Remove Highway to Hell from this song"));

    expect(setStem).toHaveBeenCalledWith("bt_1", { muted: true });
    expect(removeStem).toHaveBeenCalledWith("bt_1");
  });

  it("offers solo only when there is more than one layer to solo against", () => {
    renderEditor();
    expect(screen.queryByLabelText("Solo Highway to Hell")).toBeNull();
    cleanup();

    const soloStem = vi.fn();
    renderEditor(
      buildController({
        soloStem,
        library: [
          ...buildController().library,
          { id: "bt_2", name: "Drums", fileName: "Drums.wav", ext: ".wav", mimeType: "audio/wav", size: 1, importedAt: 0 },
        ],
        stems: [
          { trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 },
          { trackId: "bt_2", volume: 1, muted: false, offsetMs: 0 },
        ],
      }),
    );
    fireEvent.click(screen.getByLabelText("Solo Drums"));

    expect(soloStem).toHaveBeenCalledWith("bt_2");
  });

  it("brings back a file added to another song", () => {
    const addStem = vi.fn();
    renderEditor(
      buildController({
        addStem,
        stems: [],
        library: [
          { id: "bt_9", name: "Thunderstruck", fileName: "t.mp3", ext: ".mp3", mimeType: "audio/mpeg", size: 1, importedAt: 0 },
        ],
      }),
    );

    fireEvent.click(screen.getByText("Added to other songs (1)"));
    fireEvent.click(screen.getByLabelText("Add Thunderstruck to this song"));

    expect(addStem).toHaveBeenCalledWith("bt_9");
  });
});

describe("BackingTrackEditor video", () => {
  it("refuses a link that isn't YouTube", () => {
    const setYouTubeVideoId = vi.fn();
    renderEditor(buildController({ setYouTubeVideoId }));

    fireEvent.change(screen.getByLabelText("YouTube link"), { target: { value: "not a link" } });
    fireEvent.click(screen.getByRole("button", { name: "Add video" }));

    expect(setYouTubeVideoId).not.toHaveBeenCalled();
    expect(screen.getByText(/isn't a YouTube link/)).toBeTruthy();
  });

  it("takes a YouTube link", () => {
    const setYouTubeVideoId = vi.fn();
    renderEditor(buildController({ setYouTubeVideoId }));

    fireEvent.change(screen.getByLabelText("YouTube link"), {
      target: { value: "https://youtu.be/l482T0yNkeo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add video" }));

    expect(setYouTubeVideoId).toHaveBeenCalledWith("l482T0yNkeo");
  });

  it("moves the picture on its own sync, never the sound", () => {
    const setAlignment = vi.fn();
    const setVideoAlignment = vi.fn();
    renderEditor(buildController({ youtubeVideoId: "abc123", setAlignment, setVideoAlignment }));

    fireEvent.click(screen.getByLabelText("Video start later"));

    expect(setVideoAlignment).toHaveBeenCalledWith({ offsetMs: 20 });
    expect(setAlignment).not.toHaveBeenCalled();
  });

  it("copies the recording's sync onto a video of the same take", () => {
    const setVideoAlignment = vi.fn();
    const tempoAnchors = [{ beat: 16, sec: 9 }];
    renderEditor(
      buildController({
        youtubeVideoId: "abc123",
        setVideoAlignment,
        alignment: { offsetMs: 300, sourceBpm: 118, volume: 0.8, muted: false, tempoAnchors },
      }),
    );

    fireEvent.click(screen.getByText("Same as the backing track"));

    expect(setVideoAlignment).toHaveBeenCalledWith(
      { offsetMs: 300, sourceBpm: 118, tempoAnchors },
      { realign: true },
    );
  });

  it("hides the video from the session", () => {
    const setVideoOverlay = vi.fn();
    renderEditor(buildController({ youtubeVideoId: "abc123", setVideoOverlay }));

    fireEvent.click(screen.getByRole("switch", { name: "Show above the tab" }));

    expect(setVideoOverlay).toHaveBeenCalledWith(false);
  });
});

describe("BackingTrackEditor keys", () => {
  it("closes on Escape and plays on Space", () => {
    const onClose = vi.fn();
    const onTogglePlay = vi.fn();
    renderEditor(buildController(), { onClose, onTogglePlay });

    fireEvent.keyDown(window, { code: "Space", key: " " });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lets Space type a space in a field", () => {
    const onTogglePlay = vi.fn();
    renderEditor(buildController(), { onTogglePlay });

    fireEvent.keyDown(screen.getByLabelText("YouTube link"), { code: "Space", key: " " });

    expect(onTogglePlay).not.toHaveBeenCalled();
  });
});

/**
 * The editor over a controller that actually keeps its alignment, so what
 * automatic sync writes is what the next render reads.
 */
function StatefulEditor(props: Partial<React.ComponentProps<typeof BackingTrackEditor>>) {
  const [alignment, setAlignmentState] = useState<BackingAlignment>({
    offsetMs: 0,
    sourceBpm: 120,
    volume: 0.8,
    muted: false,
  });
  const controller = buildController({
    alignment,
    setAlignment: (patch) => setAlignmentState((previous) => ({ ...previous, ...patch })),
  });
  return (
    <>
      <span data-testid='alignment'>{`${alignment.offsetMs}|${alignment.sourceBpm}`}</span>
      <BackingTrackEditor
        controller={controller}
        beatsPerBar={4}
        measures={MEASURES}
        onClose={vi.fn()}
        {...props}
      />
    </>
  );
}

describe("BackingTrackEditor intro", () => {
  it("explains the idea before the editor is first used, and only once", () => {
    localStorage.removeItem("rq_backing_intro_seen");
    renderEditor();

    expect(screen.getByText("Play along with the real song")).toBeTruthy();
    expect(screen.getByText("Add a YouTube video, if you like")).toBeTruthy();
    fireEvent.click(screen.getByText("Let's go"));

    expect(screen.queryByText("Play along with the real song")).toBeNull();
    expect(localStorage.getItem("rq_backing_intro_seen")).toBe("1");
    cleanup();

    renderEditor();
    expect(screen.queryByText("Play along with the real song")).toBeNull();
  });

  it("comes back on request", () => {
    renderEditor();

    fireEvent.click(screen.getByText("How it works"));

    expect(screen.getByText("Play along with the real song")).toBeTruthy();
  });

  it("is what Escape closes while it is up, not the editor", () => {
    localStorage.removeItem("rq_backing_intro_seen");
    const onClose = vi.fn();
    renderEditor(buildController(), { onClose });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByText("Play along with the real song")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("says where the files live when there is no desktop app", () => {
    localStorage.removeItem("rq_backing_intro_seen");
    renderEditor(buildController({ desktopAvailable: false, stems: [] }));

    expect(screen.getByText(/this part works in the desktop app/)).toBeTruthy();
  });
});

describe("BackingTrackEditor automatic sync", () => {
  it("analyses the recording on demand, and says so while it does", async () => {
    render(<StatefulEditor />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync automatically" }));
    });

    const button = screen.getByRole("button", { name: "Analysing the recording…" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(requestAutoSync).not.toHaveBeenCalled();
  });

  it("applies a confident result, takes the session tempo with it, and can undo it", async () => {
    analysisState.features = FEATURES;
    requestAutoSync.mockResolvedValue({
      offsetMs: 1234,
      sourceBpm: 117,
      tempoAnchors: [{ beat: 32, sec: 17.7 }],
      confident: true,
      hitRate: 0.92,
    });
    const onSessionBpmChange = vi.fn();
    const onSeekToBeat = vi.fn();
    render(
      <StatefulEditor
        sessionBpm={120}
        onSessionBpmChange={onSessionBpmChange}
        onSeekToBeat={onSeekToBeat}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync automatically" }));
    });

    expect(requestAutoSync).toHaveBeenCalledWith(
      expect.objectContaining({ features: FEATURES, beatsPerBar: 4, nominalBpm: 120 }),
    );
    expect(screen.getByTestId("alignment").textContent).toBe("1234|117");
    expect(screen.getByText(/Synced: bar 1 at 1.23 s, 117.0 BPM/)).toBeTruthy();
    expect(screen.getByText(/Drift followed at 1 bar/)).toBeTruthy();
    expect(onSessionBpmChange).toHaveBeenLastCalledWith(117);
    expect(onSeekToBeat).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText("Undo"));

    expect(screen.getByTestId("alignment").textContent).toBe("0|120");
    expect(onSessionBpmChange).toHaveBeenLastCalledWith(120);
  });

  it("asks before using a result it is not sure of", async () => {
    analysisState.features = FEATURES;
    requestAutoSync.mockResolvedValue({
      offsetMs: 900,
      sourceBpm: 118,
      tempoAnchors: [],
      confident: false,
      hitRate: 0.31,
    });
    render(<StatefulEditor />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync automatically" }));
    });

    expect(screen.getByText(/point to different places/)).toBeTruthy();
    expect(screen.getByTestId("alignment").textContent).toBe("0|120");

    fireEvent.click(screen.getByText("Use it anyway"));

    expect(screen.getByTestId("alignment").textContent).toBe("900|118");
  });

  it("says when the tab only covers part of the recording", async () => {
    analysisState.features = FEATURES;
    requestAutoSync.mockResolvedValue({
      offsetMs: 900,
      sourceBpm: 118,
      tempoAnchors: [],
      confident: false,
      hitRate: 0.9,
      coverage: 0.21,
    });
    render(<StatefulEditor />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync automatically" }));
    });

    expect(screen.getByText(/covers only about 21% of the recording/)).toBeTruthy();
  });

  it("listens for the whole band in the file, not just the guitar", async () => {
    analysisState.features = FEATURES;
    requestAutoSync.mockResolvedValue({
      offsetMs: 0,
      sourceBpm: 120,
      tempoAnchors: [],
      confident: false,
      hitRate: 0,
    });
    const drums = {
      trackType: "drums" as const,
      measures: MEASURES.map((measure) => ({
        beats: measure.beats.map((beat) => ({ ...beat, notes: [{ string: 1, fret: 0, midiNote: 36 }] })),
      })),
    };
    render(<StatefulEditor syncTracks={[{ trackType: "guitar", measures: MEASURES }, drums]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync automatically" }));
    });

    const bands = new Set(requestAutoSync.mock.calls[0][0].events.map((event: { band: string }) => event.band));
    expect(bands).toEqual(new Set(["mid", "low"]));
  });

  it("drops the undo once a line has been moved by hand", async () => {
    analysisState.features = FEATURES;
    requestAutoSync.mockResolvedValue({
      offsetMs: 1234,
      sourceBpm: 117,
      tempoAnchors: [],
      confident: true,
      hitRate: 0.9,
    });
    render(<StatefulEditor />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync automatically" }));
    });

    fireEvent.click(screen.getByLabelText("Move all bars later"));

    expect(screen.queryByText("Undo")).toBeNull();
  });
});
