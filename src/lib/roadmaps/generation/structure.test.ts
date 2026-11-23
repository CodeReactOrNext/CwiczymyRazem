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

const {
  draftRoadmapStructure,
  fillMissingExercises,
  generateRoadmapStructure,
  reviewRoadmapStructure,
  STRUCTURE_LIMITS,
  toRoadmapPhases,
  toStructurePhases,
} = await import("./structure");

const skeleton = (stepsPerPhase = 4, phases = 6) => ({
  guitarRelated: true,
  rejectionReason: "",
  phases: Array.from({ length: phases }, (_phase, p) => ({
    title: `Phase ${p}`,
    steps: Array.from({ length: stepsPerPhase }, (_step, s) => ({
      title: `Skill ${p}-${s}`,
      skillType: "physical" as const,
      suggestedExerciseId: null as string | null,
      exerciseWhy: "",
      exerciseFit: null as "direct" | "support" | null,
      gist: "",
      songTitle: null as string | null,
      songArtist: null as string | null,
    })),
  })),
});

beforeEach(() => completeJson.mockReset());

describe("toRoadmapPhases", () => {
  it("keeps library ids, drops invented ones and caps reuse", () => {
    const draft = skeleton(4, 1);
    draft.phases[0].steps[0].suggestedExerciseId = "one_chord_improv";
    draft.phases[0].steps[1].suggestedExerciseId = "one_chord_improv";
    draft.phases[0].steps[2].suggestedExerciseId = "one_chord_improv";
    draft.phases[0].steps[3].suggestedExerciseId = "vibrato_mastery";

    const { phases, unknownExerciseIds } = toRoadmapPhases(
      draft.phases,
      "Intermediate",
    );
    const ids = phases[0].steps.map((step) => step.suggestedExerciseId);

    expect(ids.slice(0, STRUCTURE_LIMITS.maxExerciseReuse)).toEqual([
      "one_chord_improv",
      "one_chord_improv",
    ]);
    expect(ids[2]).toBeUndefined();
    expect(ids[3]).toBeUndefined();
    expect(unknownExerciseIds).toEqual(["vibrato_mastery"]);
    expect(phases[0].steps[0].skillType).toBe("physical");
    expect(phases[0].steps[0].sessionsCompleted).toBe(0);
  });

  it("drops an exercise whose difficulty is out of the level's range", () => {
    const draft = skeleton(1, 1);
    // one_chord_improv is "medium" — fine for a Beginner, not for an Absolute Beginner.
    draft.phases[0].steps[0].suggestedExerciseId = "one_chord_improv";

    expect(
      toRoadmapPhases(draft.phases, "Beginner").phases[0].steps[0]
        .suggestedExerciseId,
    ).toBe("one_chord_improv");
    expect(
      toRoadmapPhases(draft.phases, "Absolute Beginner").phases[0].steps[0]
        .suggestedExerciseId,
    ).toBeUndefined();
  });
});

