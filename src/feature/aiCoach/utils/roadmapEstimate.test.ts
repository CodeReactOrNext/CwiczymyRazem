import { describe, expect, it } from "vitest";

import { estimateRoadmapWeeks, markStepPracticed } from "./roadmapEstimate";

const phase = (...sessions: number[]) => ({
  steps: sessions.map((sessionsRequired, index) => ({
    id: `s${index}`,
    title: "",
    description: "",
    successCriteria: "",
    sessionsRequired,
    sessionsCompleted: 0,
    order: index,
  })),
});

describe("estimateRoadmapWeeks", () => {
  it("adds every step's sessions up at four a week, rounded up", () => {
    expect(estimateRoadmapWeeks([phase(6, 6), phase(5)])).toBe(5);
    expect(estimateRoadmapWeeks([phase(8, 8, 8, 8)], 8)).toBe(4);
  });

  it("is at least a week for any roadmap with work in it, and 0 for none", () => {
    expect(estimateRoadmapWeeks([phase(2)])).toBe(1);
    expect(estimateRoadmapWeeks([])).toBe(0);
    expect(estimateRoadmapWeeks(null)).toBe(0);
  });
});

describe("markStepPracticed", () => {
  it("flags a return path that leads back to a roadmap step", () => {
    expect(
      markStepPracticed("/ai-coach?roadmapId=r1&step=s1", "exercise"),
    ).toBe("/ai-coach?roadmapId=r1&step=s1&practiced=exercise");
    expect(markStepPracticed("/ai-coach?roadmapId=r1&step=s1", "song")).toBe(
      "/ai-coach?roadmapId=r1&step=s1&practiced=song",
    );
  });

  it("leaves every other return path as it is", () => {
    expect(markStepPracticed("/favorites", "exercise")).toBe("/favorites");
    expect(markStepPracticed("/ai-coach?roadmapId=r1", "exercise")).toBe(
      "/ai-coach?roadmapId=r1",
    );
    expect(markStepPracticed(undefined, "exercise")).toBeUndefined();
    const flagged = "/ai-coach?roadmapId=r1&step=s1&practiced=song";
    expect(markStepPracticed(flagged, "exercise")).toBe(flagged);
  });
});
