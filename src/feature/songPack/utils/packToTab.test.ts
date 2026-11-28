import { createRecordingTempoMap } from "feature/backingTrack/utils/tempoMap";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { SongPackBeat, SongPackNote, SongPackPart, SongPackTab } from "../types/songPack.types";
import { packToTab } from "./packToTab";

/** A beat grid: `bars` bars of `perBar` beats, each `secPerBeat` long, from `startSec`. */
const grid = (bars: number, secPerBeat: number, startSec = 0, perBar = 4): SongPackBeat[] =>
  Array.from({ length: bars * perBar }, (_, i) => ({ time: startSec + i * secPerBeat, bar: i % perBar === 0 }));

const part = (overrides: Partial<SongPackPart> = {}): SongPackPart => ({
  name: "Lead",
  kind: "guitar",
  stringCount: 6,
  tuning: [0, 0, 0, 0, 0, 0],
  capo: 0,
  beats: grid(2, 0.5, 1),
  sections: [],
  notes: [],
  ...overrides,
});

const pack = (...parts: SongPackPart[]): SongPackTab => ({
  format: 1, title: "Song", artist: "Band", lengthSec: 10, parts, audioTrackId: "bt_1",
});

const note = (time: number, string: number, fret: number, extra: Partial<SongPackNote> = {}): SongPackNote => ({
  time, string, fret, sustain: 0, ...extra,
});

const quartersIn = (measure: TablatureMeasure) => measure.beats.reduce((sum, beat) => sum + beat.duration, 0);

