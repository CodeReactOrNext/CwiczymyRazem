import { FieldValue } from "firebase-admin/firestore";
import { describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {},
  auth: {},
}));

import {
  countRequest,
  countWrite,
  MCP_EXERCISES_PER_DAY,
  MCP_REQUESTS_PER_MINUTE,
  MCP_WRITES_PER_DAY,
} from "./auth";
import { logDay, resolveTimeZone, skillProgress, todayIn } from "./data";
import { fittedResult, MCP_CHARACTER_LIMIT, pageOf } from "./results";
import { type ScoredRun, summarizeRuns } from "./tools/progress";

describe("countWrite", () => {
  it("says what a write leaves of the day, and starts a new day from zero", () => {
    expect(countWrite(undefined, "2026-10-31", "write")).toEqual({
      next: { day: "2026-10-31", writes: 1, exercises: 0 },
      left: {
        changesLeftToday: MCP_WRITES_PER_DAY - 1,
        newExercisesLeftToday: MCP_EXERCISES_PER_DAY,
      },
    });
    const yesterday = { day: "2026-10-30", writes: 20, exercises: 10 };
    expect(countWrite(yesterday, "2026-10-31", "exercise")).toMatchObject({
      left: {
        changesLeftToday: MCP_WRITES_PER_DAY - 1,
        newExercisesLeftToday: MCP_EXERCISES_PER_DAY - 1,
      },
    });
  });

  it("caps new exercises by the changes left, too", () => {
    const usage = { day: "2026-10-31", writes: 18, exercises: 2 };
    expect(countWrite(usage, "2026-10-31", "write")).toMatchObject({
      left: { changesLeftToday: 1, newExercisesLeftToday: 1 },
    });
  });

  it("refuses past either limit", () => {
    const day = "2026-10-31";
    expect(
      countWrite(
        { day, writes: MCP_WRITES_PER_DAY, exercises: 0 },
        day,
        "write",
      ),
    ).toEqual({ refused: expect.stringMatching(/20 changes/) });
    expect(
      countWrite(
        { day, writes: 3, exercises: MCP_EXERCISES_PER_DAY },
        day,
        "exercise",
      ),
    ).toEqual({ refused: expect.stringMatching(/10 new exercises/) });
  });
});

describe("summarizeRuns", () => {
  const run = (at: string, bpm: number, accuracy: number): ScoredRun => ({
    at: Date.parse(at),
    bpm,
    accuracy,
    clean: accuracy >= 90,
    mode: "practice",
  });

  it("gives one line per exercise, newest first, in the player's days", () => {
    const lines = summarizeRuns(
      [
        {
          exerciseId: "spider",
          title: "Spider",
          runs: [
            run("2026-10-30T18:00:00Z", 80, 95),
            run("2026-10-30T18:05:00Z", 90, 85),
            run("2026-10-30T23:30:00Z", 85, 92),
          ],
        },
        { exerciseId: "never", title: null, runs: [] },
        {
          exerciseId: "legato",
          title: "Legato",
          runs: [run("2026-10-29T10:00:00Z", 100, 70)],
        },
      ],
      "Europe/Warsaw",
    );
    expect(lines.map((line) => line.exerciseId)).toEqual(["spider", "legato"]);
    expect(lines[0]).toMatchObject({
      runs: 3,
      // 23:30 UTC is already the 31st in Warsaw.
      lastDay: "2026-10-31",
      bestBpmAt90PercentAccuracy: 85,
      averageAccuracy: 91,
      latest: { bpm: 85, accuracy: 92 },
    });
    expect(lines[1].bestBpmAt90PercentAccuracy).toBeNull();
  });
});

describe("skillProgress", () => {
  it("falls back to statistics.skills on profiles without top-level skills", () => {
    const older = {
      statistics: {
        skills: {
          unlockedSkills: { legato: 4 },
          timeSpent: { legato: 60_000 },
        },
      },
    } as unknown as Parameters<typeof skillProgress>[0];
    expect(skillProgress(older)).toEqual({
      points: { legato: 4 },
      timeSpent: { legato: 60_000 },
    });
    expect(
      skillProgress({ skills: { unlockedSkills: { vibrato: 1 } } }).points,
    ).toEqual({ vibrato: 1 });
  });
});

