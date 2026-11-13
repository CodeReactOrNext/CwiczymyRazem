import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { RoadmapTier } from "./skillRoadmap.data";
import {
  layoutSkillRoadmap,
  ROADMAP_GEOMETRY as G,
  twigPath,
} from "./skillRoadmapLayout";
import { roadmapLines } from "./skillRoadmapLines";
import { computeRoadmapProgress } from "./skillRoadmapStates";

const tier = (id: string, sizes: number[]): RoadmapTier => ({
  id,
  title: id,
  subtitle: "",
  branches: sizes.map((size, i) => ({
    id: `${id}_b${i}`,
    label: `${id} ${i}`,
    skillId: "general",
    exercises: Array.from(
      { length: size },
      (_, k) =>
        ({ id: `${id}_${i}_${k}`, difficulty: "easy" }) as unknown as Exercise,
    ),
  })),
});

const setup = (tiers: RoadmapTier[], done: string[], folded: string[] = []) => {
  const progress = computeRoadmapProgress(
    tiers,
    (e) => done.includes(e.id),
    () => false,
  );
  const layout = layoutSkillRoadmap(tiers, { foldedTierIds: new Set(folded) });
  return { layout, progress, lines: roadmapLines(layout, progress) };
};

describe("roadmapLines", () => {
  it("draws one neutral twig per row, out to the row's last key", () => {
    const { layout, lines } = setup([tier("a", [13, 2])], []);
    const [left, right] = layout.tiers[0].branches;
    expect(lines.base).toHaveLength(3);
    expect(lines.base).toContain(
      twigPath(layout.trunkX, -1, left.rows[1].y, left.nodes[12].x),
    );
    expect(lines.base).toContain(
      twigPath(layout.trunkX, 1, right.rows[0].y, right.nodes[1].x),
    );
  });

  it("is all skeleton on a blank map, apart from the way to the first key", () => {
    const { layout, lines } = setup([tier("a", [3])], []);
    const [branch] = layout.tiers[0].branches;
    expect(lines.done).toEqual([]);
    // The very first key is "up next", so its twig is the next step.
    expect(lines.next).toEqual([
      twigPath(layout.trunkX, -1, branch.rows[0].y, branch.nodes[0].x),
    ]);
    expect(lines.sapTo).toBe(branch.rows[0].y - G.forkRise);
  });

  it("colours a row out to its furthest finished key, even with holes", () => {
    const { layout, lines } = setup([tier("a", [6])], ["a_0_0", "a_0_3"]);
    const [branch] = layout.tiers[0].branches;
    expect(lines.done).toEqual([
      twigPath(layout.trunkX, -1, branch.rows[0].y, branch.nodes[3].x),
    ]);
  });

  it("draws the step to the next key from the key before it", () => {
    const { layout, lines } = setup([tier("a", [6])], ["a_0_0"]);
    const [branch] = layout.tiers[0].branches;
    const y = branch.rows[0].y;
    expect(lines.next).toEqual([
      `M ${branch.nodes[0].x} ${y} L ${branch.nodes[1].x} ${y}`,
    ]);
  });

  it("runs the trunk's colour down to the lowest row that leads somewhere done", () => {
    const { layout, lines } = setup(
      [tier("a", [2, 2]), tier("b", [2]), tier("c", [2])],
      ["a_0_0", "b_0_0"],
    );
    const lowest = layout.tiers[1].branches[0].rows[0].y - G.forkRise;
    expect(lines.sapTo).toBe(lowest);
    expect(lines.sapTo).toBeLessThan(layout.tiers[2].y);
  });

  it("still lights a folded tier's key when something inside is done", () => {
    const { layout, lines } = setup(
      [tier("a", [2]), tier("b", [2])],
      ["b_0_0"],
      ["b"],
    );
    expect(layout.tiers[1].branches).toHaveLength(0);
    expect(lines.sapTo).toBe(layout.tiers[1].y);
  });
});