describe("packToTab", () => {
  it("lays the beat grid out as bars and says where they fall in the recording", () => {
    const { parsed, alignment } = packToTab(pack(part()));

    expect(parsed.tempo).toBe(120);
    expect(parsed.tracks[0].measures.map((measure) => measure.timeSignature)).toEqual([[4, 4], [4, 4]]);
    // Bar 1 is one second into the recording; a steady song needs one more pin, at its end.
    expect(alignment).toEqual({ offsetMs: 1000, sourceBpm: 120, tempoAnchors: [{ beat: 8, sec: 5 }] });
  });

  it("puts each note on the beat it is played on", () => {
    const { parsed } = packToTab(pack(part({
      notes: [note(1, 0, 3, { sustain: 0.5 }), note(2, 5, 0), note(2.25, 5, 2), note(3.5, 1, 7)],
    })));
    const [first, second] = parsed.tracks[0].measures;

    // Bar 1: a held quarter, a rest, then two eighths on beat 3 and a rest.
    expect(first.beats.map((beat) => [beat.duration, beat.notes.map((n) => n.fret)])).toEqual([
      [1, [3]], [1, []], [0.5, [0]], [1, [2]], [0.5, []],
    ]);
    // Bar 2 starts at 3s; a note at 3.5s is on its second beat.
    expect(second.beats[0]).toEqual({ notes: [], duration: 1 });
    expect(second.beats[1].notes[0].fret).toBe(7);
  });

  it("fills every bar exactly", () => {
    const notes = Array.from({ length: 40 }, (_, i) => note(1 + i * 0.097, i % 6, i % 12, { sustain: i % 3 ? 0 : 0.2 }));
    const { parsed } = packToTab(pack(part({ notes })));
    for (const measure of parsed.tracks[0].measures) expect(quartersIn(measure)).toBeCloseTo(4, 9);
  });

  it("numbers strings from the highest and gives every note its real pitch", () => {
    const { parsed } = packToTab(pack(part({
      tuning: [-2, 0, 0, 0, 0, 0],
      notes: [note(1, 0, 0), note(1.5, 5, 3)],
    })));
    const track = parsed.tracks[0];
    const played = track.measures[0].beats.flatMap((beat) => beat.notes);

    // Drop D: the low string is string 6 and sounds a D2.
    expect(played[0]).toMatchObject({ string: 6, fret: 0, midiNote: 38 });
    expect(played[1]).toMatchObject({ string: 1, fret: 3, midiNote: 67 });
    expect(track.openStringMidi).toEqual([64, 59, 55, 50, 45, 38]);
  });

  it("reads a bass as four strings", () => {
    const { parsed } = packToTab(pack(part({
      name: "Bass", kind: "bass", stringCount: 4, tuning: [0, 0, 0, 0], notes: [note(1, 0, 5), note(1.5, 3, 2)],
    })));
    const track = parsed.tracks[0];
    const played = track.measures[0].beats.flatMap((beat) => beat.notes);

    expect(track).toMatchObject({ trackType: "bass", stringCount: 4 });
    expect(played[0]).toMatchObject({ string: 4, midiNote: 33 });
    expect(played[1]).toMatchObject({ string: 1, midiNote: 45 });
  });

  it("gathers a chord into one beat and names it", () => {
    const { parsed } = packToTab(pack(part({
      notes: [note(1, 0, 0, { chord: "E5" }), note(1, 1, 2, { chord: "E5" }), note(1, 2, 2, { chord: "E5" })],
    })));
    const beat = parsed.tracks[0].measures[0].beats[0];
    expect(beat.chordName).toBe("E5");
    expect(beat.notes.map((n) => n.string)).toEqual([6, 5, 4]);
  });

  it("carries the techniques over", () => {
    const { parsed } = packToTab(pack(part({
      notes: [
        note(1, 2, 7, {
          sustain: 1, hammerOn: true, palmMute: true, vibrato: true, slideTo: 9,
          bends: [{ time: 1.5, step: 2 }, { time: 2, step: 0 }],
        }),
        note(2.5, 2, 5, { mute: true, pinchHarmonic: true, slideUnpitchTo: 2 }),
      ],
    })));
    const [bent, muted] = parsed.tracks[0].measures[0].beats.flatMap((beat) => beat.notes);

    expect(bent).toMatchObject({
      isHammerOn: true, isPalmMute: true, isVibrato: true, slideOut: 1, isBend: true, bendSemitones: 2, isRelease: true,
    });
    expect(bent.bendCurve).toEqual([{ position: 0, cents: 0 }, { position: 0.5, cents: 200 }, { position: 1, cents: 0 }]);
    expect(muted).toMatchObject({ isDead: true, harmonicType: 4, slideOut: 4 });
  });

  it("marks the bar a named section starts on", () => {
    const { parsed } = packToTab(pack(part({
      sections: [{ name: "intro", time: 1 }, { name: "noguitar", time: 2 }, { name: "chorus", time: 3 }],
    })));
    expect(parsed.tracks[0].measures.map((measure) => measure.section)).toEqual(["Intro", "Chorus"]);
  });

  it("follows a band that changes tempo", () => {
    // Two bars at 120, then two at 100.
    const beats = [...grid(2, 0.5, 0), ...grid(2, 0.6, 4)];
    const { parsed, alignment } = packToTab(pack(part({ beats, notes: [note(4 + 2 * 0.6, 0, 5)] })));
    const measures = parsed.tracks[0].measures;

    expect(alignment.tempoAnchors?.map((anchor) => anchor.beat)).toEqual([8, 16]);
    expect(alignment.tempoAnchors?.[0].sec).toBeCloseTo(4, 9);
    expect(alignment.tempoAnchors?.[1].sec).toBeCloseTo(8.8, 9);
    expect(measures[0].tempoChange).toBeCloseTo(1, 6);
    expect(measures[1].tempoChange).toBeUndefined();
    expect(measures[2].tempoChange).toBeCloseTo(100 / 120, 6);
    // A note two slow beats into bar 3 is on that bar's third beat.
    expect(measures[2].beats.map((beat) => beat.duration)).toEqual([2, 1, 1]);
    expect(measures[2].beats[1].notes[0].fret).toBe(5);
  });

  it("places notes where the recording has them, whatever the tempo does", () => {
    // A bar that slows down inside itself: the tab only pins bar lines, so each
    // note must still come back out at the second it was played, within a tick.
    const beats = [0, 0.5, 1.02, 1.58, 2.2, 2.7, 3.2, 3.7].map((time, i) => ({ time, bar: i % 4 === 0 }));
    const times = [0.31, 0.77, 1.4, 2.05, 2.95];
    const { parsed, alignment } = packToTab(pack(part({ beats, notes: times.map((time, i) => note(time, 0, i + 1)) })));
    const map = createRecordingTempoMap({ anchors: alignment.tempoAnchors, offsetMs: alignment.offsetMs, sourceBpm: alignment.sourceBpm });

    const played: { fret: number; sec: number }[] = [];
    let beat = 0;
    for (const measure of parsed.tracks[0].measures) {
      for (const tabBeat of measure.beats) {
        if (tabBeat.notes.length) played.push({ fret: tabBeat.notes[0].fret, sec: map.secForBeat(beat) });
        beat += tabBeat.duration;
      }
    }

    expect(played.map((p) => p.fret)).toEqual([1, 2, 3, 4, 5]);
    played.forEach((p, i) => expect(Math.abs(p.sec - times[i])).toBeLessThan(0.01));
  });

  it("uses the first part's beat grid for every part, so they share one clock", () => {
    const { parsed } = packToTab(pack(
      part(),
      part({ name: "Bass", kind: "bass", stringCount: 4, tuning: [0, 0, 0, 0], beats: grid(9, 0.25) }),
    ));
    expect(parsed.tracks.map((track) => track.measures.length)).toEqual([2, 2]);
  });

  it("refuses a package without a beat grid", () => {
    expect(() => packToTab(pack(part({ beats: [] })))).toThrow();
  });
});
