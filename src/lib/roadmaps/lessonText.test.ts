import { describe, expect, it } from "vitest";

import {
  lessonEmbeddingText,
  parseChapters,
  parseLessonAnalysis,
} from "./lessonText";

describe("parseChapters", () => {
  it("reads chapter lines and drops the intro and outro", () => {
    const description = [
      "Learn the Sultans of Swing intro!",
      "0:00 Intro",
      "1:12 - Right-hand snap",
      "04:30 The first lick",
      "1:02:10 | Full playthrough",
      "12:00 Outro",
      "Patreon: https://example.com",
    ].join("\n");
    expect(parseChapters(description)).toEqual([
      "Right-hand snap",
      "The first lick",
      "Full playthrough",
    ]);
  });

  it("answers nothing for a description without chapters", () => {
    expect(parseChapters("Just a lesson.\nhttps://link")).toEqual([]);
  });
});

describe("parseLessonAnalysis", () => {
  it("reads a well-formed answer", () => {
    const analysis = parseLessonAnalysis(
      JSON.stringify({
        level: "intermediate",
        topics: ["fingerstyle"],
        guitarStyle: ["fingerpicking"],
        qualityScore: 8,
        qualityReason: "clear",
        teaches: " Knopfler's snapped notes. ",
      }),
    );
    expect(analysis).toEqual({
      level: "intermediate",
      topics: ["fingerstyle"],
      guitarStyle: ["fingerpicking"],
      qualityScore: 8,
      qualityReason: "clear",
      teaches: "Knopfler's snapped notes.",
    });
  });

  it("falls back field by field on a broken answer", () => {
    expect(parseLessonAnalysis("not json")).toMatchObject({
      level: "all",
      topics: [],
      qualityScore: 5,
      teaches: "",
    });
    expect(parseLessonAnalysis('{"level":"expert"}').level).toBe("all");
  });
});

describe("lessonEmbeddingText", () => {
  it("embeds what the video teaches and its chapters, not the promo text", () => {
    const text = lessonEmbeddingText(
      {
        title: "Sultans of Swing lesson",
        description: "0:00 Intro\n1:10 Snapped notes\nMerch: shop.example",
      },
      {
        level: "intermediate",
        topics: ["fingerstyle"],
        guitarStyle: [],
        qualityScore: 8,
        qualityReason: "",
        teaches: "Knopfler's pick-less right hand.",
      },
    );
    expect(text).toBe(
      "Sultans of Swing lesson. Teaches: Knopfler's pick-less right hand. Chapters: Snapped notes. Topics: fingerstyle. Level: intermediate",
    );
    expect(text).not.toContain("Merch");
  });
});
