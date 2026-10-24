import type { SongSection } from "feature/songs/types/songSection.type";
import { describe, expect, it } from "vitest";

import {
  findSectionIndexAt,
  formatSectionTime,
  newSectionStart,
  nextSectionName,
  sortSections,
} from "./sectionTimes.utils";

const section = (id: string, startTime: number): SongSection => ({
  id,
  name: id,
  startTime,
  color: "#3b82f6",
  mastery: 0,
});

describe("formatSectionTime", () => {
  it("pads seconds and drops fractions", () => {
    expect(formatSectionTime(0)).toBe("0:00");
    expect(formatSectionTime(91.7)).toBe("1:31");
    expect(formatSectionTime(605)).toBe("10:05");
  });
});

describe("findSectionIndexAt", () => {
  const sorted = sortSections([
    section("verse", 20),
    section("intro", 0),
    section("chorus", 50),
  ]);

  it("finds the section the time falls in", () => {
    expect(findSectionIndexAt(sorted, 0)).toBe(0);
    expect(findSectionIndexAt(sorted, 35)).toBe(1);
    expect(findSectionIndexAt(sorted, 50)).toBe(2);
    expect(findSectionIndexAt(sorted, 999)).toBe(2);
  });

  it("returns -1 before the first section", () => {
    expect(findSectionIndexAt(sortSections([section("verse", 20)]), 5)).toBe(
      -1,
    );
    expect(findSectionIndexAt([], 5)).toBe(-1);
  });
});

describe("newSectionStart", () => {
  it("starts at the playhead when nothing starts there", () => {
    expect(newSectionStart([], 0, 200)).toBe(0);
    expect(newSectionStart([section("intro", 0)], 42.8, 200)).toBe(42);
  });

  it("splits the section it lands on instead of stacking at 0:00", () => {
    expect(
      newSectionStart([section("intro", 0), section("verse", 30)], 0, 200),
    ).toBe(15);
  });

  it("splits the last section up to the end of the video", () => {
    expect(newSectionStart([section("intro", 0)], 0, 200)).toBe(100);
  });

  it("falls back to a fixed length when the duration isn't known", () => {
    expect(newSectionStart([section("intro", 0)], 0, 0)).toBe(15);
  });
});

describe("nextSectionName", () => {
  it("keeps a name nobody uses yet", () => {
    expect(nextSectionName([section("Intro", 0)], "Verse")).toBe("Verse");
  });

  it("numbers a name the song already has", () => {
    expect(nextSectionName([section("Verse", 0)], "Verse")).toBe("Verse 2");
    expect(
      nextSectionName([section("Verse", 0), section("Verse 2", 30)], "Verse"),
    ).toBe("Verse 3");
  });
});
