import { describe, expect, it } from "vitest";

import { gradedNoteCount, isMuteStrum } from "./muteStrum";

const dead = { isDead: true };
const fretted = { isDead: false };

describe("isMuteStrum", () => {
  it("is a scratch across several muted strings", () => {
    expect(isMuteStrum([dead, dead, dead])).toBe(true);
  });

  it("leaves a single dead note alone", () => {
    expect(isMuteStrum([dead])).toBe(false);
  });

  it("leaves a chord with a muted string inside it alone", () => {
    expect(isMuteStrum([fretted, dead, fretted])).toBe(false);
  });

  it("is never a rest", () => {
    expect(isMuteStrum([])).toBe(false);
  });
});

describe("gradedNoteCount", () => {
  it("counts a mute strum once", () => {
    expect(gradedNoteCount([dead, dead, dead, dead, dead, dead])).toBe(1);
  });

  it("counts every note of an ordinary chord", () => {
    expect(gradedNoteCount([fretted, dead, fretted])).toBe(3);
  });
});
