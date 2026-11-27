import { describe, expect, it } from "vitest";

import { revealNotes } from "./caseSounds";

describe("revealNotes", () => {
  it("climbs further for a better pull", () => {
    expect(revealNotes("Common")).toHaveLength(2);
    expect(revealNotes("Rare")).toHaveLength(3);
    expect(revealNotes("Epic")).toHaveLength(4);
    expect(revealNotes("Legendary")).toHaveLength(5);
    expect(revealNotes("Mythic")).toHaveLength(6);
  });

  it("lets the last note ring longest", () => {
    const notes = revealNotes("Epic");
    const last = notes[notes.length - 1];
    expect(notes.slice(0, -1).every((n) => n.length < last.length)).toBe(true);
  });
});
