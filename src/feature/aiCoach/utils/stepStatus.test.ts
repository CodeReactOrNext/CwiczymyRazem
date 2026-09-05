import { describe, expect, it } from "vitest";

import type { RoadmapStep } from "../types/roadmap.types";
import type { YouTubeLessonResult } from "../types/youtubeLesson.types";
import {
  getResourceProgress,
  getResourceStatus,
  getStepStatus,
  sessionsForStatus,
  withResourceStatus,
} from "./stepStatus";

const step = (overrides: Partial<RoadmapStep> = {}): RoadmapStep => ({
  id: "s1",
  title: "Alternate picking",
  description: "",
  successCriteria: "",
  sessionsRequired: 6,
  sessionsCompleted: 0,
  order: 0,
  ...overrides,
});

const lesson = (videoId: string): YouTubeLessonResult => ({
  videoId,
  title: videoId,
  channelName: "",
  thumbnailUrl: "",
  duration: 0,
  score: 0,
});

describe("getStepStatus", () => {
  it("is not started with no sessions", () => {
    expect(getStepStatus(step())).toBe("not-started");
  });

  it("is in progress once any session is logged", () => {
    expect(getStepStatus(step({ sessionsCompleted: 1 }))).toBe("in-progress");
    expect(getStepStatus(step({ sessionsCompleted: 5 }))).toBe("in-progress");
  });

  it("is done at the required count and beyond", () => {
    expect(getStepStatus(step({ sessionsCompleted: 6 }))).toBe("done");
    expect(getStepStatus(step({ sessionsCompleted: 9 }))).toBe("done");
  });
});

describe("getResourceProgress", () => {
  it("counts the exercise and every lesson on screen", () => {
    const progress = getResourceProgress(
      step({
        suggestedExerciseId: "ex",
        exerciseCompleted: true,
        completedLessonIds: ["a"],
      }),
      [lesson("a"), lesson("b")],
    );
    expect(progress).toEqual({ completed: 2, total: 3 });
  });

  it("ignores an exercise the step opted out of", () => {
    const progress = getResourceProgress(
      step({
        suggestedExerciseId: "ex",
        noExercise: true,
        exerciseCompleted: true,
      }),
      [lesson("a")],
    );
    expect(progress).toEqual({ completed: 0, total: 1 });
  });

  it("does not count a watched id whose lesson is no longer listed", () => {
    const progress = getResourceProgress(
      step({ completedLessonIds: ["gone", "a"] }),
      [lesson("a")],
    );
    expect(progress).toEqual({ completed: 1, total: 1 });
  });
});

describe("getResourceStatus", () => {
  it("is null when there is nothing to tick", () => {
    expect(getResourceStatus(step(), [])).toBeNull();
    expect(
      getResourceStatus(
        step({ suggestedExerciseId: "ex", noExercise: true }),
        [],
      ),
    ).toBeNull();
  });

  it("walks not-started, in-progress, done as resources get ticked", () => {
    const withExercise = step({ suggestedExerciseId: "ex" });
    const lessons = [lesson("a")];
    expect(getResourceStatus(withExercise, lessons)).toBe("not-started");
    expect(
      getResourceStatus({ ...withExercise, exerciseCompleted: true }, lessons),
    ).toBe("in-progress");
    expect(
      getResourceStatus(
        { ...withExercise, exerciseCompleted: true, completedLessonIds: ["a"] },
        lessons,
      ),
    ).toBe("done");
  });
});

describe("sessionsForStatus", () => {
  it("encodes done as the full requirement, in progress as one session", () => {
    const s = step({ sessionsRequired: 8 });
    expect(sessionsForStatus(s, "done")).toBe(8);
    expect(sessionsForStatus(s, "in-progress")).toBe(1);
    expect(sessionsForStatus(s, "not-started")).toBe(0);
  });
});

describe("withResourceStatus", () => {
  it("leaves a step with no resources exactly as it was", () => {
    const manual = step({ sessionsCompleted: 3 });
    expect(withResourceStatus(manual, [])).toBe(manual);
  });

  it("completes the step once every resource is ticked", () => {
    const done = withResourceStatus(
      step({
        suggestedExerciseId: "ex",
        exerciseCompleted: true,
        completedLessonIds: ["a"],
      }),
      [lesson("a")],
    );
    expect(done.sessionsCompleted).toBe(6);
    expect(getStepStatus(done)).toBe("done");
  });

  it("drops back to not started when the last tick is undone", () => {
    const reset = withResourceStatus(
      step({
        suggestedExerciseId: "ex",
        sessionsCompleted: 6,
        exerciseCompleted: false,
      }),
      [],
    );
    expect(reset.sessionsCompleted).toBe(0);
  });
});
