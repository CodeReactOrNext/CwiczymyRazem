import { describe, expect, it } from "vitest";

import { buildSongSectionMapId, extractVideoId } from "./youtube.utils";

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
