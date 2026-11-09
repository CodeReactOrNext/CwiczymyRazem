import { describe, expect, it } from "vitest";

import type { BarSegment, TrackEvent } from "./arrange";
import { bassBar, createRng, drumBar, keysBar } from "./arrange";
import type { BarInfo } from "./noteEvents";
import { chooseStyle, styleCandidates } from "./styles";
import type { Chord } from "./theory";

const BAR: BarInfo = {
  index: 0,
  start: 0,
  length: 4,
  timeSignature: [4, 4],
  accents: [],
};

const A_MINOR: Chord = { root: 9, quality: "min" };
const D_MINOR: Chord = { root: 2, quality: "min" };
const wholeBar: BarSegment[] = [
  {
    chord: A_MINOR,
    from: 0,
    to: 4,
    sinceChordStart: 0,
    next: D_MINOR,
    ends: true,
  },
];

const at = (events: TrackEvent[], midiNote: number) =>
  events
    .filter((event) => event.notes.some((note) => note.midiNote === midiNote))
    .map((event) => event.pos)
    .sort((a, b) => a - b);

describe("chooseStyle", () => {
  it("gives the same exercise the same style every time", () => {
    const first = chooseStyle("rock", 90, createRng("ex:style"));
    for (let i = 0; i < 5; i++)
      expect(chooseStyle("rock", 90, createRng("ex:style"))).toBe(first);
  });

  it("keeps the player's pick, but never restyles a boss", () => {
    expect(chooseStyle("rock", 90, createRng("x"), "house")).toBe("house");
    expect(chooseStyle("boss", 90, createRng("x"), "house")).toBe("ambient");
  });

  it("plays heavy riffs dark and only puts four on the floor at dance tempos", () => {
    expect(styleCandidates("metal", 140)).toEqual(["dark"]);
    expect(styleCandidates("doom", 70)).toEqual(["dark"]);
    expect(styleCandidates("ballad", 60)).not.toContain("house");
    expect(styleCandidates("rock", 120)).toContain("house");
    expect(styleCandidates("rock", 170)).not.toContain("house");
  });
});

describe("a style's own figures in 4/4", () => {
  const drums = (style: Parameters<typeof chooseStyle>[3]) =>
    drumBar(BAR, {
      groove: "rock",
      bpm: 120,
      isFill: false,
      isCrash: false,
      rng: createRng("figures"),
      style: style === "auto" ? undefined : style,
    });

  it("house: a kick on every beat, the clap on two and four, open hats off the beat", () => {
    const events = drums("house");
    expect(at(events, 36)).toEqual([0, 1, 2, 3]);
    expect(at(events, 38)).toEqual([1, 3]);
    expect(at(events, 46)).toEqual([0.5, 1.5, 2.5, 3.5]);
  });

  it("house: the bass sits between the kicks", () => {
    const events = bassBar(BAR, wholeBar, "rock", "groove", "house");
    expect(events.map((event) => event.pos)).toEqual([0.5, 1.5, 2.5, 3.5]);
  });

  it("synthwave: the bass pulses root and octave in eighths", () => {
    const events = bassBar(BAR, wholeBar, "rock", "groove", "synthwave");
    expect(events).toHaveLength(8);
    const frets = events
      .slice(0, 4)
      .map((event) => event.notes[0].string * 100 + event.notes[0].fret);
    expect(frets[0]).not.toBe(frets[1]);
    expect(frets[0]).toBe(frets[2]);
  });

  it("lofi: the electric piano comps on the one and the and of two", () => {
    const events = keysBar(BAR, wholeBar, "rock", { voices: null }, "lofi");
    expect(events.map((event) => event.pos)).toEqual([0, 1.5]);
  });

  it("leaves a waltz its own feel whatever band plays it", () => {
    const waltz: BarInfo = { ...BAR, length: 3, timeSignature: [3, 4] };
    const events = bassBar(
      waltz,
      [{ ...wholeBar[0], to: 3 }],
      "waltz",
      "groove",
      "house",
    );
    expect(events.map((event) => event.pos)).toEqual([0, 2]);
  });
});