describe("what a step carries out of the skeleton", () => {
  it("keeps the gist, the exercise's role and the song it asked for", () => {
    const draft = skeleton(2, 1);
    Object.assign(draft.phases[0].steps[0], {
      suggestedExerciseId: "one_chord_improv",
      exerciseWhy: "Same vamp, one chord.",
      exerciseFit: "support",
      gist: "Improvise over an A7 vamp with three notes.",
    });
    Object.assign(draft.phases[0].steps[1], {
      songTitle: "Red House",
      songArtist: "Jimi Hendrix",
    });

    const { phases, songRequests } = toRoadmapPhases(
      draft.phases,
      "Intermediate",
    );
    const [first, second] = phases[0].steps;

    expect(first.summary).toBe("Improvise over an A7 vamp with three notes.");
    expect(first.exerciseRole).toBe("support");
    expect(first.exerciseWhy).toBe("Same vamp, one chord.");
    expect(second.songRequest).toEqual({
      title: "Red House",
      artist: "Jimi Hendrix",
    });
    expect(songRequests).toHaveLength(1);
    // And back again, for a rewrite of a plan that was already converted.
    const back = toStructurePhases(phases);
    expect(back[0].steps[0].exerciseFit).toBe("support");
    expect(back[0].steps[1].songTitle).toBe("Red House");
  });

  it("gives a bare technique step a second look at the library", async () => {
    const draft = skeleton(3, 1);
    draft.phases[0].steps[0].suggestedExerciseId = "one_chord_improv";
    draft.phases[0].steps[2].skillType = "musical" as never;
    const { phases } = toRoadmapPhases(draft.phases, "Intermediate");
    const matchExercise = vi
      .fn()
      // Already in the phase, then unknown, then a real one.
      .mockResolvedValue(["one_chord_improv", "nope", "metronome_gap_test"]);

    const filled = await fillMissingExercises(
      phases,
      "Play like Hendrix",
      "Intermediate",
      matchExercise,
    );

    // Only the physical step without an exercise is searched for.
    expect(matchExercise).toHaveBeenCalledTimes(1);
    expect(filled[0].steps[1].suggestedExerciseId).toBe("metronome_gap_test");
    expect(filled[0].steps[2].suggestedExerciseId).toBeUndefined();
  });
});

describe("generateRoadmapStructure", () => {
  it("returns the draft when the reviewer accepts it", async () => {
    completeJson.mockResolvedValueOnce(skeleton()).mockResolvedValueOnce({
      issues: [],
      suggestions: ["More songs"],
      isValid: true,
    });

    const result = await generateRoadmapStructure(
      "Play like Hendrix",
      "Intermediate",
    );

    expect(completeJson).toHaveBeenCalledTimes(2);
    expect(result.phases).toHaveLength(6);
    expect(result.review.revised).toBe(false);
    expect(result.review.suggestions).toEqual(["More songs"]);
  });

  it("revises once when the reviewer rejects the draft", async () => {
    const revised = skeleton(5, 7);
    completeJson
      .mockResolvedValueOnce(skeleton())
      .mockResolvedValueOnce({
        issues: [{ text: "Phase 2 is generic", severity: "shape" }],
        suggestions: [],
      })
      .mockResolvedValueOnce(revised);

    const result = await generateRoadmapStructure(
      "Play like Hendrix",
      "Intermediate",
    );

    expect(completeJson).toHaveBeenCalledTimes(3);
    const revisionPrompt = completeJson.mock.calls[2][0] as { user: string };
    expect(revisionPrompt.user).toContain("Phase 2 is generic");
    expect(result.phases).toHaveLength(7);
    expect(result.review.revised).toBe(true);
    expect(result.review.isValid).toBe(false);
    expect(result.review.shapeIssues).toBe(1);
  });

  it("keeps a draft the reviewer only has small notes on", async () => {
    completeJson.mockResolvedValueOnce(skeleton()).mockResolvedValueOnce({
      issues: [{ text: "Rename step 3", severity: "detail" }],
      suggestions: [],
    });

    const result = await generateRoadmapStructure(
      "Play like Hendrix",
      "Intermediate",
    );

    // No third call: a note about one step is not worth writing the plan twice.
    expect(completeJson).toHaveBeenCalledTimes(2);
    expect(result.review.revised).toBe(false);
    expect(result.review.isValid).toBe(true);
    expect(result.review.issues).toEqual(["Rename step 3"]);
  });

  it("rewrites on what the code checks find, whatever the reviewer says", async () => {
    const draft = skeleton(4, 6);
    // Every song in the last phase: the pattern half the first reviews named.
    draft.phases[5].steps[0].songTitle = "Little Wing";
    draft.phases[5].steps[0].songArtist = "Jimi Hendrix";
    const fixed = skeleton(4, 6);
    fixed.phases[0].steps[3].songTitle = "Little Wing";
    fixed.phases[0].steps[3].songArtist = "Jimi Hendrix";
    completeJson
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce({ issues: [], suggestions: [] })
      .mockResolvedValueOnce(fixed);

    const result = await generateRoadmapStructure(
      "Play like Hendrix",
      "Intermediate",
    );

    expect(completeJson).toHaveBeenCalledTimes(3);
    const reviewPrompt = completeJson.mock.calls[1][0] as { user: string };
    expect(reviewPrompt.user).toContain("CODE CHECKS");
    const revisionPrompt = completeJson.mock.calls[2][0] as { user: string };
    expect(revisionPrompt.user).toContain("first song step is in phase 6");
    expect(result.review.mechanical).toHaveLength(1);
    expect(result.review.revised).toBe(true);
    expect(result.review.remaining).toEqual([]);
  });

  it("keeps the draft when a rewrite for the code checks comes back worse", async () => {
    const draft = skeleton(4, 6);
    draft.phases[5].steps[0].songTitle = "Little Wing";
    draft.phases[5].steps[0].songArtist = "Jimi Hendrix";
    const worse = skeleton(4, 6);
    worse.phases[5].steps[0].songTitle = "Little Wing";
    worse.phases[5].steps[0].songArtist = "Jimi Hendrix";
    worse.phases[2].steps[0].title = "Fuzz Face settings";
    completeJson
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce({ issues: [], suggestions: [] })
      .mockResolvedValueOnce(worse);

    const result = await generateRoadmapStructure(
      "Play like Hendrix",
      "Intermediate",
    );

    expect(result.review.revised).toBe(false);
    expect(result.phases[2].steps[0].title).toBe("Skill 2-0");
    expect(result.review.remaining).toHaveLength(1);
  });

  it("rejects a goal that is not about guitar with a 400", async () => {
    completeJson.mockResolvedValueOnce({
      ...skeleton(),
      guitarRelated: false,
      rejectionReason: "This is about piano.",
    });

    await expect(
      generateRoadmapStructure("Learn piano", "Beginner"),
    ).rejects.toMatchObject({ status: 400, message: "This is about piano." });
    expect(completeJson).toHaveBeenCalledTimes(1);
  });

  it("hands the whole exercise library to the model", async () => {
    completeJson
      .mockResolvedValueOnce(skeleton())
      .mockResolvedValueOnce({ issues: [], suggestions: [], isValid: true });

    await generateRoadmapStructure("Blues", "Beginner");

    const prompt = completeJson.mock.calls[0][0] as {
      user: string;
      schema: any;
    };
    expect(prompt.user).toContain("one_chord_improv | Improv — One Chord");
    expect(prompt.schema.properties.phases.minItems).toBe(
      STRUCTURE_LIMITS.phases.min,
    );
  });
});

