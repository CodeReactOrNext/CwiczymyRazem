import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
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

const { describePhaseSteps, SESSIONS_RANGE } = await import("./descriptions");

const phases: RoadmapPhase[] = [
  {
    id: "p0",
    title: "Time",
    order: 0,
    steps: [
      {
        id: "s0",
        title: "Quarter-note pulse",
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 0,
        order: 0,
        skillType: "physical",
        suggestedExerciseId: "one_chord_improv",
      },
      {
        id: "s1",
        title: "Rests and clean stops",
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 0,
        order: 1,
        skillType: "conceptual",
      },
    ],
  },
  { id: "p1", title: "Open Chords", order: 1, steps: [] },
];

beforeEach(() => completeJson.mockReset());

describe("describePhaseSteps", () => {
  it("writes every step of the phase in one call and clamps the sessions", async () => {
    completeJson.mockResolvedValueOnce({
      steps: [
        {
          id: "s0",
          description: "Feel the pulse.",
          successCriteria: "Steady.",
          sessionsRequired: 40,
        },
        {
          id: "s1",
          description: "Silence on purpose.",
          successCriteria: "Stops dead.",
          sessionsRequired: 0,
        },
      ],
    });

    const phase = await describePhaseSteps({
      goal: "Rhythm guitar",
      level: "Beginner",
      phases,
      phaseIndex: 0,
    });

    expect(completeJson).toHaveBeenCalledTimes(1);
    expect(phase.steps[0].description).toBe("Feel the pulse.");
    expect(phase.steps[0].sessionsRequired).toBe(SESSIONS_RANGE.max);
    expect(phase.steps[1].sessionsRequired).toBe(SESSIONS_RANGE.min);
  });

  it("tells the model the exercise each step owns, by its library title", async () => {
    completeJson.mockResolvedValueOnce({
      steps: [
        {
          id: "s0",
          description: "x",
          successCriteria: "y",
          sessionsRequired: 5,
        },
        {
          id: "s1",
          description: "x",
          successCriteria: "y",
          sessionsRequired: 5,
        },
      ],
    });

    await describePhaseSteps({
      goal: "Rhythm guitar",
      level: "Beginner",
      phases,
      phaseIndex: 0,
    });

    const prompt = completeJson.mock.calls[0][0] as {
      user: string;
      system: string;
    };
    expect(prompt.user).toContain('app exercise: "Improv — One Chord"');
    expect(prompt.user).toContain("UPCOMING PHASES");
    // The house-style exemplars ride in the system prompt.
    expect(prompt.system).toContain("Thumb over the neck");
  });

  it("writes only the requested steps and leaves the rest untouched", async () => {
    completeJson.mockResolvedValueOnce({
      steps: [
        {
          id: "s1",
          description: "Only this one.",
          successCriteria: "ok",
          sessionsRequired: 3,
        },
      ],
    });

    const phase = await describePhaseSteps({
      goal: "Rhythm guitar",
      level: "Beginner",
      phases,
      phaseIndex: 0,
      stepIds: ["s1"],
    });

    expect(phase.steps[0].description).toBe("");
    expect(phase.steps[1].description).toBe("Only this one.");
    const prompt = completeJson.mock.calls[0][0] as { user: string };
    expect(prompt.user).toContain("[context only] id=s0");
    expect(prompt.user).toContain("[WRITE] id=s1");
  });

  it("fails instead of returning a phase with blanks", async () => {
    completeJson.mockResolvedValueOnce({
      steps: [
        {
          id: "s0",
          description: "x",
          successCriteria: "y",
          sessionsRequired: 5,
        },
      ],
    });

    await expect(
      describePhaseSteps({
        goal: "Rhythm guitar",
        level: "Beginner",
        phases,
        phaseIndex: 0,
      }),
    ).rejects.toThrow(/Descriptions missing for 1 of 2 steps/);
  });
});
