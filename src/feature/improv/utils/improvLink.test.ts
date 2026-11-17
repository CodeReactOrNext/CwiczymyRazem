import { parseTakeLink, takeThumbnail } from "feature/improv/utils/improvLink";
import { describe, expect, it } from "vitest";

describe("parseTakeLink", () => {
  it("normalises every YouTube shape to one watch link", () => {
    const expected = {
      provider: "youtube",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ",
    };
    for (const link of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "youtube.com/shorts/dQw4w9WgXcQ",
      "http://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "  https://www.youtube.com/live/dQw4w9WgXcQ  ",
    ]) {
      expect(parseTakeLink(link)).toEqual(expected);
    }
  });

  it("accepts Instagram posts and reels, without the query string", () => {
    expect(
      parseTakeLink("https://www.instagram.com/reel/Cabc123_-x/?igsh=xyz"),
    ).toEqual({
      provider: "instagram",
      url: "https://www.instagram.com/reel/Cabc123_-x/",
      youtubeId: null,
    });
    expect(parseTakeLink("https://instagram.com/someprofile")).toBeNull();
  });

  it("accepts Google Drive files only", () => {
    expect(
      parseTakeLink("https://drive.google.com/file/d/1AbC_d-9/view?usp=sharing")
        ?.provider,
    ).toBe("drive");
    expect(
      parseTakeLink("https://drive.google.com/drive/folders/1AbC"),
    ).toBeNull();
  });

  it("refuses everything else", () => {
    for (const link of [
      "",
      "not a link",
      "https://example.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com.evil.io/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/@channel",
      "javascript:alert(1)",
    ]) {
      expect(parseTakeLink(link)).toBeNull();
    }
  });
});

describe("takeThumbnail", () => {
  it("only exists for YouTube", () => {
    expect(takeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
    expect(takeThumbnail("https://www.instagram.com/reel/Cabc/")).toBeNull();
  });
});
