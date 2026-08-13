import { describe, expect, it } from "vitest";

import type { ReportSongEntry } from "../ReportView.types";
import {
  buildSongsSessionTitle,
  createPickedSong,
  DEFAULT_TECHNIQUE_MINUTES,
  MINUTE_MS,
  type PickedSong,
  pickPrimarySong,
  sumSongMinutes,
  toReportSongEntries,
} from "./sessionSongs";

const picked = (
  id: string,
  techniqueMinutes: number,
  hearingMinutes = 0,
  title = id
): PickedSong => ({
  id,
  title,
  artist: "Artist",
  techniqueMinutes,
  hearingMinutes,
});

const entry = (songId: string, minutes: number): ReportSongEntry => ({
  songId,
  songTitle: songId,
  songArtist: "Artist",
  practiceMs: minutes * MINUTE_MS,
  techniqueMs: minutes * MINUTE_MS,
  hearingMs: 0,
});

describe("createPickedSong", () => {
  it("arrives with one repeat block already on it, so adding a song is one tap", () => {
    const song = createPickedSong({ id: "a", title: "One", artist: "Metallica" });

    expect(song.techniqueMinutes).toBe(DEFAULT_TECHNIQUE_MINUTES);
    expect(song.hearingMinutes).toBe(0);
  });
});

describe("sumSongMinutes", () => {
  it("adds each category across the songs", () => {
    expect(sumSongMinutes([picked("a", 10, 5), picked("b", 5, 5)])).toEqual({
      technique: 15,
      hearing: 10,
    });
  });

  it("is all zeroes without songs", () => {
    expect(sumSongMinutes([])).toEqual({ technique: 0, hearing: 0 });
  });
});

describe("toReportSongEntries", () => {
  it("carries the identity and both category times of every song", () => {
    expect(toReportSongEntries([picked("id-1", 10, 5, "One")])).toEqual([
      {
        songId: "id-1",
        songTitle: "One",
        songArtist: "Artist",
        techniqueMs: 10 * MINUTE_MS,
        hearingMs: 5 * MINUTE_MS,
        practiceMs: 15 * MINUTE_MS,
      },
    ]);
  });

  it("drops songs left at zero — they were picked but not practised", () => {
    const entries = toReportSongEntries([picked("a", 10), picked("b", 0, 0)]);

    expect(entries.map((song) => song.songId)).toEqual(["a"]);
  });

  it("keeps a song that only got hearing time", () => {
    expect(toReportSongEntries([picked("a", 0, 5)])).toHaveLength(1);
  });

  it("is empty without songs", () => {
    expect(toReportSongEntries([])).toEqual([]);
  });
});

describe("pickPrimarySong", () => {
  it("picks the song that got the most time", () => {
    expect(pickPrimarySong([entry("a", 5), entry("b", 20), entry("c", 10)])?.songId).toBe(
      "b"
    );
  });

  it("keeps the first pick when the times are equal", () => {
    expect(pickPrimarySong([entry("a", 5), entry("b", 5)])?.songId).toBe("a");
  });

  it("has no primary song without songs", () => {
    expect(pickPrimarySong([])).toBeUndefined();
  });
});

describe("buildSongsSessionTitle", () => {
  it("reads as artist - title for a single song", () => {
    expect(buildSongsSessionTitle([{ title: "One", artist: "Metallica" }])).toBe(
      "Metallica - One"
    );
  });

  it("falls back to the bare title when the artist is unknown", () => {
    expect(buildSongsSessionTitle([{ title: "One", artist: "" }])).toBe("One");
  });

  it("counts and lists the songs of a run", () => {
    expect(
      buildSongsSessionTitle([
        { title: "One", artist: "Metallica" },
        { title: "Fade to Black", artist: "Metallica" },
      ])
    ).toBe("2 songs: One, Fade to Black");
  });

  it("stays inside the report title limit, counting off the rest", () => {
    const songs = Array.from({ length: 12 }, (_, i) => ({
      title: `A fairly long song title number ${i}`,
      artist: "Artist",
    }));

    const title = buildSongsSessionTitle(songs);

    expect(title.length).toBeLessThanOrEqual(120);
    expect(title).toMatch(/^12 songs: /);
    expect(title).toMatch(/\+\d+ more$/);
  });

  it("is empty without songs", () => {
    expect(buildSongsSessionTitle([])).toBe("");
  });
});
