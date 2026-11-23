import type {
  Roadmap,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import {
  dueSongRequests,
  linkFoundSongs,
  SONG_RELINK_EVERY_MS,
  songRequestKey,
} from "./songRelink";

const NOW = Date.parse("2026-11-23T12:00:00Z");

const step = (id: string, overrides: Partial<RoadmapStep> = {}): RoadmapStep => ({
  id,
  title: id,
  description: "",
  successCriteria: "",
  sessionsRequired: 6,
  sessionsCompleted: 0,
  order: 0,
  ...overrides,
});

const romeo = { title: "Romeo and Juliet", artist: "Dire Straits" };
const sultans = { title: "Sultans of Swing", artist: "Dire Straits" };

const roadmap = (overrides: Partial<Roadmap> = {}): Roadmap => ({
  id: "r1",
  userId: "u1",
  title: "Mark Knopfler",
  goal: "",
  level: "Intermediate",
  createdAt: "",
  updatedAt: "",
  phases: [
    {
      id: "p1",
      title: "Songs",
      order: 0,
      steps: [
        step("a", { songRequest: romeo }),
        step("b", { songRequest: romeo }),
        step("c", { songRequest: sultans }),
        step("d", {
          songRequest: sultans,
          suggestedSong: { id: "x", ...sultans },
        }),
        step("e"),
      ],
    },
  ],
  ...overrides,
});

describe("dueSongRequests", () => {
  it("lists each waiting song once, and skips steps that already have one", () => {
    expect(dueSongRequests(roadmap(), NOW)).toEqual([romeo, sultans]);
  });

  it("waits a day between checks", () => {
    const recent = new Date(NOW - SONG_RELINK_EVERY_MS + 60_000).toISOString();
    const old = new Date(NOW - SONG_RELINK_EVERY_MS - 60_000).toISOString();
    expect(dueSongRequests(roadmap({ songsCheckedAt: recent }), NOW)).toEqual(
      [],
    );
    expect(dueSongRequests(roadmap({ songsCheckedAt: old }), NOW)).toHaveLength(
      2,
    );
  });
});

describe("linkFoundSongs", () => {
  it("puts a found song on every step that asked for it and drops the request", () => {
    const found = new Map([
      [songRequestKey(romeo), { id: "song-1", ...romeo, title: "Romeo And Juliet" }],
    ]);
    const { phases, linked } = linkFoundSongs(roadmap().phases, found);
    const [a, b, c] = phases[0].steps;

    expect(linked).toBe(2);
    expect(a.suggestedSong?.id).toBe("song-1");
    expect(a.songRequest).toBeUndefined();
    expect(b.suggestedSong?.id).toBe("song-1");
    // Still waiting: nothing was found for it.
    expect(c.songRequest).toEqual(sultans);
    expect(c.suggestedSong).toBeUndefined();
  });

  it("hands the same phases back when nothing was found", () => {
    const phases = roadmap().phases;
    expect(linkFoundSongs(phases, new Map())).toEqual({ phases, linked: 0 });
  });
});
