import { describe, expect, it } from "vitest";

import { resolveSongsReturnPath, SONGS_PAGE_PATH } from "./songsReturnPath";

describe("resolveSongsReturnPath", () => {
  it("falls back to the songs board when no returnTo is given", () => {
    expect(resolveSongsReturnPath(undefined)).toBe(SONGS_PAGE_PATH);
    expect(resolveSongsReturnPath("")).toBe(SONGS_PAGE_PATH);
  });

  it("keeps a local path", () => {
    expect(resolveSongsReturnPath("/favorites")).toBe("/favorites");
    expect(resolveSongsReturnPath("/songs?view=playlists")).toBe("/songs?view=playlists");
  });

  it("takes the first value of a repeated query param", () => {
    expect(resolveSongsReturnPath(["/favorites", "/dashboard"])).toBe("/favorites");
  });

  it("rejects non-local destinations", () => {
    expect(resolveSongsReturnPath("https://evil.com")).toBe(SONGS_PAGE_PATH);
    expect(resolveSongsReturnPath("//evil.com")).toBe(SONGS_PAGE_PATH);
    expect(resolveSongsReturnPath("/\\evil.com")).toBe(SONGS_PAGE_PATH);
  });
});
