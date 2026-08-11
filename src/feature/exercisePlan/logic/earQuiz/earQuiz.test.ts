import { describe, expect, it } from "vitest";

import { buildChordMidi, CHORD_QUALITIES, sortChordQualities } from "./chordQualities";
import type {
  ChordTypeQuizConfig,
  DetuneQuizConfig,
  ProgressionQuizConfig,
  ScaleModeQuizConfig,
} from "./earQuiz.types";
import { buildProgressionChords, DEGREES, findProgression, PROGRESSIONS, sortDegrees } from "./progressions";
import type { Rng } from "./questions";
import {
  beatsPerSecond,
  checkProgressionAnswer,
  generateChordTypeQuestion,
  generateDetuneQuestion,
  generateEarQuizQuestion,
  generateProgressionQuestion,
  generateScaleModeQuestion,
  isDetuneSolved,
  remainingDetuneCents,
} from "./questions";
import { buildDroneMidi, buildScaleMidi, SCALE_MODES, sortScaleModes } from "./scaleModes";

/** Deterministic rng: cycles through the given values. */
const seeded = (values: number[]): Rng => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("chord qualities", () => {
  it("stacks the intervals on top of the root", () => {
    expect(buildChordMidi(60, "major")).toEqual([60, 64, 67]);
    expect(buildChordMidi(60, "min7")).toEqual([60, 63, 67, 70]);
    expect(buildChordMidi(48, "dim")).toEqual([48, 51, 54]);
  });

  it("keeps a fixed answer order whatever the config lists", () => {
    expect(sortChordQualities(["dim", "major", "min7", "minor"])).toEqual(["major", "minor", "min7", "dim"]);
  });

  it("has every quality's formula match its intervals", () => {
    // The formula string is what the player is taught from, so it must not drift
    // away from the notes actually sounded.
    expect(CHORD_QUALITIES.maj7.intervals).toContain(11);
    expect(CHORD_QUALITIES.dom7.intervals).toContain(10);
    expect(CHORD_QUALITIES.sus4.intervals).not.toContain(4);
    expect(CHORD_QUALITIES.sus2.intervals).not.toContain(3);
  });
});

describe("progressions", () => {
  it("voices each degree as a bass note under a close triad", () => {
    const [tonic, dominant] = buildProgressionChords(60, ["I", "V"]);
    expect(tonic).toMatchObject({ degree: "I", name: "C", midis: [48, 60, 64, 67] });
    expect(dominant).toMatchObject({ degree: "V", name: "G", midis: [55, 67, 71, 74] });
  });

  it("names minor and diminished degrees", () => {
    const chords = buildProgressionChords(60, ["vi", "vii°"]);
    expect(chords.map((chord) => chord.name)).toEqual(["Am", "Bdim"]);
  });

  it("only uses degrees that exist", () => {
    for (const progression of PROGRESSIONS) {
      for (const degree of progression.degrees) {
        expect(DEGREES[degree]).toBeDefined();
      }
    }
  });

  it("sorts tiles low to high", () => {
    expect(sortDegrees(["V", "I", "vi", "ii"])).toEqual(["I", "ii", "V", "vi"]);
  });

  it("checks the built answer slot by slot", () => {
    const question = generateProgressionQuestion(
      { mode: "progression", progressions: ["I-V-vi-IV"], degreePool: ["I", "IV", "V", "vi"] },
      null,
      seeded([0, 0]),
    );
    expect(checkProgressionAnswer(question, ["I", "V", "vi", "IV"])).toEqual([true, true, true, true]);
    expect(checkProgressionAnswer(question, ["I", "V", "IV", "vi"])).toEqual([true, true, false, false]);
    expect(checkProgressionAnswer(question, [null, null, null, null])).toEqual([false, false, false, false]);
  });
});

describe("scale modes", () => {
  it("builds one ascending octave with the root on top", () => {
    expect(buildScaleMidi(60, "ionian")).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(buildScaleMidi(60, "dorian")).toEqual([60, 62, 63, 65, 67, 69, 70, 72]);
  });

  it("separates dorian from aeolian only by the 6th", () => {
    const dorian = SCALE_MODES.dorian.intervals;
    const aeolian = SCALE_MODES.aeolian.intervals;
    const differences = dorian.filter((step, i) => step !== aeolian[i]);
    expect(differences).toEqual([9]);
  });

  it("drones the root and the 5th below it", () => {
    expect(buildDroneMidi(60)).toEqual([48, 55]);
  });

  it("keeps a fixed answer order", () => {
    expect(sortScaleModes(["aeolian", "ionian", "dorian"])).toEqual(["ionian", "dorian", "aeolian"]);
  });
});

