import { describe, expect, it } from "vitest";

import {
  goalForModel,
  goalHint,
  sanitizeGoalContext,
  sanitizeTitle,
} from "./goalContext";

describe("sanitizeGoalContext", () => {
  it("keeps trimmed single-line texts", () => {
    expect(
      sanitizeGoalContext({
        favourites: "  Hendrix,\n SRV ",
        canPlay: "open chords",
      }),
    ).toEqual({ favourites: "Hendrix, SRV", canPlay: "open chords" });
  });

  it("answers null when nothing usable is left", () => {
    expect(sanitizeGoalContext({ favourites: "   " })).toBeNull();
    expect(sanitizeGoalContext("text")).toBeNull();
    expect(sanitizeGoalContext(null)).toBeNull();
  });

  it("cuts long texts", () => {
    const context = sanitizeGoalContext({ favourites: "x".repeat(500) });
    expect(context?.favourites).toHaveLength(200);
  });
});

describe("sanitizeTitle", () => {
  it("keeps a title on one line", () => {
    expect(sanitizeTitle("  Play like\n Knopfler ")).toBe("Play like Knopfler");
  });

  it("refuses titles that are missing, too short or too long", () => {
    expect(sanitizeTitle(undefined)).toBeNull();
    expect(sanitizeTitle("ab")).toBeNull();
    expect(sanitizeTitle("x".repeat(81))).toBeNull();
  });
});

describe("goalForModel", () => {
  it("puts the title before the description and adds the player's notes", () => {
    expect(
      goalForModel(
        "Fingerstyle patterns",
        { favourites: "Dire Straits", canPlay: "" },
        "Mark Knopfler",
      ),
    ).toBe(
      "Mark Knopfler: Fingerstyle patterns (About the student: loves Dire Straits.)",
    );
  });

  it("does not repeat a title the description already says", () => {
    expect(goalForModel("Play blues like SRV", null, "blues")).toBe(
      "Play blues like SRV",
    );
  });

  it("leaves the goal alone without a title or context", () => {
    expect(goalForModel("Play blues", null)).toBe("Play blues");
  });
});

describe("goalHint", () => {
  it("asks for more on a goal of a word or two", () => {
    expect(goalHint("music theory")).toMatch(/bit more/);
  });

  it("asks for a subject when the goal names none", () => {
    expect(goalHint("I want to get much better at guitar")).toMatch(
      /style, an artist or a technique/,
    );
    expect(goalHint("I would like to get better at this")).toMatch(
      /style, an artist or a technique/,
    );
  });

  it("stays quiet for a goal with a style, an artist or a technique", () => {
    expect(goalHint("I want to improvise over blues in any key")).toBeNull();
    expect(goalHint("I want to play like Dimebag Darrell")).toBeNull();
    expect(goalHint("")).toBeNull();
  });
});