describe("days in the player's time zone", () => {
  const warsaw = {
    statistics: { timeZone: "Europe/Warsaw" },
  } as unknown as Parameters<typeof resolveTimeZone>[1];

  it("takes the zone asked for, else the profile's, else UTC", () => {
    expect(resolveTimeZone("America/New_York", warsaw)).toBe(
      "America/New_York",
    );
    expect(resolveTimeZone(undefined, warsaw)).toBe("Europe/Warsaw");
    expect(resolveTimeZone(undefined, {})).toBe("UTC");
    expect(() => resolveTimeZone("Mars/Olympus", warsaw)).toThrow(/IANA name/);
  });

  it("puts a session after local midnight on the player's next day", () => {
    // 23:30 UTC on 30 Oct is 00:30 on 31 Oct in Warsaw (CET, UTC+1).
    expect(logDay("2026-10-30T23:30:00.000Z", "Europe/Warsaw")).toBe(
      "2026-10-31",
    );
    expect(logDay("2026-10-30T23:30:00.000Z", "UTC")).toBe("2026-10-30");
    expect(todayIn("Asia/Tokyo", new Date("2026-10-31T16:00:00Z"))).toBe(
      "2026-11-01",
    );
  });
});

describe("countRequest", () => {
  const now = new Date("2026-10-31T12:00:30Z");
  const bucket = Math.floor(now.getTime() / 60_000);

  it("starts a new minute with a plain write and counts within it atomically", () => {
    expect(countRequest(undefined, now)).toEqual({
      allowed: true,
      update: { minute: { bucket, count: 1 } },
    });
    expect(countRequest({ bucket: bucket - 1, count: 99 }, now)).toEqual({
      allowed: true,
      update: { minute: { bucket, count: 1 } },
    });
    const same = countRequest({ bucket, count: 5 }, now);
    expect(same).toEqual({
      allowed: true,
      update: { "minute.count": FieldValue.increment(1) },
    });
  });

  it("refuses once the minute is used up", () => {
    expect(
      countRequest({ bucket, count: MCP_REQUESTS_PER_MINUTE }, now),
    ).toEqual({ allowed: false });
  });
});

describe("pageOf", () => {
  it("says whether there is more and where it starts", () => {
    const items = Array.from({ length: 7 }, (_, index) => index);
    expect(pageOf(items, 0, 3).meta).toEqual({
      total: 7,
      count: 3,
      offset: 0,
      hasMore: true,
      nextOffset: 3,
    });
    const last = pageOf(items, 6, 3);
    expect(last.items).toEqual([6]);
    expect(last.meta.hasMore).toBe(false);
    expect(last.meta).not.toHaveProperty("nextOffset");
  });
});

describe("fittedResult", () => {
  it("leaves a short answer whole", () => {
    const result = fittedResult((shown) => ({ items: shown }), [1, 2], "x");
    expect(result.structuredContent).toEqual({ items: [1, 2] });
  });

  it("cuts a long list to fit and says how to get the rest", () => {
    const items = Array.from(
      { length: 500 },
      (_, index) => "x".repeat(100) + index,
    );
    const result = fittedResult(
      (shown) => ({ items: shown }),
      items,
      "Ask with an earlier `to`.",
    );
    const text = (result.content[0] as { text: string }).text;
    expect(text.length).toBeLessThanOrEqual(MCP_CHARACTER_LIMIT + 200);
    const data = result.structuredContent as {
      items: string[];
      truncated: boolean;
      truncation: string;
    };
    expect(data.truncated).toBe(true);
    expect(data.items.length).toBeGreaterThan(100);
    expect(data.items.length).toBeLessThan(500);
    expect(data.truncation).toMatch(/of 500.*earlier `to`/);
  });
});
