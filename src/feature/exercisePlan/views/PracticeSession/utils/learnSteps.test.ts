import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { buildLearnSteps, learnHitNotes, requiredChordTones, resolveLearnTargets } from "./learnSteps";

const identity = (_string: number, freq: number) => freq;

const measures: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 1, notes: [{ string: 6, fret: 5 }] },
      { duration: 1, notes: [] },
      { duration: 0.5, notes: [{ string: 5, fret: 7 }, { string: 4, fret: 7 }] },
      { duration: 1.5, notes: [{ string: 3, fret: 0 }] },
    ],
  },
  {
    timeSignature: [4, 4],
    beats: [{ duration: 4, notes: [{ string: 1, fret: 3 }] }],
  },
];

describe("buildLearnSteps", () => {
  const steps = buildLearnSteps(measures);

  it("makes a step of every beat that has something to play and none of a rest", () => {
    expect(steps).toHaveLength(4);
  });

  it("places each step on the beat grid, rests included", () => {
    expect(steps.map((s) => [s.beatStart, s.beatEnd])).toEqual([[0, 1], [2, 2.5], [2.5, 4], [4, 8]]);
  });

  it("keys notes the way the note matcher and the tab do", () => {
    expect(steps[1].notes.map((n) => n.noteKey)).toEqual(["0-2-0", "0-2-1"]);
    expect(steps[3].notes[0].noteKey).toBe("1-0-0");
  });

  it("has no steps without a tab", () => {
    expect(buildLearnSteps(undefined)).toEqual([]);
    expect(buildLearnSteps([])).toEqual([]);
  });
});

describe("learnHitNotes", () => {
  const steps = buildLearnSteps(measures);

  it("marks nothing before the first beat is played", () => {
    expect(learnHitNotes(steps, 0)).toEqual({});
  });

  it("fills every note of the beats already played to their end", () => {
    expect(learnHitNotes(steps, 2)).toEqual({ "0-0-0": 1, "0-2-0": 2.5, "0-2-1": 2.5 });
  });

  it("stops at the end of the tab", () => {
    expect(Object.keys(learnHitNotes(steps, 99))).toHaveLength(5);
  });
});

describe("requiredChordTones", () => {
  it("asks small shapes to be played whole and forgives one weak string in bigger ones", () => {
    expect([1, 2, 3, 4, 5, 6].map(requiredChordTones)).toEqual([1, 2, 3, 3, 4, 5]);
  });
});

describe("resolveLearnTargets", () => {
  const stepOf = (note: object) =>
    buildLearnSteps([{ timeSignature: [4, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 0, ...note }] }] }])[0];

  it("reads the pitch off the string and fret", () => {
    const [target] = resolveLearnTargets(stepOf({ string: 1, fret: 0 }), undefined, identity);
    expect(target.freq).toBeCloseTo(329.63, 1);
  });

  it("prefers the real pitch a Guitar Pro note carries", () => {
    const [target] = resolveLearnTargets(stepOf({ string: 1, fret: 0, midiNote: 45 }), undefined, identity);
    expect(target.freq).toBeCloseTo(110, 1);
  });

  it("follows the player's tuning", () => {
    const [standard] = resolveLearnTargets(stepOf({ string: 6, fret: 0 }), undefined, identity);
    const [dropD] = resolveLearnTargets(stepOf({ string: 6, fret: 0 }), [0, 0, 0, 0, 0, -2], identity);
    expect(dropD.freq).toBeCloseTo(standard.freq * Math.pow(2, -2 / 12), 1);
  });

  it("learns a bend at the pitch it reaches", () => {
    const [plain] = resolveLearnTargets(stepOf({ string: 2, fret: 8 }), undefined, identity);
    const [bent] = resolveLearnTargets(stepOf({ string: 2, fret: 8, isBend: true, bendSemitones: 2 }), undefined, identity);
    expect(bent.freq).toBeCloseTo(plain.freq * Math.pow(2, 2 / 12), 1);
  });

  it("has no pitch for a muted note", () => {
    const [target] = resolveLearnTargets(stepOf({ isDead: true }), undefined, identity);
    expect(target).toMatchObject({ freq: 0, isDead: true });
  });

  it("tells a picked note from one that only changes the pitch of a ringing string", () => {
    const [picked] = resolveLearnTargets(stepOf({}), undefined, identity);
    const [hammered] = resolveLearnTargets(stepOf({ isHammerOn: true }), undefined, identity);
    expect([picked.hasAttack, hammered.hasAttack]).toEqual([true, false]);
  });
});
