import type { SongSection } from "feature/songs/types/songSection.type";
import { describe, expect, it } from "vitest";

import {
  formatPlayTime,
  getPracticedArrangements,
  getSectionMastery,
  getSectionsMasteryPct,
  parseArrangement,
  setSectionMastery,
  toArrangementProgressMap,
} from "./arrangements.utils";

const section: SongSection = {
  id: "s1",
  name: "Verse",
  startTime: 0,
  color: "#fff",
  mastery: 2,
};

describe("parseArrangement", () => {
  it("accepts known arrangements, also from a query array", () => {
    expect(parseArrangement("lead")).toBe("lead");
    expect(parseArrangement(["rhythm", "lead"])).toBe("rhythm");
  });

  it("drops unknown values", () => {
    expect(parseArrangement("drums")).toBeUndefined();
    expect(parseArrangement(undefined)).toBeUndefined();
    expect(parseArrangement(3)).toBeUndefined();
  });
});

describe("toArrangementProgressMap", () => {
  it("maps Firestore data, converting timestamps", () => {
    const date = new Date("2026-09-01T10:00:00Z");
    const map = toArrangementProgressMap({
      lead: {
        totalPracticeMs: 120000,
        sessionCount: 2,
        lastPracticedAt: { toDate: () => date },
        parts: ["solo"],
      },
    });
    expect(map.lead).toEqual({
      totalPracticeMs: 120000,
      sessionCount: 2,
      lastPracticedAt: date,
      parts: ["solo"],
    });
  });

  it("fills defaults for partial entries (parts written before any time)", () => {
    expect(toArrangementProgressMap({ rhythm: { parts: ["riff"] } }).rhythm).toEqual({
      totalPracticeMs: 0,
      sessionCount: 0,
      lastPracticedAt: null,
      parts: ["riff"],
    });
  });

  it("skips unknown keys and garbage", () => {
    expect(toArrangementProgressMap({ drums: { sessionCount: 1 }, bass: null })).toEqual({});
    expect(toArrangementProgressMap(undefined)).toEqual({});
  });
});

describe("getPracticedArrangements", () => {
  it("returns only arrangements with time, in display order", () => {
    const practiced = getPracticedArrangements({
      bass: { totalPracticeMs: 60000, sessionCount: 1, lastPracticedAt: null, parts: [] },
      rhythm: { totalPracticeMs: 0, sessionCount: 0, lastPracticedAt: null, parts: ["riff"] },
      lead: { totalPracticeMs: 1000, sessionCount: 1, lastPracticedAt: null, parts: [] },
    });
    expect(practiced.map((p) => p.arrangement)).toEqual(["lead", "bass"]);
  });
});

describe("section mastery per arrangement", () => {
  it("reads the song-wide mastery when no arrangement is picked", () => {
    expect(getSectionMastery(section, null)).toBe(2);
  });

  it("treats a missing arrangement mastery as not learned", () => {
    expect(getSectionMastery(section, "lead")).toBe(0);
  });

  it("sets one arrangement without touching the others or the song-wide value", () => {
    const lead = setSectionMastery(section, "lead", 3);
    const both = setSectionMastery(lead, "rhythm", 1);
    expect(both.arrangementMastery).toEqual({ lead: 3, rhythm: 1 });
    expect(both.mastery).toBe(2);
    expect(getSectionMastery(both, "lead")).toBe(3);
  });

  it("sets the song-wide value when no arrangement is picked", () => {
    expect(setSectionMastery(section, null, 3).mastery).toBe(3);
  });
});

describe("getSectionsMasteryPct", () => {
  const sections: SongSection[] = [
    { ...section, id: "a", mastery: 3, arrangementMastery: { lead: 3 } },
    { ...section, id: "b", mastery: 0, arrangementMastery: { lead: 0, rhythm: 3 } },
    { ...section, id: "c", mastery: 4, arrangementMastery: { lead: 4 } },
  ];

  it("weights levels and ignores skipped sections", () => {
    expect(getSectionsMasteryPct(sections, null)).toBe(50);
    expect(getSectionsMasteryPct(sections, "lead")).toBe(50);
  });

  it("scores each arrangement on its own", () => {
    // rhythm: a=0 (missing), b=3, c=0 (missing) → 1/3
    expect(getSectionsMasteryPct(sections, "rhythm")).toBe(33);
  });

  it("returns null without sections to measure", () => {
    expect(getSectionsMasteryPct([], "lead")).toBeNull();
  });
});

describe("formatPlayTime", () => {
  it("formats minutes and hours", () => {
    expect(formatPlayTime(30_000)).toBe("<1m");
    expect(formatPlayTime(4 * 60_000)).toBe("4m");
    expect(formatPlayTime(80 * 60_000)).toBe("1h 20m");
  });
});
