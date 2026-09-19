import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { RoadmapTier } from "./skillRoadmap.data";
import {
  chainPathBetween,
  chainPathFor,
  chainPositions,
  dotsPerRowFor,
  layoutSkillRoadmap,
  ROADMAP_GEOMETRY as G,
} from "./skillRoadmapLayout";

const exercise = (id: string): Exercise =>
  ({ id, difficulty: "easy", relatedSkills: [] }) as unknown as Exercise;

const tier = (id: string, sizes: number[]): RoadmapTier => ({
  id,
  title: id,
  subtitle: "",
  branches: sizes.map((size, i) => ({
    id: `${id}_b${i}`,
    label: `${id} ${i}`,
    skillId: "general",
    exercises: Array.from({ length: size }, (_, k) =>
      exercise(`${id}_${i}_${k}`),
    ),
  })),
});

describe("dotsPerRowFor", () => {
  it("fills one row up to the maximum", () => {
    expect(dotsPerRowFor(1)).toBe(1);
    expect(dotsPerRowFor(G.dotsPerRow)).toBe(G.dotsPerRow);
  });

  it("splits a wrapping branch into rows of near-equal length", () => {
    // Nine dots read as 5 + 4, never as a full row plus a lone straggler.
    expect(dotsPerRowFor(G.dotsPerRow + 1)).toBe(
      Math.ceil((G.dotsPerRow + 1) / 2),
    );
    expect(dotsPerRowFor(G.dotsPerRow * 2)).toBe(G.dotsPerRow);
    expect(dotsPerRowFor(G.dotsPerRow * 2 + 1)).toBe(
      Math.ceil((G.dotsPerRow * 2 + 1) / 3),
    );
  });
});

describe("chainPositions", () => {
  it("runs left-to-right, then snakes back on the next row", () => {
    const count = G.dotsPerRow + 2;
    const perRow = dotsPerRowFor(count);
    const pts = chainPositions(count, 0, 0);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[perRow - 1]).toEqual({
      x: (perRow - 1) * G.dotSpacing,
      y: 0,
    });
    // First dot of row two sits right under the last dot of row one.
    expect(pts[perRow]).toEqual({
      x: (perRow - 1) * G.dotSpacing,
      y: G.rowSpacing,
    });
    expect(pts[perRow + 1].x).toBe((perRow - 2) * G.dotSpacing);
  });

  it("keeps every row inside the lane", () => {
    const pts = chainPositions(G.dotsPerRow * 3, 0, 0);
    const widest = Math.max(...pts.map((p) => p.x));
    expect(widest).toBe((G.dotsPerRow - 1) * G.dotSpacing);
  });

  it("never places two dots on the same spot", () => {
    const pts = chainPositions(40, 0, 0);
    const keys = new Set(pts.map((p) => `${p.x},${p.y}`));
    expect(keys.size).toBe(40);
  });
});

describe("chainPathFor", () => {
  it("draws lines along a row and an arc at the turn", () => {
    const path = chainPathFor(chainPositions(G.dotsPerRow + 2, 0, 0));
    expect(path.startsWith("M 0 0 L")).toBe(true);
    expect(path).toContain(`A ${G.rowSpacing / 2} ${G.rowSpacing / 2} 0 0 1`);
  });

  it("is empty for an empty chain", () => {
    expect(chainPathFor([])).toBe("");
  });
});

describe("chainPathBetween", () => {
  const points = chainPositions(G.dotsPerRow + 2, 0, 0);

  it("draws only the asked-for stretch", () => {
    expect(chainPathBetween(points, 1, 2)).toBe(
      `M ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`,
    );
  });

  it("bends a lone turn the same way the whole chain does", () => {
    const perRow = dotsPerRowFor(points.length);
    const whole = chainPathFor(points);
    const turn = chainPathBetween(points, perRow - 1, perRow);
    expect(whole).toContain(turn.slice(turn.indexOf("A")));
  });

  it("is empty when the range is empty or out of bounds", () => {
    expect(chainPathBetween(points, 2, 2)).toBe("");
    expect(chainPathBetween(points, 0, points.length)).toBe("");
  });
});

describe("layoutSkillRoadmap", () => {
  it("gives every exercise one node and keeps lanes inside the map", () => {
    const layout = layoutSkillRoadmap([tier("a", [3, 40, 1, 9, 2])]);
    const nodes = layout.tiers[0].branches.flatMap((b) => b.nodes);
    expect(nodes).toHaveLength(55);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(55);
    nodes.forEach((n) => {
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(layout.width);
      expect(n.y).toBeLessThan(layout.height);
    });
  });

  it("wraps a fifth branch into a second band below the first four", () => {
    const layout = layoutSkillRoadmap([tier("a", [1, 1, 1, 1, 1])]);
    const [first, , , fourth, fifth] = layout.tiers[0].branches;
    expect(fourth.labelY).toBe(first.labelY);
    expect(fifth.labelY).toBeGreaterThan(first.labelY);
    // A band of one hangs from an inner lane, not out at the left edge.
    expect(fifth.lane).toBe(1);
  });

  it("balances a short band around the trunk", () => {
    const pair = layoutSkillRoadmap([tier("a", [2, 2])]).tiers[0].branches;
    expect(pair.map((b) => b.lane)).toEqual([1, 2]);
    expect(pair[0].x).toBeLessThan(G.trunkX);
    expect(pair[1].x).toBeGreaterThan(G.trunkX);

    const four = layoutSkillRoadmap([tier("a", [1, 1, 1, 1])]).tiers[0]
      .branches;
    expect(four.map((b) => b.lane)).toEqual([0, 1, 2, 3]);
  });

  it("stacks tiers without overlap and ends at mastery", () => {
    const layout = layoutSkillRoadmap([tier("a", [30]), tier("b", [2])]);
    const [a, b] = layout.tiers;
    expect(b.y - G.milestoneRadius).toBeGreaterThanOrEqual(
      a.bottom + G.tierGap,
    );
    expect(layout.masteryY).toBeGreaterThan(b.bottom);
    expect(layout.height).toBeGreaterThan(layout.masteryY);
    expect(layout.startY).toBeLessThan(a.y);
  });

  it("keeps a band's dots above the next band", () => {
    const layout = layoutSkillRoadmap([tier("a", [40, 1, 1, 1, 5])]);
    const [long, , , , below] = layout.tiers[0].branches;
    const lowestDot = Math.max(...long.nodes.map((n) => n.y));
    expect(below.labelY).toBeGreaterThan(lowestDot + G.dotRadius);
  });
});
