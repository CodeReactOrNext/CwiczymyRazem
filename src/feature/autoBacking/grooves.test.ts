import { describe, expect, it } from "vitest";

import { chooseGroove, groupHits, groupStarts } from "./grooves";
import { extractTabContent } from "./noteEvents";
import { bar, eighths } from "./testing/tabBuilders";

const barInfo = (
  timeSignature: [number, number],
  length: number,
  accents: number[] = [],
) => ({ index: 0, start: 0, length, timeSignature, accents });

describe("groupStarts", () => {
  it("counts quarters in simple meters and dotted quarters in compound ones", () => {
    expect(groupStarts(barInfo([4, 4], 4))).toEqual([0, 1, 2, 3]);
    expect(groupStarts(barInfo([12, 8], 6))).toEqual([0, 1.5, 3, 4.5]);
  });

  it("groups odd eighth meters in twos and a three", () => {
    expect(groupStarts(barInfo([7, 8], 3.5))).toEqual([0, 1, 2]);
    expect(groupStarts(barInfo([5, 8], 2.5))).toEqual([0, 1.5]);
  });

  it("follows the grouping a tab spells with accents", () => {
    // 7/8 as 3+2+2: accents on eighths 1, 4 and 6.
    expect(groupStarts(barInfo([7, 8], 3.5, [0, 1.5, 2.5]))).toEqual([
      0, 1.5, 2.5,
    ]);
  });

  it("does not split a group on accents closer than two eighths", () => {
    // 2+2+3 with the closing note pair accented too, as the meter drills write it.
    expect(groupStarts(barInfo([7, 8], 3.5, [0, 1, 2, 2.5, 3]))).toEqual([
      0, 1, 2,
    ]);
  });
});

describe("groupHits", () => {
  it("is a backbeat in four and the waltz in three", () => {
    expect(groupHits(4)).toEqual(["kick", "snare", "kick", "snare"]);
    expect(groupHits(3)).toEqual(["kick", "snare", "snare"]);
  });
});

describe("chooseGroove", () => {
  const notesOf = (...measures: Parameters<typeof extractTabContent>[0]) => {
    const content = extractTabContent(measures);
    return { bars: content.bars, notes: content.notes, kind: "tonal" as const };
  };

  it("hears triplets as a shuffle", () => {
    const triplets = bar(
      Array.from(
        { length: 12 },
        () => [5, 0, 1 / 3] as [number, number, number],
      ),
    );
    expect(chooseGroove({ ...notesOf(triplets), bpm: 90 })).toBe("shuffle");
  });

  it("takes the style a title names", () => {
    expect(
      chooseGroove({
        ...notesOf(bar(eighths([[6, 0]]))),
        bpm: 120,
        text: "Metal Gallop",
      }),
    ).toBe("metal");
  });

  it("plays compound meters in their own feel", () => {
    const sixEight = bar(
      Array.from({ length: 6 }, () => [5, 0, 0.5] as [number, number, number]),
      [6, 8],
    );
    expect(chooseGroove({ ...notesOf(sixEight), bpm: 90 })).toBe("compound");
  });

  it("slows to a ballad at a slow tempo", () => {
    expect(chooseGroove({ ...notesOf(bar(eighths([[5, 0]]))), bpm: 60 })).toBe(
      "ballad",
    );
  });
});
