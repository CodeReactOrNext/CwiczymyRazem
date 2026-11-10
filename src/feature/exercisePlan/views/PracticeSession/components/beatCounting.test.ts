import { describe, expect, it } from "vitest";

import { beatCountLabels, beatTickPositions } from "./beatCounting";

const beatsAt = (...offsets: number[]) => offsets.map((offsetX) => ({ offsetX }));
const labels = (counts: ReturnType<typeof beatCountLabels>) => counts.map((count) => count?.label ?? null);

describe("beatCountLabels", () => {
  it("counts sixteenths as 1 e & a", () => {
    const counts = beatCountLabels(beatsAt(0, 0.25, 0.5, 0.75, 1), [4], [{ x: 0, sig: [4, 4] }]);
    expect(labels(counts)).toEqual(["1", "e", "&", "a", "2"]);
    expect(counts.map((count) => count?.onBeat)).toEqual([true, false, false, false, true]);
  });

  it("starts over in every bar", () => {
    expect(labels(beatCountLabels(beatsAt(0, 1, 2, 3, 4, 5), [4, 8], [{ x: 0, sig: [4, 4] }]))).toEqual([
      "1", "2", "3", "4", "1", "2",
    ]);
  });

  it("counts eighths as beats in 6/8", () => {
    expect(labels(beatCountLabels(beatsAt(0, 0.5, 1, 1.5, 2, 2.5), [3], [{ x: 0, sig: [6, 8] }]))).toEqual([
      "1", "2", "3", "4", "5", "6",
    ]);
  });

  it("follows a change of time signature", () => {
    const changes = [{ x: 0, sig: [4, 4] as const }, { x: 4, sig: [6, 8] as const }];
    expect(labels(beatCountLabels(beatsAt(3, 3.5, 4, 4.5, 5), [4, 7], changes))).toEqual(["4", "&", "1", "2", "3"]);
  });

  it("leaves the inside of a triplet uncounted", () => {
    expect(labels(beatCountLabels(beatsAt(0, 1 / 3, 2 / 3, 1), [4], [{ x: 0, sig: [4, 4] }]))).toEqual([
      "1", null, null, "2",
    ]);
  });

  it("assumes quarter-note beats when no signature is known", () => {
    expect(labels(beatCountLabels(beatsAt(0, 0.5, 1), [4], []))).toEqual(["1", "&", "2"]);
  });
});

describe("beatTickPositions", () => {
  it("marks every beat but each bar's first", () => {
    expect(beatTickPositions([4, 8], [{ x: 0, sig: [4, 4] }])).toEqual([1, 2, 3, 5, 6, 7]);
  });

  it("follows the time signature's beat", () => {
    expect(beatTickPositions([3], [{ x: 0, sig: [6, 8] }])).toEqual([0.5, 1, 1.5, 2, 2.5]);
  });

  it("returns nothing for an empty tab", () => {
    expect(beatTickPositions([], [])).toEqual([]);
  });
});
