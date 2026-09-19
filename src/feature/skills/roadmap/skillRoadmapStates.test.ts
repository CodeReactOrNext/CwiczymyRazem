import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { RoadmapTier } from "./skillRoadmap.data";
import {
  computeRoadmapProgress,
  findCurrentPlacement,
} from "./skillRoadmapStates";

const exercise = (id: string, premium = false): Exercise =>
  ({
    id,
    premium,
    difficulty: "easy",
    relatedSkills: [],
  }) as unknown as Exercise;

const tiers: RoadmapTier[] = [
  {
    id: "foundations",
    title: "Foundations",
    subtitle: "",
    branches: [
      {
        id: "getting_started",
        label: "Getting Started",
        skillId: "general",
        exercises: [exercise("a1"), exercise("a2")],
      },
    ],
  },
  {
    id: "technique",
    title: "Technique",
    subtitle: "",
    branches: [
      {
        id: "legato",
        label: "Legato",
        skillId: "legato",
        exercises: [exercise("b1"), exercise("b2")],
      },
    ],
  },
];

const progressFor = (completedIds: string[]) =>
  computeRoadmapProgress(
    tiers,
    (e) => completedIds.includes(e.id),
    () => false,
  );

describe("findCurrentPlacement", () => {
  it("names the exercise, its branch and its tier", () => {
    const progress = progressFor(["b1"]);
    const placement = findCurrentPlacement(tiers, progress.states);

    expect(placement?.exercise.id).toBe("b2");
    expect(placement?.branch.label).toBe("Legato");
    expect(placement?.tier.title).toBe("Technique");
  });

  it("points at the very first exercise for a player with no progress", () => {
    const placement = findCurrentPlacement(tiers, progressFor([]).states);

    expect(placement?.exercise.id).toBe("a1");
    expect(placement?.tier.id).toBe("foundations");
  });

  it("is empty once every exercise is done", () => {
    const progress = progressFor(["a1", "a2", "b1", "b2"]);

    expect(findCurrentPlacement(tiers, progress.states)).toBeNull();
    expect(progress.completed).toBe(progress.total);
  });
});
