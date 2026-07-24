import type { SongPart } from "feature/songs/types/songs.type";
import { describe, expect, it } from "vitest";

import { isPartCovered, toggleSongPart } from "./songParts.utils";

describe("toggleSongPart", () => {
  it("adds a part that is not marked yet", () => {
    expect(toggleSongPart([], "riff")).toEqual(["riff"]);
    expect(toggleSongPart(["riff"], "solo")).toEqual(["riff", "solo"]);
  });

  it("removes a part that is already marked", () => {
    expect(toggleSongPart(["riff", "solo"], "riff")).toEqual(["solo"]);
  });

  it("ignores taps on riff/solo while wholeSong is marked", () => {
    const parts: SongPart[] = ["wholeSong"];
    expect(toggleSongPart(parts, "riff")).toBe(parts);
    expect(toggleSongPart(parts, "solo")).toBe(parts);
  });

  it("toggles wholeSong on without wiping riff/solo marks", () => {
    expect(toggleSongPart(["riff"], "wholeSong")).toEqual(["riff", "wholeSong"]);
  });

  it("toggles wholeSong off and restores riff/solo interactivity", () => {
    const next = toggleSongPart(["riff", "wholeSong"], "wholeSong");
    expect(next).toEqual(["riff"]);
    expect(isPartCovered(next, "riff")).toBe(false);
  });
});

describe("isPartCovered", () => {
  it("covers riff and solo only while wholeSong is marked", () => {
    expect(isPartCovered(["wholeSong"], "riff")).toBe(true);
    expect(isPartCovered(["wholeSong"], "solo")).toBe(true);
    expect(isPartCovered(["riff", "solo"], "riff")).toBe(false);
  });

  it("never covers wholeSong itself", () => {
    expect(isPartCovered(["wholeSong"], "wholeSong")).toBe(false);
  });
});
