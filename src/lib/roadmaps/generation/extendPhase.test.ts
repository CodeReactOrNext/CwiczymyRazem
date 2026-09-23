import type {
  RoadmapPhase,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
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

const { extendPhase, insertSteps } = await import("./extendPhase");

const step = (id: string, title = id): RoadmapStep => ({
  id,
  title,
  description: `About ${title}.`,
  successCriteria: "Clean.",
  sessionsRequired: 4,
  sessionsCompleted: 2,
  order: 0,
});

const phase = (id: string, ids: string[]): RoadmapPhase => ({
  id,
  title: `Phase ${id}`,
  order: 0,
  steps: ids.map((stepId, order) => ({ ...step(stepId), order })),
});

beforeEach(() => completeJson.mockReset());

describe("insertSteps", () => {
  it("puts the new steps right after the named one and renumbers everything", () => {
    const next = insertSteps(
      phase("p", ["a", "b", "c"]),
      [step("x"), step("y")],
      "a",
    );

    expect(next.steps.map((s) => s.id)).toEqual(["a", "x", "y", "b", "c"]);
    expect(next.steps.map((s) => s.order)).toEqual([0, 1, 2, 3, 4]);
  });

  it("appends at the end without a step to follow, or with one it cannot find", () => {
    expect(
      insertSteps(phase("p", ["a", "b"]), [step("x")]).steps.map((s) => s.id),
    ).toEqual(["a", "b", "x"]);
    expect(
      insertSteps(phase("p", ["a", "b"]), [step("x")], "nope").steps.map(
        (s) => s.id,
      ),
    ).toEqual(["a", "b", "x"]);
  });

  it("leaves the existing steps' progress untouched", () => {
    const next = insertSteps(phase("p", ["a"]), [step("x")], "a");
    expect(next.steps[0].sessionsCompleted).toBe(2);
  });
});

describe("extendPhase", () => {
  const phases = [phase("p1", ["a", "b"]), phase("p2", ["c"])];

  it("proposes, converts, inserts and describes the new steps only", async () => {
    completeJson
      .mockResolvedValueOnce({
        steps: [
          {
            title: "Sliding sixths",
            skillType: "musical",
            suggestedExerciseId: "one_chord_improv",
            exerciseWhy: "",
            songTitle: null,
            songArtist: null,
          },
        ],
      })
      .mockImplementationOnce(async (params: { user: string }) => {
        // The description call is asked for the new step and nothing else.
        const wanted = [...params.user.matchAll(/\[WRITE\] id=(\S+)/g)].map(
          (m) => m[1],
        );
        return {
          steps: wanted.map((id) => ({
            id,
            description: "[What it is] Sixths.",
            successCriteria: "Clean at 80 BPM.",
            sessionsRequired: 5,
          })),
        };
      });

    const result = await extendPhase({
      goal: "Play like Hendrix",
      level: "Intermediate",
      phases,
      phaseIndex: 0,
      afterStepId: "a",
      count: 1,
      guidance: "more R&B chord work",
    });

    expect(result.phase.steps.map((s) => s.title)).toEqual([
      "a",
      "Sliding sixths",
      "b",
    ]);
    const added = result.phase.steps[1];
    expect(result.addedStepIds).toEqual([added.id]);
    expect(added.description).toContain("Sixths");
    expect(added.sessionsRequired).toBe(5);
    expect(added.suggestedExerciseId).toBe("one_chord_improv");
    expect(added.sessionsCompleted).toBe(0);
    // The steps that were already there keep their text and their progress.
    expect(result.phase.steps[0].description).toBe("About a.");
    expect(result.phase.steps[0].sessionsCompleted).toBe(2);

    const proposal = completeJson.mock.calls[0][0] as {
      user: string;
      system: string;
    };
    expect(proposal.user).toContain('right AFTER step 1 ("a")');
    expect(proposal.user).toContain("more R&B chord work");
    expect(proposal.user).toContain("Phase 2: Phase p2 — c");
    expect(completeJson).toHaveBeenCalledTimes(2);
  });

  it("attaches a library song the resolver confirms", async () => {
    completeJson
      .mockResolvedValueOnce({
        steps: [
          {
            title: "Little Wing",
            skillType: "musical",
            suggestedExerciseId: null,
            exerciseWhy: "",
            songTitle: "Little Wing",
            songArtist: "Jimi Hendrix",
          },
        ],
      })
      .mockImplementationOnce(async (params: { user: string }) => ({
        steps: [...params.user.matchAll(/\[WRITE\] id=(\S+)/g)].map((m) => ({
          id: m[1],
          description: "d",
          successCriteria: "s",
          sessionsRequired: 6,
        })),
      }));
    const resolveSong = vi.fn(async () => ({
      id: "song-1",
      title: "Little Wing",
      artist: "Jimi Hendrix",
    }));

    const result = await extendPhase({
      goal: "Hendrix",
      level: "Intermediate",
      phases,
      phaseIndex: 1,
      count: 1,
      resolveSong,
    });

    expect(result.phase.steps.at(-1)?.suggestedSong?.id).toBe("song-1");
    expect(result.unmatchedSongs).toEqual([]);
  });

  it("fails loudly when the coach proposes nothing usable", async () => {
    completeJson.mockResolvedValueOnce({ steps: [{ title: "   " }] });

    await expect(
      extendPhase({
        goal: "g",
        level: "Beginner",
        phases,
        phaseIndex: 0,
        count: 1,
      }),
    ).rejects.toThrow("no usable steps");
  });

  it("refuses a phase that is not there", async () => {
    await expect(
      extendPhase({
        goal: "g",
        level: "Beginner",
        phases,
        phaseIndex: 7,
        count: 1,
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(completeJson).not.toHaveBeenCalled();
  });
});
