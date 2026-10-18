import { describe, expect, it } from "vitest";

import { synthesize } from "../testing/synthAudio";
import type { TabSourceMeasure } from "./alignment";
import { tabNoteEvents } from "./alignment";
import { analyseRecording } from "./audioFeatures";
import { autoSync, syncEventsFromTab, syncEventsFromTracks } from "./autoSync";
import type { TempoAnchor } from "./tempoMap";
import { createRecordingTempoMap } from "./tempoMap";

const OPEN = [64, 59, 55, 50, 45, 40];
type Note = [string: number, fret: number];
const slot = (duration: number, ...notes: Note[]) => ({
  duration,
  notes: notes.map(([string, fret]) => ({ string, fret })),
});

/**
 * 24 bars in three sections that sound different: a power-chord riff, open
 * chords, then a lead line — so a bar early is a different place, the way it
 * is in a real song.
 */
function song(): TabSourceMeasure[] {
  const e5: Note[] = [[6, 0], [5, 2]];
  const g5: Note[] = [[6, 3], [5, 5]];
  const a5: Note[] = [[6, 5], [5, 7]];
  const riff = {
    beats: [slot(0.5, ...e5), slot(0.5, ...e5), slot(0.5), slot(0.5, ...e5), slot(0.5, ...g5), slot(0.5), slot(0.5, ...a5), slot(0.5, ...a5)],
  };
  const d: Note[] = [[4, 0], [3, 2], [2, 3]];
  const c: Note[] = [[5, 3], [4, 2], [3, 0]];
  const g: Note[] = [[6, 3], [5, 2], [4, 0]];
  const chords = [d, c, g, c].map((chord) => ({
    beats: [slot(1, ...chord), slot(0.5, ...chord), slot(0.5), slot(1, ...chord), slot(1, ...chord)],
  }));
  const lead = Array.from({ length: 8 }, (_, bar) => ({
    beats: [5, 7, 8, 10, 8, 7, 5, 3].map((fret, i) => slot(0.5, [i % 2 ? 2 : 1, (fret + bar) % 15])),
  }));
  return [
    ...Array.from({ length: 8 }, () => riff),
    ...Array.from({ length: 8 }, (_, bar) => chords[bar % 4]),
    ...lead,
  ];
}

/** Renders the tab as a band would play it, against a known tempo map. */
function perform(
  measures: TabSourceMeasure[],
  truth: ReturnType<typeof createRecordingTempoMap>,
  transpose = 0,
) {
  const notes = tabNoteEvents(measures).map((event) => ({
    sec: truth.secForBeat(event.beat),
    midi: event.notes.map((note) => OPEN[note.string - 1] + note.fret + transpose),
  }));
  const end = truth.secForBeat(24 * 4) + 1.5;
  return analyseRecording(synthesize(notes, end));
}

const measures = song();
const events = syncEventsFromTab(measures);
const input = (features: ReturnType<typeof analyseRecording>) => ({
  features,
  events,
  beatsPerBar: 4,
  nominalBpm: 120,
});

