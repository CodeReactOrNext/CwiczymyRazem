import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadScoreFromBytes, playedBars } = vi.hoisted(() => ({
  loadScoreFromBytes: vi.fn(),
  /** What AlphaTab's generator reports as played; null = it isn't available. */
  playedBars: { current: null as null | { index: number; start: number; tempo?: [number, number][] }[] },
}));

vi.mock("@coderline/alphatab", () => ({
  importer: { ScoreLoader: { loadScoreFromBytes } },
  midi: {
    MidiFileGenerator: class {
      tickLookup = { masterBars: [] as unknown[] };
      generate() {
        if (!playedBars.current) throw new Error("no generator");
        this.tickLookup.masterBars = playedBars.current.map((bar) => ({
          masterBar: { index: bar.index },
          start: bar.start,
          tempoChanges: (bar.tempo ?? []).map(([tick, tempo]) => ({ tick, tempo })),
        }));
      }
    },
  },
  Settings: class {
    importer = { encoding: "utf-8" };
  },
}));

import { parseGpFile } from "./gp5Parser.service";

/** A score as AlphaTab hands it over, with tracks that have no bars. */
const scoreWithTracks = (...names: string[]) => ({
  tempo: 120,
  tracks: names.map((name) => ({ name, staves: [{ bars: [] }] })),
});

const file = () => new File([new Uint8Array([1, 2, 3])], "song.gp5");

/** A one-track 4/4 score at 100 BPM whose bar N holds a single whole note on fret N. */
const scoreWithBars = (count: number, automations: Record<number, { value: number; ratioPosition: number }[]> = {}) => {
  const masterBars = Array.from({ length: count }, (_, index) => ({
    index,
    start: index * 3840,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    calculateDuration: () => 3840,
    tempoAutomations: (automations[index] ?? []).map((a) => ({ type: 0, ...a })),
  }));
  const bars = masterBars.map((masterBar) => ({
    masterBar,
    voices: [{ beats: [{ displayDuration: 3840, notes: [{ fret: masterBar.index, string: 1 }] }] }],
  }));
  return { tempo: 100, masterBars, tracks: [{ name: "Lead", staves: [{ stringCount: 6, bars }] }] };
};

const fretsOf = (parsed: Awaited<ReturnType<typeof parseGpFile>>) =>
  parsed.tracks[0].measures.map((m) => m.beats[0].notes[0].fret);

describe("parseGpFile", () => {
  beforeEach(() => {
    loadScoreFromBytes.mockReset();
    playedBars.current = null;
  });

  it("lays the bars out in the order AlphaTab plays them, repeats included", async () => {
    loadScoreFromBytes.mockReturnValue(scoreWithBars(3));
    // Bars 0–1 repeated, then bar 2.
    playedBars.current = [0, 1, 0, 1, 2].map((index, i) => ({ index, start: i * 3840, tempo: [[i * 3840, 100]] }));
    const parsed = await parseGpFile(file());
    const { measures } = parsed.tracks[0];

    expect(fretsOf(parsed)).toEqual([0, 1, 0, 1, 2]);
    // Where each one is written, for the notation view.
    expect(measures.map((m) => m.scoreBeat)).toEqual([0, 4, 0, 4, 8]);
    // The second pass is its own bar, not the first one again.
    expect(measures[2].beats).not.toBe(measures[0].beats);
    expect(measures.map((m) => m.tempoChange)).toEqual([1, undefined, undefined, undefined, undefined]);
  });

  it("carries tempo changes from inside a bar and restates the tempo after it", async () => {
    loadScoreFromBytes.mockReturnValue(scoreWithBars(3));
    playedBars.current = [
      { index: 0, start: 0, tempo: [[0, 100]] },
      { index: 1, start: 3840, tempo: [[3840, 100], [3840 + 2880, 50], [3840 + 3360, 200]] },
      { index: 2, start: 7680, tempo: [[7680, 200]] },
    ];
    const { measures } = (await parseGpFile(file())).tracks[0];

    expect(measures[1].tempoChange).toBeUndefined();
    expect(measures[1].tempoShifts).toEqual([{ at: 3, ratio: 0.5 }, { at: 3.5, ratio: 2 }]);
    expect(measures[2].tempoChange).toBe(2);
    // Nothing was unfolded, so no bar needs to say where it is written.
    expect(measures.every((m) => m.scoreBeat === undefined)).toBe(true);
  });

  it("reads the bars as written, with their tempo, when AlphaTab can't say how they play", async () => {
    loadScoreFromBytes.mockReturnValue(
      scoreWithBars(3, { 1: [{ value: 50, ratioPosition: 0.5 }, { value: 150, ratioPosition: 0.75 }] }),
    );
    const parsed = await parseGpFile(file());
    const { measures } = parsed.tracks[0];

    expect(fretsOf(parsed)).toEqual([0, 1, 2]);
    expect(measures[0].tempoChange).toBe(1);
    expect(measures[1].tempoShifts).toEqual([{ at: 2, ratio: 0.5 }, { at: 3, ratio: 1.5 }]);
    expect(measures[2].tempoChange).toBe(1.5);
  });

  it("marks the bar each section starts on, once per pass through it", async () => {
    const score = scoreWithBars(4) as ReturnType<typeof scoreWithBars> & {
      masterBars: { section?: { text: string; marker?: string } }[];
    };
    score.masterBars[0].section = { text: "[Intro]" };
    score.masterBars[2].section = { text: " Solo " };
    score.masterBars[3].section = { text: "  " };
    loadScoreFromBytes.mockReturnValue(score);
    // Bars 0–1 twice, 2–3, then back to the top for one more bar.
    playedBars.current = [0, 1, 0, 1, 2, 3, 0].map((index, i) => ({ index, start: i * 3840, tempo: [[i * 3840, 100]] }));
    const { measures } = (await parseGpFile(file())).tracks[0];

    expect(measures.map((m) => m.section)).toEqual([
      "Intro", undefined, undefined, undefined, "Solo", undefined, "Intro",
    ]);
  });

  it("fills a bar the track has no entry for with a whole rest", async () => {
    const score = scoreWithBars(3);
    score.tracks[0].staves[0].bars.splice(1, 1);
    loadScoreFromBytes.mockReturnValue(score);
    const { measures } = (await parseGpFile(file())).tracks[0];

    expect(measures).toHaveLength(3);
    expect(measures[1].beats).toEqual([{ notes: [], duration: 4 }]);
  });

  it("reads the file once when its names decode as UTF-8", async () => {
    loadScoreFromBytes.mockReturnValue(scoreWithTracks("Lead", "Rhythm"));
    const parsed = await parseGpFile(file());
    expect(parsed.tracks.map((t) => t.name)).toEqual(["Lead", "Rhythm"]);
    expect(loadScoreFromBytes).toHaveBeenCalledTimes(1);
  });

  it("reads it again as Windows-1252 when UTF-8 leaves broken characters in a name", async () => {
    loadScoreFromBytes
      .mockReturnValueOnce(scoreWithTracks("Sp�r 1", "Slagverk"))
      .mockReturnValueOnce(scoreWithTracks("Spår 1", "Slagverk"));
    const parsed = await parseGpFile(file());
    expect(parsed.tracks.map((t) => t.name)).toEqual(["Spår 1", "Slagverk"]);
    expect(loadScoreFromBytes).toHaveBeenLastCalledWith(
      expect.any(Uint8Array),
      expect.objectContaining({ importer: { encoding: "windows-1252" } }),
    );
  });
});
