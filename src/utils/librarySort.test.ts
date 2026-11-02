import { describe, expect, it } from "vitest";

import { isLibrarySort, sortLibraryItems } from "./librarySort";

const items = [
  { title: "Week Spots W1 — Tue", createdAtMs: 300 },
  { title: "alternate picking", createdAtMs: 100 },
  { title: "Week Spots W10 — Mon", createdAtMs: 200 },
  { title: "Week Spots W2 — Mon", createdAtMs: null },
];

const titles = (list: typeof items) => list.map((item) => item.title);

describe("sortLibraryItems", () => {
  it("sorts by name ignoring case and reading numbers as numbers", () => {
    expect(titles(sortLibraryItems(items, "name", (item) => item))).toEqual([
      "alternate picking",
      "Week Spots W1 — Tue",
      "Week Spots W2 — Mon",
      "Week Spots W10 — Mon",
    ]);
  });

  it("puts the newest first and undated items last", () => {
    expect(titles(sortLibraryItems(items, "newest", (item) => item))).toEqual([
      "Week Spots W1 — Tue",
      "Week Spots W10 — Mon",
      "alternate picking",
      "Week Spots W2 — Mon",
    ]);
  });

  it("puts the oldest first, undated items before anything dated", () => {
    expect(titles(sortLibraryItems(items, "oldest", (item) => item))[0]).toBe(
      "Week Spots W2 — Mon",
    );
  });

  it("breaks date ties by name", () => {
    const tied = [
      { title: "B", createdAtMs: 1 },
      { title: "A", createdAtMs: 1 },
    ];
    expect(titles(sortLibraryItems(tied, "newest", (item) => item))).toEqual([
      "A",
      "B",
    ]);
  });

  it("does not mutate the input", () => {
    const copy = [...items];
    sortLibraryItems(items, "name", (item) => item);
    expect(items).toEqual(copy);
  });
});

describe("isLibrarySort", () => {
  it("accepts known sorts only", () => {
    expect(isLibrarySort("name")).toBe(true);
    expect(isLibrarySort("rating")).toBe(false);
    expect(isLibrarySort(null)).toBe(false);
  });
});