describe("autoSync", () => {
  it("finds bar 1 and the tempo of a steady recording", () => {
    const truth = createRecordingTempoMap({ anchors: [], offsetMs: 1234, sourceBpm: 117 });
    const result = autoSync(input(perform(measures, truth)));

    expect(Math.abs(result.offsetMs - 1234)).toBeLessThanOrEqual(8);
    expect(Math.abs(result.sourceBpm - 117)).toBeLessThanOrEqual(0.1);
    expect(result.tempoAnchors).toEqual([]);
    expect(result.confident).toBe(true);
    expect(result.hitRate).toBeGreaterThan(0.8);
  });

  it("follows a band that speeds up, pinning bars where it drifts", () => {
    // 114 BPM in bar 1, 124 by bar 24.
    const anchors: TempoAnchor[] = [];
    let sec = 0.8;
    for (let bar = 0; bar < 24; bar += 1) {
      sec += (4 * 60) / (114 + (10 * bar) / 23);
      anchors.push({ beat: (bar + 1) * 4, sec });
    }
    const truth = createRecordingTempoMap({ anchors, offsetMs: 800, sourceBpm: 114 });
    const result = autoSync(input(perform(measures, truth)));
    const found = createRecordingTempoMap({
      anchors: result.tempoAnchors,
      offsetMs: result.offsetMs,
      sourceBpm: result.sourceBpm,
    });

    expect(result.tempoAnchors.length).toBeGreaterThan(0);
    expect(result.confident).toBe(true);
    for (let bar = 0; bar <= 24; bar += 1) {
      expect(Math.abs(found.secForBeat(bar * 4) - truth.secForBeat(bar * 4))).toBeLessThanOrEqual(0.03);
    }
    // And the test is worth something: the opening tempo held as a straight
    // line misses the end badly.
    const straight = 0.8 + (24 * 4 * 60) / 114;
    expect(Math.abs(straight - truth.secForBeat(96))).toBeGreaterThan(0.08);
  });

  it("finds the guitar part inside a whole band", () => {
    const truth = createRecordingTempoMap({ anchors: [], offsetMs: 1777, sourceBpm: 121 });
    const guitar = tabNoteEvents(measures).map((event) => ({
      sec: truth.secForBeat(event.beat),
      midi: event.notes.map((note) => OPEN[note.string - 1] + note.fret),
    }));
    // A kit on every eighth — kick and bass on the beat, hats between — so
    // most of the attacks in the recording are not the tab's at all.
    const band = Array.from({ length: 24 * 8 }, (_, eighth) => ({
      sec: truth.secForBeat(eighth / 2),
      midi: eighth % 2 === 0 ? [28, 40] : [],
    }));
    const end = truth.secForBeat(96) + 1.5;
    const result = autoSync(input(analyseRecording(synthesize([...guitar, ...band], end))));

    expect(Math.abs(result.offsetMs - 1777)).toBeLessThanOrEqual(12);
    expect(Math.abs(result.sourceBpm - 121)).toBeLessThanOrEqual(0.15);
  });

  it("copes with a song tuned down a semitone", () => {
    const truth = createRecordingTempoMap({ anchors: [], offsetMs: 2100, sourceBpm: 123 });
    const result = autoSync(input(perform(measures, truth, -1)));

    expect(Math.abs(result.offsetMs - 2100)).toBeLessThanOrEqual(10);
    expect(Math.abs(result.sourceBpm - 123)).toBeLessThanOrEqual(0.15);
  });

  it("admits it when nothing in the recording matches", () => {
    const result = autoSync(input(analyseRecording(synthesize([], 40))));

    expect(result.confident).toBe(false);
  });

  it("gives up gracefully on a tab with nothing in it", () => {
    const result = autoSync({ ...input(analyseRecording(synthesize([], 5))), events: [] });

    expect(result).toMatchObject({ confident: false, tempoAnchors: [] });
  });
});

describe("syncEventsFromTracks", () => {
  const bar = (notes: { string: number; fret: number; midiNote?: number }[]) => ({
    beats: [{ duration: 4, notes }],
  });

  it("files each drum where it hits hardest", () => {
    const events = syncEventsFromTracks([
      { trackType: "drums", measures: [bar([{ string: 1, fret: 0, midiNote: 36 }, { string: 2, fret: 0, midiNote: 42 }])] },
    ]);
    expect(events.map((event) => event.band).sort()).toEqual(["high", "low"]);
    expect(events.every((event) => event.rhythmSection)).toBe(true);
  });

  it("takes the sounding pitch from the file, tuning and all", () => {
    // Fret 0 on the low string of a guitar tuned to D: the file says D (50 → 2).
    const [event] = syncEventsFromTracks([
      { trackType: "guitar", measures: [bar([{ string: 6, fret: 0, midiNote: 38 }])] },
    ]);
    expect(event).toMatchObject({ band: "mid", pitchClasses: [2], exactPitch: true });
  });

  it("reads a bass on bass strings, in the low band", () => {
    const [event] = syncEventsFromTracks([
      { trackType: "bass", measures: [bar([{ string: 4, fret: 0 }])] },
    ]);
    // String 4 of a bass is E — on a guitar it would have been D.
    expect(event).toMatchObject({ band: "low", pitchClasses: [4], rhythmSection: true });
  });

  it("leaves the vocals out", () => {
    expect(
      syncEventsFromTracks([{ trackType: "vocals", measures: [bar([{ string: 1, fret: 0, midiNote: 64 }])] }]),
    ).toEqual([]);
  });
});
