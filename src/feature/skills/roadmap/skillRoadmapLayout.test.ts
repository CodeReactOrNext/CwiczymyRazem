import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { RoadmapTier } from "./skillRoadmap.data";
import {
  chainPathBetween,
  chainPathFor,
  chainPositions,
  difficultyBreaks,
  difficultyMarksFor,
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

  describe("with difficulty breaks", () => {
    const count = 16; // two rows of eight
    const perRow = dotsPerRowFor(count);

    it("keeps a turn straight down even when a gap came before it", () => {
      const pts = chainPositions(count, 0, 0, new Set([3]));
      expect(pts[perRow].x).toBe(pts[perRow - 1].x);
      expect(pts[perRow].y).toBe(pts[perRow - 1].y + G.rowSpacing);
    });

    it("moves the chain right when a row running back would leave the lane", () => {
      // Gaps only on the second row push its far end past the lane's start.
      const x0 = 100;
      const pts = chainPositions(count, x0, 0, new Set([10, 13]));
      expect(Math.min(...pts.map((p) => p.x))).toBe(x0);
      expect(pts[0].x).toBe(x0 + 2 * G.groupGap);
    });

    it("stays within a row plus three gaps, however the gaps fall", () => {
      const pts = chainPositions(count, 0, 0, new Set([2, 9, 14]));
      const span =
        Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
      expect(span).toBeLessThanOrEqual(
        (G.dotsPerRow - 1) * G.dotSpacing + 3 * G.groupGap,
      );
    });
  });
});

describe("difficultyMarksFor", () => {
  const withDifficulties = (...levels: Exercise["difficulty"][]) =>
    levels.map((difficulty, i) => ({
      id: `e${i}`,
      difficulty,
    })) as unknown as Exercise[];

  it("marks a group on a row that runs back at its leftmost dot", () => {
    // 5 + 5: the easy group starts on the second row, which runs right-to-left.
    const exercises = withDifficulties(
      "beginner",
      "beginner",
      "beginner",
      "beginner",
      "beginner",
      "beginner",
      "easy",
      "easy",
      "easy",
      "easy",
    );
    const breaks = difficultyBreaks(exercises);
    const points = chainPositions(exercises.length, 0, 0, breaks);
    const [beginner, easy] = difficultyMarksFor(points, exercises, breaks);

    expect(beginner).toEqual({ x: points[0].x, y: 0, level: 1 });
    expect(easy).toEqual({ x: points[9].x, y: G.rowSpacing, level: 2 });
  });
});

describe("difficultyBreaks", () => {
  it("marks the first exercise of every new difficulty", () => {
    const breaks = difficultyBreaks([
      { difficulty: "beginner" },
      { difficulty: "beginner" },
      { difficulty: "easy" },
      { difficulty: "hard" },
      { difficulty: "hard" },
    ] as unknown as Exercise[]);
    expect([...breaks]).toEqual([2, 3]);
  });

  it("is empty for a branch of one difficulty", () => {
    expect(difficultyBreaks([exercise("a"), exercise("b")]).size).toBe(0);
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

  it("leaves the line open between difficulty groups", () => {
    const points = chainPositions(4, 0, 0, new Set([2]));
    expect(chainPathFor(points, new Set([2]))).toBe(
      `M ${points[0].x} 0 L ${points[1].x} 0 M ${points[2].x} 0 L ${points[3].x} 0`,
    );
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
  });

  it("opens a gap in a branch where the difficulty steps up", () => {
    const branchTier: RoadmapTier = {
      id: "a",
      title: "a",
      subtitle: "",
      branches: [
        {
          id: "a_b0",
          label: "a",
          skillId: "legato",
          exercises: [
            { id: "x1", difficulty: "beginner" },
            { id: "x2", difficulty: "beginner" },
            { id: "x3", difficulty: "medium" },
          ] as unknown as Exercise[],
        },
      ],
    };
    const [branch] = layoutSkillRoadmap([branchTier]).tiers[0].branches;
    const [first, second, third] = branch.nodes;
    expect(second.x - first.x).toBe(G.dotSpacing);
    expect(third.x - second.x).toBe(G.dotSpacing + G.groupGap);
    // The line stops at the second dot and does not reach into the next group.
    expect(branch.chainPath).toBe(
      `M ${first.x} ${first.y} L ${second.x} ${second.y}`,
    );
    // Each group is marked at its first dot with its difficulty.
    expect(branch.difficultyMarks).toEqual([
      { x: first.x, y: first.y, level: 1 },
      { x: third.x, y: third.y, level: 3 },
    ]);
  });

  it("measures the first row's right edge for the level to close on", () => {
    const [branch] = layoutSkillRoadmap([tier("a", [10])]).tiers[0].branches;
    const firstRow = branch.nodes.filter((n) => n.y === branch.nodes[0].y);
    expect(firstRow).toHaveLength(dotsPerRowFor(10));
    expect(branch.firstRowRight).toBe(
      Math.max(...firstRow.map((n) => n.x)) + G.dotRadius,
    );
  });

  it("keeps a band's dots above the next band", () => {
    const layout = layoutSkillRoadmap([tier("a", [40, 1, 1, 1, 5])]);
    const [long, , , , below] = layout.tiers[0].branches;
    const lowestDot = Math.max(...long.nodes.map((n) => n.y));
    expect(below.labelY).toBeGreaterThan(lowestDot + G.dotRadius);
  });
});
