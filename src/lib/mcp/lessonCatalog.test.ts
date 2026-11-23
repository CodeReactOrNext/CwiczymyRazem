import { describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

const { packLessons, searchLessons, unpackLessons } =
  await import("./lessonCatalog");

const lesson = (
  id: string,
  title: string,
  topics: string[],
  extra: Partial<{ level: string; quality: number }> = {},
) => ({
  id,
  title,
  channel: "A Channel",
  level: extra.level ?? "intermediate",
  topics,
  quality: extra.quality ?? 8,
  minutes: 12,
});

const catalog = [
  lesson("a", "The ULTIMATE CAGED Guitar Lesson", ["CAGED system", "chords"]),
  lesson("b", "Sweep Picking For Beginners", ["sweep picking", "arpeggios"], {
    level: "beginner",
  }),
  lesson("c", "3-String Sweep Arpeggios", ["sweep picking", "arpeggios"], {
    quality: 10,
  }),
  lesson("d", "Guitar Lesson: Strumming Patterns", ["strumming patterns"]),
  lesson("e", "Sultans of Swing Solo Lesson", ["song tutorial", "fingerstyle"]),
  lesson("f", "Blues Guitar Lesson for Advanced Players", ["blues"], {
    level: "advanced",
  }),
];

describe("searchLessons", () => {
  it("ranks by the rare words the lesson shares with the query, better-rated first among equals", () => {
    const found = searchLessons(catalog, "sweep picking arpeggios");
    expect(found.map((item) => item.id)).toEqual(["c", "b"]);
  });

  it("does not match on the words every lesson has", () => {
    // "guitar" and "lesson" are everywhere; one of them is a coincidence.
    expect(searchLessons(catalog, "guitar tapping lesson")).toEqual([]);
  });

  it("falls back to one shared word when nothing shares two", () => {
    // No lesson is about both; the strumming one is still a candidate.
    expect(
      searchLessons(catalog, "strumming independence").map((item) => item.id),
    ).toEqual(["d"]);
  });

  it("finds a song by its title", () => {
    expect(searchLessons(catalog, "Sultans of Swing")[0].id).toBe("e");
  });

  it("keeps to the level asked for", () => {
    expect(
      searchLessons(catalog, "sweep picking", { level: "beginner" }).map(
        (item) => item.id,
      ),
    ).toEqual(["b"]);
  });

  it("answers nothing for a query with no real words", () => {
    expect(searchLessons(catalog, "the a of")).toEqual([]);
  });
});

describe("packLessons", () => {
  it("round-trips the catalogue, best lessons first", () => {
    const unpacked = unpackLessons(packLessons(catalog));
    expect(unpacked).toHaveLength(catalog.length);
    expect(unpacked[0]).toEqual(catalog[2]);
  });
});
