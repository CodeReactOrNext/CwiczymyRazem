import { describe, expect, it } from "vitest";

import { parseList, parsePairs } from "./parseProps";

describe("parsePairs", () => {
  it("splits pipe-separated items into title and description", () => {
    expect(parsePairs("Board::Songs you track|Explore::Find new songs")).toEqual([
      { title: "Board", description: "Songs you track" },
      { title: "Explore", description: "Find new songs" },
    ]);
  });

  it("leaves the description undefined when an item has no separator", () => {
    expect(parsePairs("Common|Rare")).toEqual([
      { title: "Common", description: undefined },
      { title: "Rare", description: undefined },
    ]);
  });

  it("keeps extra separators inside the description", () => {
    expect(parsePairs("Tip::Play slowly::then speed up")).toEqual([
      { title: "Tip", description: "Play slowly::then speed up" },
    ]);
  });

  it("trims whitespace and drops empty items", () => {
    expect(parsePairs("  A::one |  | B::two ")).toEqual([
      { title: "A", description: "one" },
      { title: "B", description: "two" },
    ]);
  });
});

describe("parseList", () => {
  it("splits and trims a pipe-separated list", () => {
    expect(parseList(" Common | Rare |  | Epic ")).toEqual(["Common", "Rare", "Epic"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseList("")).toEqual([]);
  });
});
