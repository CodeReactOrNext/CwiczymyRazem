import { describe, expect, it } from "vitest";

import type { BackingNote } from "./colour";
import { colourChord, colourScale } from "./colour";
import { chordSymbol, scaleById } from "./theory";

const C_MAJOR = new Set([0, 2, 4, 5, 7, 9, 11]);
const held = (pc: number, duration = 2): BackingNote => ({
  pc,
  start: 0,
  duration,
  weight: 1,
});
const passing = (pc: number): BackingNote => ({
  pc,
  start: 0,
  duration: 0.25,
  weight: 1,
});
const colour = (
  root: number,
  quality: Parameters<typeof colourChord>[0]["quality"],
  melody: BackingNote[] = [],
  key = C_MAJOR,
) => chordSymbol(colourChord({ root, quality }, melody, key));

describe("colourChord", () => {
  it("dresses the key's chords in their diatonic colours", () => {
    expect(colour(0, "maj")).toBe("Cmaj7");
    expect(colour(2, "min")).toBe("Dm9");
    // E minor's ninth (F#) isn't in C major: a plain minor seventh instead.
    expect(colour(4, "min")).toBe("Em7");
    // G major's seventh (F#) isn't either; its ninth is.
    expect(colour(7, "maj")).toBe("Gadd9");
  });

  it("drops a colour a held melody note would rub against", () => {
    // A long C over Cmaj7's B — the clash arrangers avoid.
    expect(colour(0, "maj", [held(0)])).toBe("Cadd9");
  });

  it("lets a quick passing note go by", () => {
    expect(colour(0, "maj", [passing(0), held(4), held(7)])).toBe("Cmaj7");
  });

  it("opens a power chord into sus2", () => {
    expect(colour(4, "5", [], new Set([4, 6, 7, 9, 11, 0, 2]))).toBe("Esus2");
  });

  it("leaves a chord alone when no colour fits", () => {
    expect(colour(11, "maj", [], C_MAJOR)).toBe("B");
  });
});

describe("colourScale", () => {
  it("takes a pentatonic's colours from its parent mode", () => {
    const pcs = colourScale({
      tonic: 9,
      scale: scaleById("minorPentatonic"),
      coverage: 1,
      thirdKnown: true,
    });
    // B, the ninth of Am, is outside A minor pentatonic but inside A minor.
    expect(pcs.has(11)).toBe(true);
    expect(colour(9, "min", [], pcs)).toBe("Am9");
  });
});