describe("library songs on steps", () => {
  it("collects the songs the steps name, by step id", () => {
    const draft = skeleton(2, 1);
    draft.phases[0].steps[0].songTitle = "Little Wing";
    draft.phases[0].steps[0].songArtist = "Jimi Hendrix";
    draft.phases[0].steps[1].songTitle = "  ";

    const { phases, songRequests } = toRoadmapPhases(
      draft.phases,
      "Intermediate",
    );
    expect(songRequests).toEqual([
      {
        stepId: phases[0].steps[0].id,
        request: { title: "Little Wing", artist: "Jimi Hendrix" },
      },
    ]);
  });

  it("attaches only the songs the library confirms and reports the rest", async () => {
    const draft = skeleton(2, 1);
    draft.phases[0].steps[0].songTitle = "Little Wing";
    draft.phases[0].steps[0].songArtist = "Jimi Hendrix";
    draft.phases[0].steps[1].songTitle = "Voodoo Child";
    draft.phases[0].steps[1].songArtist = "Jimi Hendrix";
    completeJson
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce({ issues: [], suggestions: [], isValid: true });

    const resolveSong = vi.fn(async ({ title }: { title: string }) =>
      title === "Little Wing"
        ? { id: "song-1", title: "Little Wing", artist: "Jimi Hendrix" }
        : null,
    );
    const result = await generateRoadmapStructure(
      "Hendrix",
      "Intermediate",
      undefined,
      resolveSong,
    );

    expect(result.phases[0].steps[0].suggestedSong).toEqual({
      id: "song-1",
      title: "Little Wing",
      artist: "Jimi Hendrix",
    });
    expect(result.phases[0].steps[1].suggestedSong).toBeUndefined();
    expect(result.unmatchedSongs).toEqual([
      { title: "Voodoo Child", artist: "Jimi Hendrix" },
    ]);
  });

  it("attaches nothing without a resolver", async () => {
    const draft = skeleton(1, 1);
    draft.phases[0].steps[0].songTitle = "Little Wing";
    draft.phases[0].steps[0].songArtist = "Jimi Hendrix";
    completeJson
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce({ issues: [], suggestions: [], isValid: true });

    const result = await generateRoadmapStructure("Hendrix", "Intermediate");
    expect(result.phases[0].steps[0].suggestedSong).toBeUndefined();
    expect(result.unmatchedSongs).toEqual([]);
  });
});

