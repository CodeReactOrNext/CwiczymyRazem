import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as OpenAiJson from "./openaiJson";

const completeJson = vi.fn();
vi.mock("./openaiJson", async () => {
  const actual = await vi.importActual<typeof OpenAiJson>("./openaiJson");
  return {
    ...actual,
    completeJson: (...args: unknown[]) => completeJson(...args),
  };
});

const findLibrarySong = vi.fn();
vi.mock("../songLookup", () => ({
  findLibrarySong: (...args: unknown[]) => findLibrarySong(...args),
}));

vi.mock("utils/firebase/api/firebase.config", () => ({ firestore: {} }));

const { runPreflight } = await import("./preflight");

const output = (overrides: Record<string, unknown> = {}) => ({
  verdict: "ok",
  reason: "",
  understood: "You want Knopfler's fingerstyle.",
  songsNamed: [],
  ask: [],
  custom: [],
  ...overrides,
});

beforeEach(() => {
  completeJson.mockReset();
  findLibrarySong.mockReset();
});

describe("runPreflight", () => {
  it("sends the goal with its title and context, on the cheap model", async () => {
    completeJson.mockResolvedValue(output());
    await runPreflight({
      goal: "play like Knopfler",
      title: "Dire Straits fingerstyle",
      level: "Intermediate",
      context: { favourites: "Dire Straits", canPlay: "" },
    });
    const params = completeJson.mock.calls[0][0] as {
      user: string;
      model: string;
      reasoningEffort: string;
      schema: {
        properties: {
          ask: { items: { properties: { id: { enum: string[] } } } };
        };
      };
    };
    expect(params.user).toContain(
      'Goal: "Dire Straits fingerstyle: play like Knopfler (About the student: loves Dire Straits.)"',
    );
    expect(params.user).toContain("Skill level: Intermediate");
    expect(params.model).toBe("gpt-5-mini");
    expect(params.reasoningEffort).toBe("low");
    expect(params.schema.properties.ask.items.properties.id.enum).toContain(
      "songs",
    );
  });

  it("applies the bank rules to the pick and checks named songs against the library", async () => {
    completeJson.mockResolvedValue(
      output({
        songsNamed: [
          { title: "Sultans of Swing", artist: "Dire Straits" },
          { title: "Romeo and Juliet", artist: "Dire Straits" },
          { title: " ", artist: "x" },
        ],
        ask: [
          {
            id: "target",
            options: [
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ],
          },
          { id: "songs", options: [] },
          { id: "includes", options: [] },
        ],
        custom: [
          {
            question: "Which era?",
            options: [
              { value: "e", label: "Early" },
              { value: "l", label: "Late" },
            ],
            multi: false,
          },
        ],
      }),
    );
    findLibrarySong.mockImplementation(async (request: { title: string }) =>
      request.title === "Sultans of Swing"
        ? { id: "s1", title: "Sultans of Swing", artist: "Dire Straits" }
        : null,
    );

    const result = await runPreflight({
      goal: "play like Knopfler",
      title: null,
      level: "Intermediate",
      context: null,
    });

    expect(result.verdict).toBe("ok");
    expect(result.questions.asked.map((q) => q.id)).toEqual([
      "songs",
      "includes",
    ]);
    expect(result.questions.custom).toHaveLength(1);
    expect(result.songsFound).toEqual([
      { id: "s1", title: "Sultans of Swing", artist: "Dire Straits" },
    ]);
    expect(result.songsMissing).toEqual([
      { title: "Romeo and Juliet", artist: "Dire Straits" },
    ]);
    expect(findLibrarySong).toHaveBeenCalledTimes(2);
  });

  it("asks nothing and looks nothing up for a goal that is not about guitar", async () => {
    completeJson.mockResolvedValue(
      output({
        verdict: "not_guitar",
        reason: "This is about the piano.",
        songsNamed: [{ title: "Für Elise", artist: "Beethoven" }],
        ask: [{ id: "songs", options: [] }],
      }),
    );
    const result = await runPreflight({
      goal: "learn Für Elise on piano",
      title: null,
      level: "Beginner",
      context: null,
    });
    expect(result.verdict).toBe("not_guitar");
    expect(result.reason).toBe("This is about the piano.");
    expect(result.questions).toEqual({ asked: [], custom: [] });
    expect(findLibrarySong).not.toHaveBeenCalled();
  });

  it("survives a library lookup that throws", async () => {
    completeJson.mockResolvedValue(
      output({ songsNamed: [{ title: "X", artist: "Y" }] }),
    );
    findLibrarySong.mockRejectedValue(new Error("offline"));
    const result = await runPreflight({
      goal: "play X",
      title: null,
      level: "Beginner",
      context: null,
    });
    expect(result.songsFound).toEqual([]);
    expect(result.songsMissing).toEqual([{ title: "X", artist: "Y" }]);
  });
});
