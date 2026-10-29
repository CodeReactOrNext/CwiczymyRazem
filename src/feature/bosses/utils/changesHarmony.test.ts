import { describe, expect, it } from "vitest";

import {
  chordMood,
  chordScale,
  chordTones,
  degreeLabel,
  inKey,
  noteName,
  pitchClassOf,
  seventhOf,
  toneRole,
} from "./changesHarmony";

const sorted = (notes: ReadonlySet<number>) => [...notes].sort((a, b) => a - b);
const C_MAJOR = { tonic: 0, mode: "ionian" } as const;

describe("seventhOf", () => {
  it("reads the seventh off the scale", () => {
    const major = [0, 2, 4, 5, 7, 9, 11];
    expect(seventhOf(major, 0)).toBe("maj7");
    expect(seventhOf(major, 7)).toBe("7");
    expect(seventhOf(major, 2)).toBe("min7");
    // vii is half-diminished — no name the backing reads.
    expect(seventhOf(major, 11)).toBeNull();
  });
});

describe("chord tones", () => {
  it("names each tone by its role and degree", () => {
    expect(chordTones("Am7")).toEqual([9, 0, 4, 7]);
    expect(toneRole("Am7", 9)).toBe("root");
    expect(toneRole("Am7", 0)).toBe("third");
    expect(toneRole("Am7", 4)).toBe("fifth");
    expect(toneRole("Am7", 7)).toBe("seventh");
    expect(toneRole("Am7", 2)).toBeNull();
    expect(degreeLabel("Am7", 0)).toBe("b3");
    expect(degreeLabel("G7", 5)).toBe("b7");
    expect(degreeLabel("Cmaj7", 11)).toBe("7");
  });

  it("tells a major chord from a minor one", () => {
    expect(chordMood("C")).toBe("major");
    expect(chordMood("G7")).toBe("major");
    expect(chordMood("Am")).toBe("minor");
    expect(chordMood("Dm7")).toBe("minor");
  });
});

describe("chordScale", () => {
  it("is the key's own notes over a chord of the key", () => {
    expect(sorted(chordScale("Am", C_MAJOR))).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(inKey("Am", C_MAJOR)).toBe(true);
    // Harmonic minor keeps the natural seventh as a passing note.
    expect(sorted(chordScale("Am", { tonic: 9, mode: "harmonicMinor" }))).toEqual([0, 2, 4, 5, 7, 8, 9, 11]);
  });

  it("puts a chord's tone from outside the key in place of the note it alters", () => {
    // E7 in C major: G# for G — A harmonic minor.
    expect(sorted(chordScale("E7", C_MAJOR))).toEqual([0, 2, 4, 5, 8, 9, 11]);
    expect(inKey("E7", C_MAJOR)).toBe(false);
    // Bb borrowed into C: the B goes — C mixolydian.
    expect(sorted(chordScale("Bb", C_MAJOR))).toEqual([0, 2, 4, 5, 7, 9, 10]);
    // Ab: its root for A, its fifth Eb for E.
    expect(sorted(chordScale("Ab", C_MAJOR))).toEqual([0, 2, 3, 5, 7, 8, 11]);
  });

  it("raises minor's seventh under a major V, and its sixth under a major IV", () => {
    const aMinor = { tonic: 9, mode: "aeolian" } as const;
    expect(sorted(chordScale("E", aMinor))).toEqual([0, 2, 4, 5, 8, 9, 11]);
    expect(sorted(chordScale("D", aMinor))).toEqual([0, 2, 4, 6, 7, 9, 11]);
  });

  it("only adds to the blues", () => {
    const aBlues = { tonic: 9, mode: "blues" } as const;
    expect(chordScale("F#7", aBlues).has(10)).toBe(true);
    expect(chordScale("F#7", aBlues).size).toBe(10);
  });
});

describe("pitches", () => {
  it("rounds a frequency to its pitch class", () => {
    expect(pitchClassOf(440)).toBe(9);
    expect(pitchClassOf(261.63)).toBe(0);
    // 30 cents sharp of E2 is still an E.
    expect(pitchClassOf(82.41 * 2 ** (30 / 1200))).toBe(4);
  });

  it("spells a note the way the key does", () => {
    expect(noteName(10, { tonic: 5, mode: "ionian" })).toBe("Bb");
    expect(noteName(6, { tonic: 7, mode: "ionian" })).toBe("F#");
  });

  it("spells a note over a borrowed chord the way the chord does", () => {
    expect(noteName(10, C_MAJOR)).toBe("A#");
    expect(noteName(10, C_MAJOR, "Bb")).toBe("Bb");
    expect(noteName(8, C_MAJOR, "E7")).toBe("G#");
  });
});
