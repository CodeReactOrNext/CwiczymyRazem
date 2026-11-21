import { describe, expect, it } from "vitest";

import { createPickedSong } from "./sessionSongs";
import {
  getCategoryMinutes,
  stepMinutesDown,
  stepMinutesUp,
  withSongHearingMinutes,
  withSongTotalMinutes,
} from "./timeSteps";

const song = createPickedSong({ id: "one", title: "One", artist: "Metallica" });

describe("stepMinutesUp / stepMinutesDown", () => {
  it("snaps to multiples of five", () => {
    expect(stepMinutesUp(7, 480)).toBe(10);
    expect(stepMinutesUp(10, 480)).toBe(15);
    expect(stepMinutesDown(7)).toBe(5);
    expect(stepMinutesDown(10)).toBe(5);
  });

  it("stays inside 0 and the ceiling", () => {
    expect(stepMinutesUp(478, 480)).toBe(480);
    expect(stepMinutesUp(480, 480)).toBe(480);
    expect(stepMinutesDown(0)).toBe(0);
    expect(stepMinutesDown(3)).toBe(0);
  });
});

describe("getCategoryMinutes", () => {
  it("reads hours and minutes as one number", () => {
    const values = {
      techniqueHours: "1",
      techniqueMinutes: "20",
      theoryHours: "00",
      theoryMinutes: "00",
      hearingHours: "",
      hearingMinutes: "5",
      creativityHours: "0",
      creativityMinutes: "0",
    };
    expect(getCategoryMinutes(values, "technique")).toBe(80);
    expect(getCategoryMinutes(values, "theory")).toBe(0);
    expect(getCategoryMinutes(values, "hearing")).toBe(5);
  });
});

describe("withSongTotalMinutes", () => {
  it("puts the whole time on technique by default", () => {
    expect(withSongTotalMinutes(song, 30)).toMatchObject({
      techniqueMinutes: 30,
      hearingMinutes: 0,
    });
  });

  it("keeps the by-ear part when the total changes", () => {
    const withEar = withSongHearingMinutes(withSongTotalMinutes(song, 30), 10);
    expect(withSongTotalMinutes(withEar, 45)).toMatchObject({
      techniqueMinutes: 35,
      hearingMinutes: 10,
    });
  });

  it("trims the by-ear part when the total drops below it", () => {
    const withEar = withSongHearingMinutes(withSongTotalMinutes(song, 30), 20);
    expect(withSongTotalMinutes(withEar, 15)).toMatchObject({
      techniqueMinutes: 0,
      hearingMinutes: 15,
    });
  });

  it("clamps to the song ceiling", () => {
    const result = withSongTotalMinutes(song, 9999);
    expect(result.techniqueMinutes + result.hearingMinutes).toBe(480);
    expect(withSongTotalMinutes(song, -5).techniqueMinutes).toBe(0);
  });
});

describe("withSongHearingMinutes", () => {
  it("moves time to hearing without changing the total", () => {
    const result = withSongHearingMinutes(withSongTotalMinutes(song, 30), 10);
    expect(result).toMatchObject({ techniqueMinutes: 20, hearingMinutes: 10 });
  });

  it("never exceeds the song's time", () => {
    const result = withSongHearingMinutes(withSongTotalMinutes(song, 30), 50);
    expect(result).toMatchObject({ techniqueMinutes: 0, hearingMinutes: 30 });
  });
});
