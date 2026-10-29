import { generateBossBacking } from "feature/autoBacking/bossBacking";
import { describe, expect, it } from "vitest";

import { CHANGELING } from "../data/changeling";
import type { ChangesMode } from "../types/boss.types";
import { chordTones, inKey } from "./changesHarmony";
import { chordsFor, FIRST_CHORDS, generateChangesPhase, MAX_CHORDS } from "./changesPhaseGenerator";
import { buildChangesPhaseExercise, buildChangesTablature } from "./changesTab";

const SEEDS = [1, 7, 42, 1234, 99991, 0xdeadbeef];

describe("generateChangesPhase", () => {
  it("deals the same phase for the same seed and index", () => {
    expect(generateChangesPhase(42, 6)).toEqual(generateChangesPhase(42, 6));
  });

  it("starts on three different chords in major or minor, triads a bar each", () => {
    for (const seed of SEEDS) {
      for (const index of [0, 1, 2]) {
        const { variation } = generateChangesPhase(seed, index);
        expect(["ionian", "aeolian"]).toContain(variation.key.mode);
        expect(variation.family).toBe("triads");
        expect(variation.beatsPerChord).toBe(4);
      }
      const { progression } = generateChangesPhase(seed, 0).variation;
      expect(new Set(progression).size).toBe(FIRST_CHORDS);
      expect(progression).toHaveLength(FIRST_CHORDS);
    }
  });

  it("deals one chord more every phase, up to the most", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < 12; index++) {
        const { progression, key } = generateChangesPhase(seed, index).variation;
        expect(new Set(progression).size).toBe(progression.length);
        // The blues hasn't got so many; any other mode has.
        if (key.mode !== "blues") expect(progression.length, progression.join(" ")).toBe(chordsFor(index));
      }
    }
    expect(chordsFor(1)).toBe(FIRST_CHORDS + 1);
    expect(chordsFor(40)).toBe(MAX_CHORDS);
  });

  it("brings sevenths and colourful chords now and then, more as it climbs", () => {
    const phases = (from: number, to: number) =>
      SEEDS.flatMap((seed) =>
        Array.from({ length: to - from }, (_, i) => generateChangesPhase(seed, from + i).variation),
      ).filter((variation) => variation.key.mode !== "blues");
    const share = (list: ReturnType<typeof phases>, test: (v: (typeof list)[number]) => boolean) =>
      list.filter(test).length / list.length;
    const sevenths = (v: { family: string }) => v.family === "sevenths";
    // A colourful chord spells a tone from outside the key.
    const colourful = (v: { progression: readonly string[]; key: { tonic: number; mode: ChangesMode } }) =>
      v.progression.some((chord) => !inKey(chord, v.key));
    expect(share(phases(0, 3), sevenths)).toBe(0);
    expect(share(phases(0, 2), colourful)).toBe(0);
    expect(share(phases(10, 20), sevenths)).toBeGreaterThan(share(phases(3, 6), sevenths));
    expect(share(phases(10, 20), colourful)).toBeGreaterThan(0.3);
  });

  it("only deals chords whose tones it can name", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < 30; index++) {
        for (const chord of generateChangesPhase(seed, index).variation.progression) {
          expect(chordTones(chord).length, chord).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("keeps the tempo playable, fills whole bars and loops the whole progression", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < 30; index++) {
        const { variation } = generateChangesPhase(seed, index);
        expect(variation.bpm).toBeGreaterThanOrEqual(66);
        expect(variation.bpm).toBeLessThanOrEqual(150);
        const beats = variation.units.reduce((sum, unit) => sum + unit.beats, 0);
        expect(beats % 4).toBe(0);
        expect(beats).toBeGreaterThanOrEqual(index === 0 ? 16 : 32);
        const { progression, units } = variation;
        expect(units.length % progression.length).toBe(0);
        expect(units.map((unit) => unit.chord)).toEqual(units.map((_, i) => progression[i % progression.length]));
      }
    }
  });

  it("rushes from the third phase, never before", () => {
    for (const seed of SEEDS) {
      expect(generateChangesPhase(seed, 0).quakes).toBe(false);
      expect(generateChangesPhase(seed, 1).quakes).toBe(false);
      expect(generateChangesPhase(seed, 2).quakes).toBe(true);
    }
  });

  it("changes chord at the loop too", () => {
    for (const seed of SEEDS) {
      const { units } = generateChangesPhase(seed, 4).variation;
      expect(units[units.length - 1].chord).not.toBe(units[0].chord);
    }
  });

  it("grows the phases' HP as it climbs", () => {
    expect(generateChangesPhase(42, 10).rules.bossHp).toBeGreaterThan(generateChangesPhase(42, 0).rules.bossHp);
  });
});

describe("the changeling's tab", () => {
  it("is rests under the chord names, a beat per chord", () => {
    const { variation } = generateChangesPhase(42, 3);
    const measures = buildChangesTablature(variation);
    const beats = measures.flatMap((measure) => measure.beats);
    expect(beats.every((beat) => beat.notes.length === 0)).toBe(true);
    expect(beats.map((beat) => beat.chordName)).toEqual(variation.units.map((unit) => unit.chord));
    for (const measure of measures) {
      expect(measure.beats.reduce((sum, beat) => sum + beat.duration, 0)).toBe(4);
    }
  });

  it("gives the boss's score its chords to follow", () => {
    const { variation } = generateChangesPhase(7, 5);
    const exercise = buildChangesPhaseExercise(CHANGELING, variation);
    const backing = generateBossBacking(exercise.tablature!, variation.bpm, { phase: 6 }, {});
    expect(backing?.summary.source).toBe("tab");
    // The score names its chords with sharps; compare what they sound.
    const sound = (names: readonly string[]) => new Set(names.map((name) => chordTones(name).join()));
    expect(sound(backing?.summary.chords ?? [])).toEqual(sound(variation.progression));
  });
});
