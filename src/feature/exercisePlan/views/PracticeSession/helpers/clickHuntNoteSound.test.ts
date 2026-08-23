// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  loadClickHuntNoteSoundPreference,
  midiForPosition,
  pickReferenceMidi,
  saveClickHuntNoteSoundPreference,
} from "./clickHuntNoteSound";

describe("clickHuntNoteSound preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to on when nothing was persisted", () => {
    expect(loadClickHuntNoteSoundPreference()).toBe(true);
  });

  it("round-trips an explicit opt-out", () => {
    saveClickHuntNoteSoundPreference(false);
    expect(loadClickHuntNoteSoundPreference()).toBe(false);
    saveClickHuntNoteSoundPreference(true);
    expect(loadClickHuntNoteSoundPreference()).toBe(true);
  });
});

describe("midiForPosition", () => {
  it("maps open strings to standard tuning", () => {
    expect(midiForPosition(1, 0)).toBe(64); // high E4
    expect(midiForPosition(6, 0)).toBe(40); // low E2
  });

  it("adds one semitone per fret", () => {
    expect(midiForPosition(5, 12)).toBe(57); // A2 → A3
  });

  it("returns -1 for a string outside 1-6", () => {
    expect(midiForPosition(7, 3)).toBe(-1);
  });
});

describe("pickReferenceMidi", () => {
  it("uses the lowest position inside the exercise window", () => {
    const positions = [
      { string: 1, fret: 5 }, // A4 = 69
      { string: 5, fret: 0 }, // A2 = 45
      { string: 3, fret: 2 }, // A3 = 57
    ];
    expect(pickReferenceMidi(positions, "A")).toBe(45);
  });

  it("falls back to the note's middle-register octave with no positions", () => {
    expect(pickReferenceMidi([], "G")).toBe(55); // G3, the floor itself
    expect(pickReferenceMidi([], "A")).toBe(57); // A3
    expect(pickReferenceMidi([], "C")).toBe(60); // C4, wrapping past the floor
  });

  it("returns null for an unknown note name", () => {
    expect(pickReferenceMidi([], "H")).toBeNull();
  });
});