describe("question generation", () => {
  const chordConfig: ChordTypeQuizConfig = { mode: "chordType", qualities: ["major", "minor", "dom7"] };

  it("never repeats the previous chord quality", () => {
    const first = generateChordTypeQuestion(chordConfig, null, seeded([0, 0]));
    for (let i = 0; i < 20; i++) {
      const next = generateChordTypeQuestion(chordConfig, first, seeded([i / 20, i / 20]));
      expect(next.quality).not.toBe(first.quality);
    }
  });

  it("plays the chord it is asking about", () => {
    const question = generateChordTypeQuestion(chordConfig, null, seeded([0.5, 0]));
    expect(question.midis).toEqual(buildChordMidi(question.rootMidi, question.quality));
    expect(question.options).toContain(question.quality);
  });

  it("falls back to the full list when the configured progressions are unknown", () => {
    const config: ProgressionQuizConfig = { mode: "progression", progressions: ["nope"], degreePool: ["I", "V"] };
    const question = generateProgressionQuestion(config, null, seeded([0, 0]));
    expect(findProgression(question.progressionId)).toBeDefined();
    expect(question.chords).toHaveLength(question.degrees.length);
  });

  it("offers every degree the drawn progression needs", () => {
    const config: ProgressionQuizConfig = {
      mode: "progression",
      progressions: ["I-V-vi-IV"],
      degreePool: ["I", "IV", "V", "vi"],
    };
    const question = generateProgressionQuestion(config, null, seeded([0, 0.3]));
    for (const degree of question.degrees) expect(question.tiles).toContain(degree);
  });

  it("draws the detune error from the configured window, either direction", () => {
    const config: DetuneQuizConfig = { mode: "detune", toleranceCents: 8, minOffsetCents: 10, maxOffsetCents: 30 };
    const flat = generateDetuneQuestion(config, null, seeded([0, 0, 0.9]));
    const sharp = generateDetuneQuestion(config, null, seeded([0, 0, 0.1]));
    expect(Math.abs(flat.offsetCents)).toBeGreaterThanOrEqual(10);
    expect(Math.abs(flat.offsetCents)).toBeLessThanOrEqual(30);
    expect(flat.offsetCents).toBeGreaterThan(0);
    expect(sharp.offsetCents).toBeLessThan(0);
  });

  it("dispatches on the config's mode", () => {
    const scaleConfig: ScaleModeQuizConfig = { mode: "scaleMode", scales: ["dorian", "aeolian"] };
    expect(generateEarQuizQuestion(scaleConfig, null, seeded([0, 0])).kind).toBe("scaleMode");
    expect(generateEarQuizQuestion(chordConfig, null, seeded([0, 0])).kind).toBe("chordType");
  });

  it("sounds the drone under the scale it asks about", () => {
    const question = generateScaleModeQuestion({ mode: "scaleMode", scales: ["lydian"] }, null, seeded([0, 0.5]));
    expect(question.midis).toEqual(buildScaleMidi(question.rootMidi, "lydian"));
    expect(question.droneMidis).toEqual(buildDroneMidi(question.rootMidi));
  });
});

describe("detune scoring", () => {
  const question = {
    kind: "detune" as const,
    referenceMidi: 57,
    referenceName: "A",
    offsetCents: 24,
    toleranceCents: 8,
  };

  it("subtracts the slider from the error", () => {
    expect(remainingDetuneCents(question, -24)).toBe(0);
    expect(remainingDetuneCents(question, -30)).toBe(-6);
  });

  it("passes inside the tolerance window and fails outside it", () => {
    expect(isDetuneSolved(question, -24)).toBe(true);
    expect(isDetuneSolved(question, -16)).toBe(true); // exactly 8 cents out
    expect(isDetuneSolved(question, -15)).toBe(false);
    expect(isDetuneSolved(question, 0)).toBe(false);
  });

  it("reports the beat rate the player is listening for", () => {
    expect(beatsPerSecond(440, 0)).toBe(0);
    // A 440 against ~442.5 Hz beats about two and a half times a second.
    expect(beatsPerSecond(440, 10)).toBeCloseTo(2.55, 1);
    // Direction doesn't change how fast it wobbles.
    expect(beatsPerSecond(440, -10)).toBeCloseTo(beatsPerSecond(440, 10), 0);
  });
});
