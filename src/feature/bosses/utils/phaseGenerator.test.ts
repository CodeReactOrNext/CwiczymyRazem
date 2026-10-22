import { describe, expect, it } from "vitest";

import {
  AFFIX_FROM,
  affixCountAt,
  createRng,
  generatePhase,
  SLAMS_FROM,
  targetNotesPerSecond,
  WEAK_SPOTS_FROM,
} from "./phaseGenerator";
import { notesPerBar, notesPerSecond, spiderPassNotes } from "./spiderTab";

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 13);
const PHASES = Array.from({ length: 25 }, (_, i) => i);

describe("generatePhase", () => {
  it("deals the same phase for the same seed, and another for another seed", () => {
    expect(generatePhase(42, 5)).toEqual(generatePhase(42, 5));
    const dealt = new Set(SEEDS.map((seed) => JSON.stringify(generatePhase(seed, 6).variation)));
    expect(dealt.size).toBeGreaterThan(SEEDS.length / 2);
  });

  it("always deals a pass that fills whole 4/4 bars", () => {
    for (const seed of SEEDS) {
      for (const index of PHASES) {
        const { variation } = generatePhase(seed, index);
        expect(spiderPassNotes(variation).length % notesPerBar(variation), `${seed}/${index}`).toBe(0);
      }
    }
  });

  it("stays on the neck and at a playable tempo", () => {
    const outOfRange: string[] = [];
    for (const seed of SEEDS) {
      for (const index of PHASES) {
        const { variation } = generatePhase(seed, index);
        const frets = spiderPassNotes(variation).map((note) => note.fret);
        const low = Math.min(...frets);
        const high = Math.max(...frets);
        if (variation.bpm < 55 || variation.bpm > 180 || low < 1 || high > 15) {
          outOfRange.push(`${seed}/${index}: ${variation.bpm} BPM, frets ${low}–${high}`);
        }
      }
    }
    expect(outOfRange).toEqual([]);
  });

  it("only deals real finger orders, and starts on 1234 alone", () => {
    for (const seed of SEEDS) {
      expect(generatePhase(seed, 0).variation.patterns).toEqual(["1234"]);
      for (const index of PHASES) {
        const { patterns, descendPatterns = [] } = generatePhase(seed, index).variation;
        for (const p of [...patterns, ...descendPatterns]) {
          expect(p.split("").sort().join("")).toBe("1234");
        }
      }
    }
  });

  it("gets faster and tougher as the phases climb — slowly", () => {
    for (const seed of SEEDS) {
      const first = generatePhase(seed, 0);
      const second = generatePhase(seed, 1);
      const tenth = generatePhase(seed, 9);
      // A step at a time: the second phase is barely quicker than the first.
      expect(notesPerSecond(second.variation)).toBeLessThan(notesPerSecond(first.variation) * 1.15);
      expect(notesPerSecond(tenth.variation)).toBeGreaterThan(notesPerSecond(first.variation) * 1.8);
      expect(tenth.rules.bossHp).toBeGreaterThan(first.rules.bossHp * 2);
    }
    PHASES.slice(1).forEach((index) =>
      expect(targetNotesPerSecond(index)).toBeGreaterThanOrEqual(targetNotesPerSecond(index - 1)),
    );
  });

  it("brings in slams, weak spots and powers phase by phase", () => {
    for (const seed of SEEDS) {
      const at = (phase: number) => generatePhase(seed, phase - 1);
      expect(at(1)).toMatchObject({ slams: false, weakSpots: false, affixes: [] });
      expect(at(SLAMS_FROM).slams).toBe(true);
      expect(at(WEAK_SPOTS_FROM).weakSpots).toBe(true);
      expect(at(SLAMS_FROM - 1).slams).toBe(false);
      expect(at(AFFIX_FROM - 1).affixes).toHaveLength(0);
      expect(at(AFFIX_FROM).affixes).toHaveLength(1);
      expect(at(9).affixes).toHaveLength(2);
      expect(at(13).affixes).toHaveLength(3);
      expect(new Set(at(13).affixes).size).toBe(3);
    }
  });

  it("bites softly in the opening phases, in full from the sixth", () => {
    for (const seed of SEEDS) {
      const first = generatePhase(seed, 0).rules.biteDamage;
      expect(first).toBeLessThanOrEqual(5);
      expect(affixCountAt(1)).toBe(0);
    }
  });

  it("warns of a slam before it lands", () => {
    for (const seed of SEEDS) {
      for (const index of PHASES) {
        const { rules } = generatePhase(seed, index);
        expect(rules.slamWindup).toBeLessThan(rules.slamEvery);
        expect(rules.weakSpotLength).toBeLessThan(rules.weakSpotEvery);
        expect(rules.webLength).toBeLessThan(rules.webEvery);
      }
    }
  });
});

describe("createRng", () => {
  it("repeats for a seed and stays in 0…1", () => {
    const a = createRng(7);
    const b = createRng(7);
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});
