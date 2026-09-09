import { describe, expect, it } from "vitest";

import {
  DEFAULT_INSTRUMENT_ID,
  DEFAULT_TUNING_ID,
  getInstrument,
  getTunerStrings,
  getTuning,
  TUNER_INSTRUMENTS,
} from "./instruments";

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

function flatToSharp(name: string): string {
  const upper = name.length > 1 ? name[0].toUpperCase() + name.slice(1) : name.toUpperCase();
  return FLAT_TO_SHARP[upper] ?? upper;
}

const guitar = getInstrument("electric-guitar");

describe("getTunerStrings", () => {
  it("resolves standard guitar tuning to the reference pitches every tuner prints", () => {
    const strings = getTunerStrings(getTuning(guitar, "standard"));

    expect(strings.map((s) => s.name)).toEqual(["E2", "A2", "D3", "G3", "B3", "E4"]);
    expect(strings.map((s) => Math.round(s.hz * 100) / 100)).toEqual([
      82.41, 110, 146.83, 196, 246.94, 329.63,
    ]);
  });

  it("numbers strings the way a player does — thick E is 6, thin E is 1", () => {
    const strings = getTunerStrings(getTuning(guitar, "standard"));

    expect(strings.map((s) => s.string)).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it("drops only the lowest string in Drop D", () => {
    const standard = getTunerStrings(getTuning(guitar, "standard"));
    const dropD = getTunerStrings(getTuning(guitar, "drop-d"));

    expect(dropD[0].name).toBe("D2");
    expect(dropD.slice(1).map((s) => s.name)).toEqual(standard.slice(1).map((s) => s.name));
  });

  it("keeps the ukulele's re-entrant G on string 4 even though it is the highest pitch", () => {
    const strings = getTunerStrings(getTuning(getInstrument("ukulele"), "standard"));

    expect(strings.map((s) => s.name)).toEqual(["G4", "C4", "E4", "A4"]);
    expect(strings[0].string).toBe(4);
    expect(strings[0].hz).toBeGreaterThan(strings[1].hz);
  });

  it("puts the banjo's short 5th string first", () => {
    const strings = getTunerStrings(getTuning(getInstrument("banjo"), "open-g"));

    expect(strings.map((s) => s.name)).toEqual(["G4", "D3", "G3", "B3", "D4"]);
    expect(strings[0].string).toBe(5);
  });
});

describe("catalogue integrity", () => {
  it("declares as many open strings as the instrument has, in every tuning", () => {
    TUNER_INSTRUMENTS.forEach((instrument) => {
      instrument.tunings.forEach((tuning) => {
        expect(
          tuning.midi.length,
          `${instrument.id}/${tuning.id} has ${tuning.midi.length} strings`,
        ).toBe(instrument.stringCount);
      });
    });
  });

  it("keeps the notation hint in step with the notes actually targeted", () => {
    TUNER_INSTRUMENTS.forEach((instrument) => {
      instrument.tunings.forEach((tuning) => {
        const letters = getTunerStrings(tuning).map((s) => s.name.replace(/-?\d+$/, ""));
        // The hint is written the way players say it (Eb rather than D#, and the
        // banjo's high g in lower case), so compare pitch classes, not spelling.
        const hint = tuning.notation.split(" ").map(flatToSharp);
        expect(hint, `${instrument.id}/${tuning.id}`).toEqual(letters);
      });
    });
  });

  it("has unique tuning ids within each instrument", () => {
    TUNER_INSTRUMENTS.forEach((instrument) => {
      const ids = instrument.tunings.map((tuning) => tuning.id);
      expect(new Set(ids).size, instrument.id).toBe(ids.length);
    });
  });
});

describe("lookups", () => {
  it("falls back to the first instrument and tuning for anything unknown", () => {
    expect(getInstrument("does-not-exist").id).toBe(DEFAULT_INSTRUMENT_ID);
    expect(getInstrument(null).id).toBe(DEFAULT_INSTRUMENT_ID);
    expect(getTuning(guitar, "does-not-exist").id).toBe(DEFAULT_TUNING_ID);
  });

  it("resolves the defaults the tuner page opens on", () => {
    const instrument = getInstrument(DEFAULT_INSTRUMENT_ID);
    expect(getTuning(instrument, DEFAULT_TUNING_ID).name).toBe("Standard");
  });
});

