import { describe, expect, it } from "vitest";

import {
  buildSongSectionMapId,
  extractVideoId,
  pickSongSpeeds,
  SONG_SPEED_FALLBACK,
} from "./youtube.utils";

describe("extractVideoId", () => {
  it("extracts the id from a watch?v= URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts the id from a watch URL with extra query params before v=", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from a youtu.be short URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from an /embed/ URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("stops at trailing params like &t=30s", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for a non-YouTube URL", () => {
    expect(extractVideoId("https://example.com/not-youtube")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(extractVideoId("not a url at all")).toBeNull();
  });
});

describe("buildSongSectionMapId", () => {
  it("joins songId and videoId with a double underscore", () => {
    expect(buildSongSectionMapId("song123", "dQw4w9WgXcQ")).toBe(
      "song123__dQw4w9WgXcQ"
    );
  });
});

describe("pickSongSpeeds", () => {
  it("keeps the player's rates up to 1.25x, slowest first", () => {
    expect(pickSongSpeeds([2, 1.5, 1.25, 1, 0.75, 0.5, 0.25])).toEqual([
      0.25, 0.5, 0.75, 1, 1.25,
    ]);
  });

  it("shows every finer step the video offers", () => {
    expect(pickSongSpeeds([0.25, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.75])).toEqual([
      0.25, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1,
    ]);
  });

  it("falls back when the player has not answered or lists no normal speed", () => {
    expect(pickSongSpeeds(undefined)).toEqual(SONG_SPEED_FALLBACK);
    expect(pickSongSpeeds([])).toEqual(SONG_SPEED_FALLBACK);
    expect(pickSongSpeeds([1.5, 2])).toEqual(SONG_SPEED_FALLBACK);
  });
});
