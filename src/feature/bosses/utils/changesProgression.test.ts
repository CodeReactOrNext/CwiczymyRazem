import { describe, expect, it } from "vitest";

import type { ChangesMode } from "../types/boss.types";
import { chordRoot, chordTones } from "./changesHarmony";
import type { ProgressionRequest } from "./changesProgression";
import { dealProgression } from "./changesProgression";
import { createRng } from "./phaseGenerator";

const MODES: ChangesMode[] = [
  "ionian",
  "aeolian",
  "dorian",
  "mixolydian",
  "harmonicMinor",
  "blues",
];
const deal = (
  seed: number,
  tonic: number,
  mode: ChangesMode,
  request: Partial<ProgressionRequest> = {},
) =>
  dealProgression(createRng(seed), tonic, mode, {
    chords: 3,
    colors: 0,
    family: "triads",
    ...request,
  });

describe("dealProgression", () => {
  it("deals as many different chords as asked, home first", () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const chords of [3, 4, 5]) {
        const progression = deal(seed, 0, "ionian", { chords });
        expect(new Set(progression).size, progression.join(" ")).toBe(chords);
        expect(progression[0]).toBe("C");
      }
    }
  });

  it("always has a chord leading home — a dominant at three chords", () => {
    for (let seed = 1; seed <= 40; seed++) {
      expect(deal(seed, 0, "ionian")).toContain("G");
      expect(
        deal(seed, 9, "aeolian").some((chord) => ["G", "Em"].includes(chord)),
      ).toBe(true);
    }
  });

  it("never deals two chords on one root", () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const mode of MODES) {
        const progression = deal(seed, 9, mode, { chords: 7, colors: 2 });
        const roots = progression.map(chordRoot);
        expect(new Set(roots).size, progression.join(" ")).toBe(
          progression.length,
        );
      }
    }
  });

  it("stops at what the mode has", () => {
    // The blues: three dominants of its own, three colourful chords.
    expect(
      deal(1, 9, "blues", { chords: 7, colors: 0 }).length,
    ).toBeLessThanOrEqual(6);
    expect(deal(1, 9, "blues", { chords: 7 }).slice(0, 1)).toEqual(["A7"]);
  });

  it("puts a secondary dominant right before the chord it resolves to", () => {
    let seen = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const progression = deal(seed, 0, "ionian", { chords: 5, colors: 2 });
      const at = progression.indexOf("E7");
      if (at < 0) continue;
      seen += 1;
      expect(progression[at + 1], progression.join(" ")).toBe("Am");
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("spells a borrowed chord with a flat, and stacks sevenths from the key", () => {
    let borrowed = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const progression = deal(seed, 0, "ionian", { chords: 4, colors: 1 });
      expect(
        progression.some(
          (chord) => chord.startsWith("A#") || chord.startsWith("G#"),
        ),
      ).toBe(false);
      if (progression.includes("Bb") || progression.includes("Ab"))
        borrowed += 1;
    }
    expect(borrowed).toBeGreaterThan(0);
    const sevenths = deal(3, 0, "ionian", { chords: 4, family: "sevenths" });
    expect(sevenths[0]).toBe("Cmaj7");
    expect(sevenths).toContain("G7");
  });

  it("only deals chords whose tones it can name", () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const mode of MODES) {
        for (const chord of deal(seed, 4, mode, {
          chords: 7,
          colors: 2,
          family: seed % 2 ? "sevenths" : "triads",
        })) {
          expect(chordTones(chord).length, chord).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});
