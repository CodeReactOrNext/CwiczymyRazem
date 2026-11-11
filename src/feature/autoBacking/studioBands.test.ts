import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { BarSegment, TrackEvent } from "./arrange";
import { bassBar, createRng, drumBar, keysBar } from "./arrange";
import { generateAutoBacking } from "./generateAutoBacking";
import type { GrooveId } from "./grooves";
import type { BarInfo } from "./noteEvents";
import type { StudioStyleId } from "./styles";
import {
  BAND_STYLES,
  chooseStyle,
  isBandStyle,
  isStudioStyle,
  STUDIO_STYLES,
  styleCandidates,
} from "./styles";
import type { Chord } from "./theory";

const BAR: BarInfo = {
  index: 0,
  start: 0,
  length: 4,
  timeSignature: [4, 4],
  accents: [],
};

const E_MINOR: Chord = { root: 4, quality: "min" };
const C_MAJOR: Chord = { root: 0, quality: "maj" };
const wholeBar: BarSegment[] = [
  {
    chord: E_MINOR,
    from: 0,
    to: 4,
    sinceChordStart: 0,
    next: C_MAJOR,
    ends: true,
  },
];

const GROOVES: GrooveId[] = [
  "rock",
  "pop",
  "ballad",
  "shuffle",
  "metal",
  "thrash",
  "halftime",
  "doom",
];

const drums = (style: StudioStyleId, groove: GrooveId = "rock") =>
  drumBar(BAR, {
    groove,
    bpm: 100,
    isFill: false,
    isCrash: false,
    rng: createRng("studio"),
    style,
  });

const positions = (events: TrackEvent[], midiNote: number) =>
  events
    .filter((event) => event.notes.some((note) => note.midiNote === midiNote))
    .map((event) => Math.round(event.pos * 1000) / 1000)
    .sort((a, b) => a - b);

const shape = (events: TrackEvent[]) =>
  events
    .map(
      (event) =>
        `${event.pos.toFixed(3)}:${event.notes.map((n) => n.midiNote ?? `${n.string}/${n.fret}`).join("+")}`,
    )
    .sort()
    .join(" ");

describe("the session bands", () => {
  it("are not styles a player can pick, keep or be dealt", () => {
    for (const style of STUDIO_STYLES) {
      expect(BAND_STYLES as readonly string[]).not.toContain(style);
      // What the volume menu's store accepts from a saved setting.
      expect(isBandStyle(style)).toBe(false);
      expect(isStudioStyle(style)).toBe(true);
    }
    for (const groove of GROOVES)
      for (const bpm of [60, 90, 120, 150, 190]) {
        const candidates: readonly string[] = styleCandidates(groove, bpm);
        for (const style of STUDIO_STYLES)
          expect(candidates).not.toContain(style);
        for (let i = 0; i < 40; i++)
          expect(
            isStudioStyle(chooseStyle(groove, bpm, createRng(`draw-${i}`))),
          ).toBe(false);
      }
  });

  it("play when an exercise names one, whatever the player picked", () => {
    for (const style of STUDIO_STYLES)
      expect(chooseStyle("rock", 100, createRng("x"), style)).toBe(style);
  });

  it("each play a beat of their own", () => {
    const beats = STUDIO_STYLES.map((style) => shape(drums(style)));
    expect(new Set(beats).size).toBe(STUDIO_STYLES.length);
  });

  it("each play a bass line and a chord rhythm of their own", () => {
    const lines = STUDIO_STYLES.map((style) =>
      shape(bassBar(BAR, wholeBar, "rock", "groove", style)),
    );
    expect(new Set(lines).size).toBe(STUDIO_STYLES.length);
    const comps = STUDIO_STYLES.map((style) =>
      keysBar(BAR, wholeBar, "rock", { voices: null }, style)
        .map((event) => event.pos.toFixed(3))
        .join(" "),
    );
    expect(new Set(comps).size).toBe(STUDIO_STYLES.length);
  });

  it("keep their feel whatever groove the part over them reads as", () => {
    for (const style of STUDIO_STYLES) {
      const home = shape(drums(style, "rock"));
      // The kit's random ghost notes aside, the same seed gives the same bar.
      for (const groove of GROOVES)
        expect(shape(drums(style, groove))).toBe(home);
    }
  });

  it("stay inside the bar", () => {
    for (const style of STUDIO_STYLES) {
      const all = [
        ...drums(style),
        ...bassBar(BAR, wholeBar, "rock", "groove", style),
        ...keysBar(BAR, wholeBar, "rock", { voices: null }, style),
      ];
      expect(all.length).toBeGreaterThan(0);
      for (const event of all) {
        expect(event.pos).toBeGreaterThanOrEqual(0);
        expect(event.pos).toBeLessThan(4);
        if (event.length !== undefined)
          expect(event.pos + event.length).toBeLessThanOrEqual(4 + 1e-6);
      }
    }
  });

  it("shuffle in the juke joint and gallop in the forge", () => {
    // The ride on every beat and on the last triplet of it.
    expect(positions(drums("juke"), 51)).toEqual([
      0, 0.667, 1, 1.667, 2, 2.667, 3, 3.667,
    ]);
    // Double kick everywhere but under the snare.
    const kicks = positions(drums("forge"), 36);
    expect(kicks).toHaveLength(14);
    expect(kicks).not.toContain(1);
    expect(kicks).not.toContain(3);
    expect(positions(drums("forge"), 38)).toEqual([1, 3]);
  });

  it("put the rhythm guitars on power chords, down where a guitar plays them", () => {
    for (const style of ["garage", "forge"] as const) {
      const [first] = keysBar(BAR, wholeBar, "rock", { voices: null }, style);
      // E2, B2, E3.
      expect(first.notes.map((note) => note.midiNote)).toEqual([40, 47, 52]);
    }
    const [organ] = keysBar(BAR, wholeBar, "rock", { voices: null }, "juke");
    expect(
      Math.min(...organ.notes.map((note) => note.midiNote!)),
    ).toBeGreaterThan(51);
  });
});

