import { describe, expect, it } from "vitest";

import type { RoadmapPhase } from "../types/roadmap.types";
import { stripProgress } from "./stripProgress";

describe("stripProgress", () => {
  it("keeps the content and drops every trace of one player's progress", () => {
    const phases: RoadmapPhase[] = [
      {
        id: "p1",
        title: "Phase 1",
        order: 0,
        check: {
          passedAt: "2026-09-01T00:00:00.000Z",
          attempts: 1,
          bestScore: 6,
          total: 6,
        },
        steps: [
          {
            id: "s1",
            title: "Step",
            description: "Text",
            successCriteria: "Clean",
            sessionsRequired: 6,
            sessionsCompleted: 6,
            order: 0,
            suggestedExerciseId: "one_chord_improv",
            suggestedSong: {
              id: "song",
              title: "Little Wing",
              artist: "Jimi Hendrix",
            },
            exerciseCompleted: true,
            completedLessonIds: ["yt"],
            songCompleted: true,
          },
        ],
      },
    ];

    const [phase] = stripProgress(phases);

    expect(phase).not.toHaveProperty("check");
    expect(phase.steps[0]).toEqual({
      id: "s1",
      title: "Step",
      description: "Text",
      successCriteria: "Clean",
      sessionsRequired: 6,
      sessionsCompleted: 0,
      order: 0,
      suggestedExerciseId: "one_chord_improv",
      suggestedSong: {
        id: "song",
        title: "Little Wing",
        artist: "Jimi Hendrix",
      },
    });
    // The input is left alone.
    expect(phases[0].steps[0].sessionsCompleted).toBe(6);
  });
});
