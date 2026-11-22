import type { PracticeLogSession } from "feature/practiceLog/types/practiceLog.types";
import { describe, expect, it } from "vitest";

import { getSessionSongMs, getSongPracticeDays } from "./songPracticeDays";

const session = (overrides: Partial<PracticeLogSession>): PracticeLogSession => ({
  id: "r",
  date: new Date(2026, 10, 20, 18, 0),
  title: "Session",
  type: "manual",
  isManual: false,
  points: 0,
  timeMs: 0,
  ...overrides,
});

const song = (songId: string, practiceMs: number) => ({
  songId,
  songTitle: songId,
  songArtist: "",
  practiceMs,
  techniqueMs: practiceMs,
  hearingMs: 0,
});

describe("getSessionSongMs", () => {
  it("counts a whole song session", () => {
    expect(getSessionSongMs(session({ type: "song", timeMs: 600_000 }))).toBe(600_000);
  });

  it("sums the per-song breakdown of a routine", () => {
    expect(
      getSessionSongMs(
        session({ type: "plan", timeMs: 1_800_000, songs: [song("a", 300_000), song("b", 120_000)] }),
      ),
    ).toBe(420_000);
  });

  it("ignores sessions without songs", () => {
    expect(getSessionSongMs(session({ type: "plan", timeMs: 900_000 }))).toBe(0);
    expect(getSessionSongMs(session({ type: "manual", timeMs: 900_000 }))).toBe(0);
  });
});

describe("getSongPracticeDays", () => {
  it("adds up song time per day and skips days without songs", () => {
    const rows = getSongPracticeDays([
      session({ type: "song", timeMs: 600_000 }),
      session({ type: "plan", date: new Date(2026, 10, 20, 9, 0), songs: [song("a", 60_000)] }),
      session({ type: "manual", date: new Date(2026, 10, 21), timeMs: 600_000 }),
      session({ type: "song", date: new Date(2026, 10, 22), timeMs: 30_000 }),
    ]);

    expect(rows.map((row) => row.techniqueTime)).toEqual([660_000, 30_000]);
    expect(rows.every((row) => row.theoryTime + row.hearingTime + row.creativityTime === 0)).toBe(
      true,
    );
  });
});
