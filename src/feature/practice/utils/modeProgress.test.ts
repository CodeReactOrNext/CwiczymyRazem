import type { UserRoadmapProgress } from "feature/aiCoach/services/userProgress.service";
import type { StaticRoadmap } from "feature/aiCoach/types/roadmap.types";
import type { JourneyModule } from "feature/journey/types/journey.types";
import { describe, expect, it } from "vitest";

import {
  summarizeCount,
  summarizeJourney,
  summarizeRoadmaps,
} from "./modeProgress";

const journeyModule = (id: string, title: string, stepIds: string[]) =>
  ({
    id,
    title,
    stages: [{ steps: stepIds.map((stepId) => ({ id: stepId })) }],
  }) as unknown as JourneyModule;

const completed = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { completed: true }]));

describe("summarizeJourney", () => {
  const modules = [
    journeyModule("basics", "Fundamentals", ["a", "b", "c"]),
    journeyModule("fretboard", "Fretboard Mastery", ["d", "e"]),
  ];

  it("invites a new player to the first lesson instead of showing 0 of all", () => {
    expect(summarizeJourney(modules, null)).toMatchObject({
      label: "Start with the first lesson",
    });
  });

  it("counts only the module in progress", () => {
    const doc = { moduleProgress: { fretboard: { steps: completed(["d"]) } } };
    expect(summarizeJourney(modules, doc)).toMatchObject({
      label: "Fretboard Mastery",
      done: 1,
      total: 2,
    });
  });

  it("moves past finished modules", () => {
    const doc = {
      moduleProgress: { basics: { steps: completed(["a", "b", "c"]) } },
    };
    expect(summarizeJourney(modules, doc)).toMatchObject({
      label: "Start with the first lesson",
    });
    expect(
      summarizeJourney(modules, {
        moduleProgress: {
          basics: { steps: completed(["a", "b", "c"]) },
          fretboard: { steps: completed(["d", "e"]) },
        },
      }),
    ).toMatchObject({ label: "All modules completed" });
  });
});

describe("summarizeRoadmaps", () => {
  const roadmap = (id: string, title: string, stepIds: string[]) =>
    ({
      id,
      title,
      phases: [
        { steps: stepIds.map((stepId) => ({ id: stepId, sessionsRequired: 2 })) },
      ],
    }) as unknown as StaticRoadmap;

  const entry = (
    roadmapId: string,
    updatedAt: string,
    stepProgress: Record<string, number>,
  ) => ({ roadmapId, updatedAt, stepProgress }) as UserRoadmapProgress;

  const roadmaps = [
    roadmap("rhythm", "Rhythm Guitar Basics", ["r1", "r2"]),
    roadmap("mayer", "I want to play in the style of John Mayer", ["m1", "m2", "m3"]),
  ];

  it("asks for a first roadmap when none is started", () => {
    expect(summarizeRoadmaps(roadmaps, [])).toMatchObject({
      label: "Choose your first roadmap",
    });
    expect(
      summarizeRoadmaps(roadmaps, [entry("rhythm", "2026-09-01", {})]),
    ).toMatchObject({ label: "Choose your first roadmap" });
  });

  it("shows the most recently practised unfinished roadmap", () => {
    expect(
      summarizeRoadmaps(roadmaps, [
        entry("rhythm", "2026-09-01", { r1: 2 }),
        entry("mayer", "2026-09-10", { m1: 2, m2: 1 }),
      ]),
    ).toMatchObject({ label: "John Mayer", done: 1, total: 3 });
  });

  it("skips finished roadmaps", () => {
    expect(
      summarizeRoadmaps(roadmaps, [
        entry("rhythm", "2026-09-20", { r1: 2, r2: 2 }),
        entry("mayer", "2026-09-10", { m1: 1 }),
      ]),
    ).toMatchObject({ label: "John Mayer", done: 0, total: 3 });
    expect(
      summarizeRoadmaps(roadmaps, [
        entry("rhythm", "2026-09-20", { r1: 2, r2: 2 }),
      ]),
    ).toMatchObject({ label: "Choose your next roadmap" });
  });
});

describe("summarizeCount", () => {
  it("counts without a catalogue-sized total", () => {
    expect(summarizeCount(0, ["scale", "scales"], "Start")).toMatchObject({
      label: "Start",
    });
    expect(summarizeCount(1, ["scale", "scales"], "Start")).toMatchObject({
      label: "1 scale completed",
    });
    expect(summarizeCount(12, ["scale", "scales"], "Start")).toMatchObject({
      label: "12 scales completed",
    });
  });
});
