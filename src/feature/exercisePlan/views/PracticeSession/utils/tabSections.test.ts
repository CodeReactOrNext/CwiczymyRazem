import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { buildTabSections, sectionBarRange, sectionIndexOfBar } from "./tabSections";

const bars = (...sections: (string | undefined)[]): TablatureMeasure[] =>
  sections.map((section) => ({
    timeSignature: [4, 4],
    beats: [{ duration: 4, notes: [] }],
    ...(section ? { section } : {}),
  }));

describe("buildTabSections", () => {
  it("finds no sections in a song without markers", () => {
    expect(buildTabSections(bars(undefined, undefined))).toEqual([]);
  });

  it("runs each section up to the next marker", () => {
    expect(buildTabSections(bars("Intro", undefined, "Solo", undefined, undefined, "Outro"))).toEqual([
      { name: "Intro", lo: 0, hi: 1 },
      { name: "Solo", lo: 2, hi: 4 },
      { name: "Outro", lo: 5, hi: 5 },
    ]);
  });

  it("gives the bars before the first marker a nameless section", () => {
    expect(buildTabSections(bars(undefined, undefined, "Verse"))).toEqual([
      { lo: 0, hi: 1 },
      { name: "Verse", lo: 2, hi: 2 },
    ]);
  });
});

describe("sectionIndexOfBar", () => {
  const sections = buildTabSections(bars("Intro", undefined, "Solo", undefined));

  it("names the section a bar is in", () => {
    expect([0, 1, 2, 3].map((bar) => sectionIndexOfBar(sections, bar))).toEqual([0, 0, 1, 1]);
  });

  it("is -1 when the song has no sections", () => {
    expect(sectionIndexOfBar([], 3)).toBe(-1);
  });
});

describe("sectionBarRange", () => {
  it("counts bars from one", () => {
    expect(sectionBarRange({ lo: 151, hi: 160 })).toBe("152–161");
    expect(sectionBarRange({ lo: 4, hi: 4 })).toBe("5");
  });
});
