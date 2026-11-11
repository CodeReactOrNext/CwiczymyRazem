import { describe, expect, it } from "vitest";

import { diffMarks, sameMarks } from "./noteMarkPatch";

describe("diffMarks", () => {
  it("sends everything when the worker holds nothing known", () => {
    const next = { a: true };
    expect(diffMarks(null, next)).toEqual({ kind: "full", marks: next });
  });

  it("sends nothing when nothing changed", () => {
    expect(diffMarks({ a: true, b: 2 }, { a: true, b: 2 })).toBeNull();
    const same = { a: true };
    expect(diffMarks(same, same)).toBeNull();
  });

  it("sends only the notes that are new or different", () => {
    const sent: Record<string, boolean | number> = { a: true, b: 1.5 };
    expect(diffMarks(sent, { a: true, b: 2, c: 3 })).toEqual({ kind: "patch", marks: { b: 2, c: 3 } });
  });

  it("compares timings by identity, so a replaced one is sent", () => {
    const kept = { grade: 3 };
    const sent = { a: kept, b: { grade: 2 } };
    const replaced = { grade: 2, intonation: 1 };
    expect(diffMarks(sent, { a: kept, b: replaced })).toEqual({ kind: "patch", marks: { b: replaced } });
  });

  it("sends everything once a note lost its mark", () => {
    const next = { c: true };
    expect(diffMarks({ a: true, b: true }, next)).toEqual({ kind: "full", marks: next });
    // Same count, another note: one gone, one new.
    expect(diffMarks({ a: true }, next)).toEqual({ kind: "full", marks: next });
    expect(diffMarks({ a: true }, {})).toEqual({ kind: "full", marks: {} });
  });
});

describe("sameMarks", () => {
  it("is true for the same notes with the same marks", () => {
    expect(sameMarks({}, {})).toBe(true);
    expect(sameMarks({ a: true, b: 2 }, { b: 2, a: true })).toBe(true);
  });

  it("is false when a note is missing, extra or different", () => {
    expect(sameMarks({ a: true }, {})).toBe(false);
    expect(sameMarks({}, { a: true })).toBe(false);
    expect(sameMarks({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameMarks({ a: true }, { b: true })).toBe(false);
  });
});
