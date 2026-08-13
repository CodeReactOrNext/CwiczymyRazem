import { describe, expect, it } from "vitest";

import { isScaleTreeKey, keyOffset, SCALE_TREE_KEYS, transposeFret } from "./scaleTreeKeys";

describe("scale tree keys", () => {
  it("offers all twelve chromatic roots, starting from C", () => {
    expect(SCALE_TREE_KEYS).toHaveLength(12);
    expect(SCALE_TREE_KEYS[0]).toBe("C");
  });

  it("recognises only real keys", () => {
    expect(isScaleTreeKey("F#")).toBe(true);
    expect(isScaleTreeKey("H")).toBe(false);
    expect(isScaleTreeKey(null)).toBe(false);
  });

  it("measures the distance from C", () => {
    expect(keyOffset("C")).toBe(0);
    expect(keyOffset("A")).toBe(9);
    expect(keyOffset("nonsense")).toBe(0);
  });

  it("leaves the tree where it is in C", () => {
    expect(transposeFret(8, "C")).toBe(8);
    expect(transposeFret(1, "C")).toBe(1);
  });

  it("moves shapes to the fret the new root sits on", () => {
    // Minor pentatonic Box 1 lives on fret 8 in C, fret 5 in A.
    expect(transposeFret(8, "A")).toBe(5);
    // Box 2 follows it: fret 10 in C, fret 7 in A.
    expect(transposeFret(10, "A")).toBe(7);
    expect(transposeFret(1, "D")).toBe(3);
  });

  it("keeps every shape inside the first octave", () => {
    for (const key of SCALE_TREE_KEYS) {
      for (const fret of [1, 2, 3, 5, 7, 8, 10]) {
        const moved = transposeFret(fret, key);
        expect(moved).toBeGreaterThanOrEqual(1);
        expect(moved).toBeLessThanOrEqual(12);
      }
    }
  });

  it("leaves single-string nodes (no fret) alone", () => {
    expect(transposeFret(0, "F#")).toBe(0);
  });
});