/** Four bars of a riff in E minor that names its chords, as a session part does. */
const part = (chords: string[]): TablatureMeasure[] =>
  chords.map((chordName) => ({
    timeSignature: [4, 4],
    beats: [0, 3, 5, 7, 5, 3, 0, 3].map((fret, i) => ({
      duration: 0.5,
      notes: [{ string: 6, fret }],
      ...(i === 0 && { chordName }),
    })),
  }));

describe("a session part's backing", () => {
  const CHORDS = ["Em", "C", "G", "D"];

  it("is played by the band the part names, over the chords it names", () => {
    for (const style of STUDIO_STYLES) {
      const backing = generateAutoBacking({
        measures: part(CHORDS),
        bpm: 100,
        seed: "session",
        style,
      })!;
      expect(backing.summary.style).toBe(style);
      expect(backing.summary.source).toBe("tab");
      expect(backing.summary.chords).toEqual(CHORDS);
      for (const track of backing.tracks) expect(track.bandStyle).toBe(style);
      // A full band and nothing on top: drums, bass and its own instrument.
      expect(backing.tracks.map((track) => track.trackType)).toEqual([
        "drums",
        "bass",
        "keys",
      ]);
    }
  });

  it("starts with the whole band: a take has no bars to wait through", () => {
    const backing = generateAutoBacking({
      measures: part(CHORDS),
      bpm: 100,
      seed: "session",
      style: "garage",
    })!;
    const drumTrack = backing.tracks.find((t) => t.trackType === "drums")!;
    expect(drumTrack.measures[0].firstLoopOnly).toBeUndefined();
    expect(drumTrack.measures[0].beats.some((beat) => beat.notes.length)).toBe(
      true,
    );
  });

  it("reads a diminished chord's name", () => {
    const backing = generateAutoBacking({
      measures: part(["Em", "F#dim", "G", "D"]),
      bpm: 100,
      seed: "session",
      style: "loft",
    })!;
    expect(backing.summary.chords[1]).toMatch(/^F#(dim|°|m7b5)/);
  });

  it("keeps every bar of every track four beats long", () => {
    for (const style of STUDIO_STYLES) {
      const backing = generateAutoBacking({
        measures: part(CHORDS),
        bpm: 132,
        seed: `bars-${style}`,
        style,
      })!;
      for (const track of backing.tracks)
        for (const measure of track.measures)
          expect(
            measure.beats.reduce((sum, beat) => sum + beat.duration, 0),
          ).toBeCloseTo(4, 5);
    }
  });
});
