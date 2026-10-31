import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  formatTabIssues,
  isPlayableDuration,
  validateTablature,
} from "./validateTablature";

const bar = (
  beats: TablatureMeasure["beats"],
  timeSignature: [number, number] = [4, 4],
): TablatureMeasure => ({ beats, timeSignature });

const quarter = (string: number, fret: number) => ({
  duration: 1,
  notes: [{ string, fret }],
});

describe("validateTablature", () => {
  // The library is the ground truth: a rule that rejects a shipped exercise is
  // a rule that is wrong, not an exercise that is broken.
  const withTab = exercisesAgregat.filter((e) => e.tablature?.length);

  it.each(withTab.map((e) => [e.id, e.tablature!] as const))(
    "accepts the built-in exercise %s",
    (_id, tablature) => {
      // the 64-measure cap is for new tabs; a few long library pieces are over it
      const result = validateTablature(tablature);
      const errors = result.errors.filter(
        (issue) => !issue.message.startsWith("at most 64 measures"),
      );
      expect(formatTabIssues(errors)).toEqual([]);
    },
  );

  it("accepts a plain bar of quarter notes", () => {
    const result = validateTablature([
      bar([quarter(1, 5), quarter(1, 7), quarter(2, 5), quarter(2, 8)]),
    ]);
    expect(result.ok).toBe(true);
    expect(result.stats).toEqual({ measures: 1, beats: 4, notes: 4 });
  });

  it("points at an overfilled measure", () => {
    const result = validateTablature([
      bar([
        quarter(1, 5),
        quarter(1, 7),
        quarter(2, 5),
        quarter(2, 8),
        quarter(3, 5),
      ]),
    ]);
    expect(result.ok).toBe(false);
    expect(formatTabIssues(result.errors)[0]).toMatch(
      /^measure 1: beats add up to 5 quarter notes but 4\/4 holds 4/,
    );
  });

  it("accepts triplets written as their sounding length", () => {
    const triplet = {
      duration: 1 / 3,
      tuplet: 3,
      notes: [{ string: 3, fret: 5 }],
    };
    const result = validateTablature([
      bar([
        triplet,
        triplet,
        triplet,
        quarter(1, 0),
        quarter(1, 0),
        quarter(1, 0),
      ]),
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects strings counted from the wrong side and frets off the neck", () => {
    const result = validateTablature([
      bar([quarter(0, 5), quarter(7, 5), quarter(1, 25), quarter(1, -1)]),
    ]);
    expect(result.errors).toHaveLength(4);
  });

  it("rejects two notes on one string in a chord", () => {
    const result = validateTablature([
      bar([
        {
          duration: 4,
          notes: [
            { string: 2, fret: 1 },
            { string: 2, fret: 3 },
          ],
        },
      ]),
    ]);
    expect(formatTabIssues(result.errors)).toContain(
      "measure 1, beat 1: two notes on the same string in one beat — a chord has one note per string",
    );
  });

  it("warns about a hammer-on flagged on the picked note", () => {
    const result = validateTablature([
      bar([
        { duration: 2, notes: [{ string: 3, fret: 5, isHammerOn: true }] },
        { duration: 2, notes: [{ string: 3, fret: 7 }] },
      ]),
    ]);
    expect(result.ok).toBe(true);
    expect(result.warnings[0].message).toMatch(/no earlier note/);
  });

  it("rejects an all-rest tab", () => {
    const result = validateTablature([bar([{ duration: 4, notes: [] }])]);
    expect(result.ok).toBe(false);
  });
});

describe("isPlayableDuration", () => {
  it.each([4, 2, 1, 0.5, 0.25, 0.125, 1.5, 0.75, 0.375, 3])(
    "accepts %s",
    (duration) => expect(isPlayableDuration(duration)).toBe(true),
  );

  it.each([0, -1, 0.3, 0.6, 5])("rejects %s", (duration) =>
    expect(isPlayableDuration(duration)).toBe(false),
  );

  it("knows quintuplet sixteenths", () => {
    expect(isPlayableDuration(0.2, 5)).toBe(true);
    expect(isPlayableDuration(0.2)).toBe(false);
  });
});