describe("the two halves of the skeleton", () => {
  it("drafts without reviewing, so the caller can report the two apart", async () => {
    completeJson.mockResolvedValueOnce(skeleton(4, 6));

    const draft = await draftRoadmapStructure("Play like SRV", "Intermediate");

    expect(draft).toHaveLength(6);
    expect(completeJson).toHaveBeenCalledTimes(1);
  });

  it("refuses a goal that is not about guitar before anything is paid for twice", async () => {
    completeJson.mockResolvedValueOnce({
      guitarRelated: false,
      rejectionReason: "That is not a guitar goal.",
      phases: [],
    });

    await expect(
      draftRoadmapStructure("Learn to bake", "Beginner"),
    ).rejects.toThrow("That is not a guitar goal.");
  });

  it("reviews a draft it was handed rather than drafting another one", async () => {
    const draft = skeleton(4, 6).phases;
    completeJson.mockResolvedValueOnce({
      issues: [],
      suggestions: [],
      isValid: true,
    });

    const result = await reviewRoadmapStructure(
      "Play like SRV",
      "Intermediate",
      draft,
    );

    expect(completeJson).toHaveBeenCalledTimes(1);
    expect(result.review.revised).toBe(false);
    expect(result.phases).toHaveLength(6);
  });

  it("says when the rewrite starts, since nothing outside can see it", async () => {
    const draft = skeleton(4, 6).phases;
    completeJson
      .mockResolvedValueOnce({
        issues: [{ text: "Phase 3 repeats phase 1", severity: "shape" }],
        suggestions: [],
      })
      .mockResolvedValueOnce(skeleton(5, 6));
    const onRevise = vi.fn();

    const result = await reviewRoadmapStructure(
      "Play like SRV",
      "Intermediate",
      draft,
      { onRevise },
    );

    expect(onRevise).toHaveBeenCalledTimes(1);
    expect(result.review.revised).toBe(true);
    expect(result.phases[0].steps).toHaveLength(5);
  });

  it("stays quiet when the reviewer accepts the draft", async () => {
    completeJson.mockResolvedValueOnce({
      issues: [],
      suggestions: ["Nice"],
      isValid: true,
    });
    const onRevise = vi.fn();

    await reviewRoadmapStructure(
      "Play like SRV",
      "Intermediate",
      skeleton(4, 6).phases,
      {
        onRevise,
      },
    );

    expect(onRevise).not.toHaveBeenCalled();
  });

  it("refuses to review nothing", async () => {
    await expect(
      reviewRoadmapStructure("Play like SRV", "Intermediate", []),
    ).rejects.toThrow("no draft");
    expect(completeJson).not.toHaveBeenCalled();
  });

  it("run back to back, the two halves are the old single call", async () => {
    completeJson
      .mockResolvedValueOnce(skeleton(4, 6))
      .mockResolvedValueOnce({ issues: [], suggestions: [], isValid: true });

    const result = await generateRoadmapStructure(
      "Play like SRV",
      "Intermediate",
    );

    expect(completeJson).toHaveBeenCalledTimes(2);
    expect(result.phases).toHaveLength(6);
    expect(result.review.isValid).toBe(true);
  });
});
