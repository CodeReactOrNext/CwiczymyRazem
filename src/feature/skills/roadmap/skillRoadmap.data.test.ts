import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  buildSkillRoadmap,
  findUnplacedExercises,
  SKILL_ROADMAP_TIERS,
} from "./skillRoadmap.data";
import { computeRoadmapProgress } from "./skillRoadmapStates";

describe("buildSkillRoadmap", () => {
  it("puts every library exercise on exactly one branch", () => {
    const unplaced = findUnplacedExercises(exercisesAgregat);
    expect(unplaced.map((e) => `${e.relatedSkills[0]}:${e.id}`)).toEqual([]);

    const ids = buildSkillRoadmap(exercisesAgregat)
      .flatMap((tier) => tier.branches)
      .flatMap((branch) => branch.exercises.map((e) => e.id));
    expect(ids).toHaveLength(exercisesAgregat.length);
    expect(new Set(ids).size).toBe(exercisesAgregat.length);
  });

  it("uses unique branch ids across tiers", () => {
    const ids = SKILL_ROADMAP_TIERS.flatMap((t) => t.branches.map((b) => b.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("orders a branch easiest first and keeps library order within a level", () => {
    const tiers = buildSkillRoadmap(exercisesAgregat);
    tiers
      .flatMap((t) => t.branches)
      .forEach((branch) => {
        const rank = { beginner: 0, easy: 1, medium: 2, hard: 3 };
        const ranks = branch.exercises.map((e) => rank[e.difficulty]);
        expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
      });

    const patterns = tiers
      .find((t) => t.id === "rhythm")!
      .branches.find((b) => b.id === "strumming_patterns")!
      .exercises.map((e) => e.id);
    const libraryOrder = exercisesAgregat
      .filter((e) => patterns.includes(e.id) && e.difficulty === "easy")
      .map((e) => e.id);
    expect(patterns.filter((id) => libraryOrder.includes(id))).toEqual(
      libraryOrder,
    );
  });

  it("drops branches nothing landed on", () => {
    const [foundations] = buildSkillRoadmap([]);
    expect(foundations.branches).toEqual([]);
  });
});

describe("computeRoadmapProgress", () => {
  const tiers = buildSkillRoadmap(exercisesAgregat);
  const firstExercise = tiers[0].branches[0].exercises[0];

  it("marks the first dot current on a blank map", () => {
    const { states, completed, total } = computeRoadmapProgress(
      tiers,
      () => false,
      () => false,
    );
    expect(completed).toBe(0);
    expect(total).toBe(exercisesAgregat.length);
    expect(states.get(firstExercise.id)).toBe("current");
    expect([...states.values()].filter((s) => s === "current")).toHaveLength(1);
  });

  it("marks the next dot of a started branch current, others available", () => {
    const branch = tiers[1].branches[0];
    const done = new Set([branch.exercises[0].id]);
    const { states, byTier } = computeRoadmapProgress(
      tiers,
      (e: Exercise) => done.has(e.id),
      () => false,
    );
    expect(states.get(branch.exercises[0].id)).toBe("completed");
    expect(states.get(branch.exercises[1].id)).toBe("current");
    expect(states.get(firstExercise.id)).toBe("available");
    expect(byTier.get(tiers[1].id)).toEqual({
      completed: 1,
      total: tiers[1].branches.reduce((n, b) => n + b.exercises.length, 0),
    });
  });

  it("marks one dot current on the whole map, however many branches are started", () => {
    const started = tiers
      .flatMap((t) => t.branches)
      .filter((b) => b.exercises.length > 1)
      .slice(0, 5);
    const done = new Set(started.map((b) => b.exercises[0].id));
    const { states } = computeRoadmapProgress(
      tiers,
      (e: Exercise) => done.has(e.id),
      () => false,
    );
    const currents = [...states.entries()].filter(([, s]) => s === "current");
    expect(currents).toHaveLength(1);
    // It belongs to the first started branch, reading the map top to bottom.
    expect(currents[0][0]).toBe(started[0].exercises[1].id);
  });

  it("locks premium exercises for a free player, but never a completed one", () => {
    const premium = exercisesAgregat.find((e) => e.premium)!;
    const { states } = computeRoadmapProgress(
      tiers,
      (e) => e.id === premium.id,
      (e) => !!e.premium,
    );
    expect(states.get(premium.id)).toBe("completed");
    const otherPremium = exercisesAgregat.find(
      (e) => e.premium && e.id !== premium.id,
    )!;
    expect(states.get(otherPremium.id)).toBe("locked");
  });
});
