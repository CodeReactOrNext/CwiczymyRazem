import { describe, expect, it } from "vitest";

import { CHORD_SHAPES } from "../data/colossus";
import {
  changesPerSecond,
  dealUnits,
  generateChordPhase,
  passBeats,
  QUAKE_BARS,
  QUAKES_FROM,
} from "./chordPhaseGenerator";

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 13);
const PHASES = Array.from({ length: 16 }, (_, i) => i);

describe("generateChordPhase", () => {
  it("deals the same phase for the same seed, and different ones across seeds", () => {
    expect(generateChordPhase(42, 5)).toEqual(generateChordPhase(42, 5));
    const dealt = new Set(SEEDS.map((seed) => JSON.stringify(generateChordPhase(seed, 4).variation)));
    expect(dealt.size).toBeGreaterThan(10);
  });

  it("fills whole 4/4 bars, every strum a chord with a known shape", () => {
    for (const seed of SEEDS) {
      for (const index of PHASES) {
        const { variation } = generateChordPhase(seed, index);
        expect(passBeats(variation) % 4, `${seed}/${index}`).toBe(0);
        for (const unit of variation.units) expect(CHORD_SHAPES[unit.chord]).toBeDefined();
      }
    }
  });

  it("changes chord on every strum, the loop's seam included", () => {
    for (const seed of SEEDS) {
      for (const index of PHASES) {
        const { units } = generateChordPhase(seed, index).variation;
        units.forEach((unit, i) => {
          const before = units[(i - 1 + units.length) % units.length];
          expect(unit.chord, `${seed}/${index} strum ${i}`).not.toBe(before.chord);
        });
      }
    }
  });

  it("opens on two open chords, a chord a bar, then climbs the families slowly", () => {
    for (const seed of SEEDS) {
      const first = generateChordPhase(seed, 0);
      expect(first.variation.family).toBe("open");
      expect(first.variation.progression).toHaveLength(2);
      expect(first.variation.beatsPerChord).toBe(4);
      expect(first.variation.bpm).toBeLessThanOrEqual(72);
      expect(first.rules.biteDamage).toBeLessThanOrEqual(5);
      expect(generateChordPhase(seed, 4).variation.family).toBe("open");
      expect(generateChordPhase(seed, 5).variation.family).toBe("power");
      expect(generateChordPhase(seed, 10).variation.family).toBe("barre");
      expect(generateChordPhase(seed, 15).variation.family).toBe("seventh");
    }
  });

  it("keeps the tempo playable and the changes coming quicker", () => {
    for (const seed of SEEDS) {
      for (const index of PHASES) {
        const { bpm } = generateChordPhase(seed, index).variation;
        expect(bpm).toBeGreaterThanOrEqual(60);
        expect(bpm).toBeLessThanOrEqual(160);
      }
      const first = changesPerSecond(generateChordPhase(seed, 0).variation);
      const tenth = changesPerSecond(generateChordPhase(seed, 9).variation);
      expect(tenth).toBeGreaterThan(first * 2);
    }
  });

  it("quakes from its phase on: two bars of chords twice as fast, never more than 3 a second", () => {
    for (const seed of SEEDS) {
      expect(generateChordPhase(seed, QUAKES_FROM - 2).quakes).toBe(false);
      for (const index of PHASES.slice(QUAKES_FROM - 1)) {
        const plan = generateChordPhase(seed, index);
        const { units, beatsPerChord, bpm } = plan.variation;
        expect(plan.quakes).toBe(true);
        const quakeBeats = units.filter((u) => u.quake).reduce((sum, u) => sum + u.beats, 0);
        expect(quakeBeats % (QUAKE_BARS * 4)).toBe(0);
        for (const unit of units.filter((u) => u.quake)) expect(unit.beats).toBe(beatsPerChord / 2);
        expect((bpm / 60) * (2 / beatsPerChord)).toBeLessThanOrEqual(3.01);
        // The pass never opens on a quake: the bar before it is there to see it coming.
        expect(units[0].quake).toBe(false);
      }
    }
  });

  it("quakes twice a pass with aftershocks", () => {
    const withAftershocks = SEEDS.flatMap((seed) => PHASES.map((index) => generateChordPhase(seed, index))).filter(
      (plan) => plan.affixes.includes("frenzy"),
    );
    expect(withAftershocks.length).toBeGreaterThan(0);
    for (const plan of withAftershocks) {
      const { units } = plan.variation;
      const starts = units.filter((u, i) => u.quake && !units[(i - 1 + units.length) % units.length].quake);
      expect(starts).toHaveLength(2);
    }
  });
});

describe("dealUnits", () => {
  it("cycles the progression bar by bar, doubling up in quake bars", () => {
    const units = dealUnits(["G", "C", "D"], 2, 4, [2]);
    expect(units.map((u) => u.chord)).toEqual(["G", "C", "D", "G", "C", "D", "G", "C", "D", "G", "C", "D"]);
    expect(units.map((u) => u.beats)).toEqual([2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(units.filter((u) => u.quake)).toHaveLength(8);
  });

  it("swaps the last chord when the pass would close on its first", () => {
    const units = dealUnits(["G", "C", "D"], 2, 2, []);
    // G C D G — the loop would strum G twice.
    expect(units.map((u) => u.chord)).toEqual(["G", "C", "D", "C"]);
  });
});
