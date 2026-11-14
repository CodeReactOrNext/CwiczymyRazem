import { describe, expect, it } from "vitest";

import { createLegatoHold, isLegatoNote, LEGATO_HOLD_MS } from "./legatoHold";

describe("isLegatoNote", () => {
  it("is a hammer-on or a pull-off, nothing else", () => {
    expect(isLegatoNote({ isHammerOn: true })).toBe(true);
    expect(isLegatoNote({ isPullOff: true })).toBe(true);
    expect(isLegatoNote({})).toBe(false);
  });
});

describe("createLegatoHold", () => {
  it("doesn't count a single reading at the right pitch", () => {
    const hold = createLegatoHold();
    expect(hold.observe("n", 1000, true)).toBeNull();
    expect(hold.observe("n", 1000 + LEGATO_HOLD_MS - 1, true)).toBeNull();
  });

  it("counts once the pitch has held, and reports when it came up", () => {
    const hold = createLegatoHold();
    hold.observe("n", 1000, true);
    hold.observe("n", 1030, true);
    expect(hold.observe("n", 1000 + LEGATO_HOLD_MS, true)).toBe(1000);
    // Still the same start however long it rings on.
    expect(hold.observe("n", 1400, true)).toBe(1000);
  });

  it("starts over when the pitch drops out", () => {
    const hold = createLegatoHold();
    hold.observe("n", 1000, true);
    hold.observe("n", 1040, false);
    expect(hold.observe("n", 1070, true)).toBeNull();
    expect(hold.observe("n", 1070 + LEGATO_HOLD_MS, true)).toBe(1070);
  });

  it("follows each note on its own", () => {
    const hold = createLegatoHold();
    hold.observe("a", 1000, true);
    hold.observe("b", 1050, true);
    expect(hold.observe("a", 1060, true)).toBe(1000);
    expect(hold.observe("b", 1060, true)).toBeNull();
  });

  it("forgets a settled note", () => {
    const hold = createLegatoHold();
    hold.observe("n", 1000, true);
    hold.forget("n");
    expect(hold.observe("n", 1100, true)).toBeNull();
  });
});
