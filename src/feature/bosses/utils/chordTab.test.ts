import { parseChordSymbol } from "feature/autoBacking/harmonize";
import { chordTonesOf } from "feature/autoBacking/theory";
import { getFrequencyFromTab } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { CHORD_SHAPES, COLOSSUS } from "../data/colossus";
import type { ChordVariation } from "../types/boss.types";
import { dealUnits } from "./chordPhaseGenerator";
import {
  buildChordPhaseExercise,
  buildChordTablature,
  changeKey,
  changesOf,
  chordNotes,
  chordToneCount,
  chordUnitOf,
} from "./chordTab";

const variation = (units = dealUnits(["G", "C"], 2, 2, [1])): ChordVariation => ({
  bpm: 80,
  family: "open",
  progression: ["G", "C"],
  beatsPerChord: 2,
  units,
});

describe("chordNotes", () => {
  it("plays every string the shape frets or leaves open, low string first, muted ones left out", () => {
    expect(chordNotes("C")).toEqual([
      { string: 5, fret: 3 },
      { string: 4, fret: 2 },
      { string: 3, fret: 0 },
      { string: 2, fret: 1 },
      { string: 1, fret: 0 },
    ]);
    expect(chordNotes("E5")).toHaveLength(3);
    expect(chordNotes("H13")).toEqual([]);
  });
});

describe("buildChordTablature", () => {
  it("strums each chord once, named, in whole 4/4 bars", () => {
    const tab = buildChordTablature(variation());
    expect(tab).toHaveLength(2);
    for (const bar of tab) expect(bar.beats.reduce((sum, b) => sum + b.duration, 0)).toBe(4);
    expect(tab[0].beats.map((b) => b.chordName)).toEqual(["G", "C"]);
    expect(tab[1].beats.map((b) => b.duration)).toEqual([1, 1, 1, 1]);
    expect(tab[0].beats[0].pickStroke).toBe("down");
    expect(tab[0].beats[0].notes).toEqual(chordNotes("G"));
  });
});

describe("chordUnitOf", () => {
  it("traces a matcher note key back to its strum", () => {
    const v = variation();
    expect(chordUnitOf(v, "0-0-3")).toBe(0);
    expect(chordUnitOf(v, "0-1-0")).toBe(1);
    expect(chordUnitOf(v, "1-0-2")).toBe(2);
    expect(chordUnitOf(v, "1-3-0")).toBe(5);
    expect(chordUnitOf(v, "4-0-0")).toBeNull();
    expect(chordToneCount(v, 1)).toBe(chordNotes("C").length);
  });
});

describe("changes", () => {
  it("names the change into each strum, the loop's seam included", () => {
    const v = variation();
    expect(changeKey(v, 0)).toBe("C>G");
    expect(changeKey(v, 1)).toBe("G>C");
    expect(changesOf(v)).toEqual(["C>G", "G>C"]);
  });
});

describe("buildChordPhaseExercise", () => {
  it("keeps one hidden, generated exercise for the whole fight at the phase's tempo", () => {
    const ex = buildChordPhaseExercise(COLOSSUS, variation());
    expect(ex.id).toBe("boss-colossus");
    expect(ex.metronomeSpeed?.recommended).toBe(80);
    expect(ex.isHiddenFromLibrary).toBe(true);
    expect(ex._generatorConfig).toEqual({ kind: "boss", bossId: "colossus" });
    expect(ex.relatedSkills).toEqual(["chords"]);
  });
});

describe("CHORD_SHAPES", () => {
  // The backing reads the chord's name off the tab; the guitar plays its shape.
  it("sounds the chord its name says, root included — what the backing plays under it", () => {
    const pcOf = (freq: number) => ((Math.round(12 * Math.log2(freq / 440)) % 12) + 12 + 9) % 12;
    for (const name of Object.keys(CHORD_SHAPES)) {
      const chord = parseChordSymbol(name);
      expect(chord, name).not.toBeNull();
      const tones = chordTonesOf(chord!);
      const sounded = chordNotes(name).map((note) => pcOf(getFrequencyFromTab(note.string, note.fret)));
      for (const pc of sounded) expect(tones, `${name} sounds pc ${pc}`).toContain(pc);
      expect(sounded, name).toContain(chord!.root);
    }
  });
});
