import { describe, expect, it } from "vitest";

import { buildLastPracticedUpdate, collectPracticed } from "./lastPracticed";

const NOW = 1_760_000_000_000;

describe("collectPracticed", () => {
  const exercises = [
    { id: "alt-1", relatedSkills: ["alternate_picking" as const] },
    {
      id: "song-s1",
      relatedSkills: [],
      songData: { songId: "s1", title: "T", artist: "A" },
    },
    {
      id: "legato-1",
      relatedSkills: ["legato" as const, "alternate_picking" as const],
    },
    { id: "skipped", relatedSkills: ["tapping" as const] },
  ];

  it("keeps the exercises played for 20 s and the skills they train", () => {
    expect(collectPracticed(exercises, [0, 1, 2])).toEqual({
      practiced: {
        exerciseIds: ["alt-1", "legato-1"],
        skillIds: ["alternate_picking", "legato"],
      },
    });
  });

  it("adds nothing when no exercise counted", () => {
    expect(collectPracticed(exercises, [1])).toEqual({});
    expect(collectPracticed(exercises, [])).toEqual({});
  });
});

describe("buildLastPracticedUpdate", () => {
  it("stamps the songs of a routine that got real time, with exercises and skills", () => {
    expect(
      buildLastPracticedUpdate(
        {
          songId: "s1",
          songs: [
            { songId: "s1", practiceMs: 300_000 },
            { songId: "s2", practiceMs: 5_000 },
          ],
          practiced: {
            exerciseIds: ["alt-1"],
            skillIds: ["alternate_picking"],
          },
        },
        NOW,
      ),
    ).toEqual({
      lastPracticed: {
        song: { s1: NOW },
        exercise: { "alt-1": NOW },
        skill: { alternate_picking: NOW },
      },
    });
  });

  it("falls back to the single song a song session or manual log names", () => {
    expect(buildLastPracticedUpdate({ songId: "s9" }, NOW)).toEqual({
      lastPracticed: { song: { s9: NOW } },
    });
  });

  it("drops anything that isn't a sane id", () => {
    expect(
      buildLastPracticedUpdate(
        {
          songId: 42,
          practiced: {
            exerciseIds: ["", "x".repeat(101), "__name__", null, "ok", "ok"],
            skillIds: "legato",
          },
        },
        NOW,
      ),
    ).toEqual({ lastPracticed: { exercise: { ok: NOW } } });
  });

  it("returns null when nothing was played", () => {
    expect(buildLastPracticedUpdate({}, NOW)).toBeNull();
    expect(buildLastPracticedUpdate({ practiced: "nope" }, NOW)).toBeNull();
  });
});

describe("custom rotation items", () => {
  it("come back from a session as customIds, by their own id", () => {
    expect(
      collectPracticed(
        [
          { id: "rotation-custom-c1", relatedSkills: [] },
          { id: "alt-1", relatedSkills: ["alternate_picking" as const] },
        ],
        [0, 1],
      ),
    ).toEqual({
      practiced: {
        exerciseIds: ["alt-1"],
        skillIds: ["alternate_picking"],
        customIds: ["c1"],
      },
    });
  });

  it("get stamped under custom", () => {
    expect(
      buildLastPracticedUpdate(
        { practiced: { exerciseIds: [], skillIds: [], customIds: ["c1"] } },
        NOW,
      ),
    ).toEqual({ lastPracticed: { custom: { c1: NOW } } });
  });
});
