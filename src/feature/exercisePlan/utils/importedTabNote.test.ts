import { describe, expect, it } from "vitest";

import { importedTabNote } from "./importedTabNote";

describe("importedTabNote", () => {
  it("keeps a muted note muted", () => {
    expect(importedTabNote({ string: 6, fret: 0, isDead: true })).toEqual({
      string: 6,
      fret: 0,
      isDead: true,
    });
  });

  it("keeps the techniques the editor exports", () => {
    const note = importedTabNote({
      string: 2,
      fret: 7,
      isPalmMute: true,
      isVibrato: true,
      isTap: true,
      isGhost: true,
      slideIn: 1,
      harmonicType: 1,
      finger: 3,
    });
    expect(note).toEqual({
      string: 2,
      fret: 7,
      isPalmMute: true,
      isVibrato: true,
      isTap: true,
      isGhost: true,
      slideIn: 1,
      harmonicType: 1,
      finger: 3,
    });
  });

  it("keeps a bend curve and its badge", () => {
    const bendCurve = [
      { position: 0, cents: 0 },
      { position: 1, cents: 200 },
    ];
    expect(
      importedTabNote({ string: 3, fret: 7, isBend: true, bendSemitones: 2, bendCurve }),
    ).toEqual({ string: 3, fret: 7, isBend: true, bendSemitones: 2, bendCurve });
  });

  it("leaves off what is unset or malformed", () => {
    expect(
      importedTabNote({ string: 1, fret: 5, isDead: false, slideIn: "up", finger: 7, bendCurve: [1, 2] }),
    ).toEqual({ string: 1, fret: 5 });
  });
});
