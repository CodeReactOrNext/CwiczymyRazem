import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { RoadmapTier } from "./skillRoadmap.data";
import {
  clampRoadmapWidth,
  difficultyBreaks,
  keysPerRowForWidth,
  layoutSkillRoadmap,
  ROADMAP_GEOMETRY as G,
  rowSizeFor,
  twigPath,
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

describe("rowSizeFor", () => {
  it("fills one row up to the maximum", () => {
    expect(rowSizeFor(1, 8)).toBe(1);
    expect(rowSizeFor(8, 8)).toBe(8);
  });

  it("splits a wrapping skill into rows of near-equal length", () => {
    // Thirteen reads as 7 + 6, never as a full row plus a leftover.
    expect(rowSizeFor(13, 8)).toBe(7);
    expect(rowSizeFor(16, 8)).toBe(8);
    expect(rowSizeFor(17, 8)).toBe(6);
    expect(rowSizeFor(30, 8)).toBe(8);
  });
});

describe("keysPerRowForWidth", () => {
  it("gives the full row on a wide map and fewer keys on a narrow one", () => {
    expect(keysPerRowForWidth(G.maxWidth)).toBe(G.maxKeysPerRow);
    const narrow = keysPerRowForWidth(780);
    expect(narrow).toBeLessThan(G.maxKeysPerRow);
    expect(narrow).toBeGreaterThanOrEqual(G.minKeysPerRow);
  });

  it("never drops below the minimum", () => {
    expect(keysPerRowForWidth(100)).toBe(G.minKeysPerRow);
  });
});

describe("clampRoadmapWidth", () => {
  it("keeps the map between its narrowest and widest", () => {
    expect(clampRoadmapWidth(200)).toBe(G.minWidth);
    expect(clampRoadmapWidth(900.4)).toBe(900);
    expect(clampRoadmapWidth(4000)).toBe(G.maxWidth);
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

describe("twigPath", () => {
  it("leaves the trunk above the row and ends level at the key", () => {
    const right = twigPath(500, 1, 200, 700);
    expect(right.startsWith(`M 500 ${200 - G.forkRise} C`)).toBe(true);
    expect(right.endsWith("L 700 200")).toBe(true);
    // The bend goes the way the row runs.
    expect(right).toContain(`${500 + G.forkRise} 200`);
    expect(twigPath(500, -1, 200, 300)).toContain(`${500 - G.forkRise} 200`);
  });
});

describe("layoutSkillRoadmap", () => {
  it("gives every exercise one key, inside the map", () => {
    const layout = layoutSkillRoadmap([tier("a", [3, 40, 1, 9, 2])]);
    const nodes = layout.tiers[0].branches.flatMap((b) => b.nodes);
    expect(nodes).toHaveLength(55);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(55);
    expect(new Set(nodes.map((n) => `${n.x},${n.y}`)).size).toBe(55);
    nodes.forEach((n) => {
      expect(n.x - G.keySize / 2).toBeGreaterThanOrEqual(G.sideMargin);
      expect(n.x + G.keySize / 2).toBeLessThanOrEqual(
        layout.width - G.sideMargin,
      );
      expect(n.y).toBeLessThan(layout.height);
    });
  });

  it("keeps every row inside a narrow map too, with difficulty gaps", () => {
    const mixed: RoadmapTier = {
      id: "a",
      title: "a",
      subtitle: "",
      branches: [
        {
          id: "a_b0",
          label: "a",
          skillId: "legato",
          exercises: Array.from({ length: 30 }, (_, i) => ({
            id: `x${i}`,
            difficulty: (["beginner", "easy", "medium", "hard"] as const)[
              i % 4
            ],
          })) as unknown as Exercise[],
        },
      ],
    };
    // Unsorted on purpose: a break before nearly every key is the worst case.
    const layout = layoutSkillRoadmap([mixed, tier("b", [12, 12])], {
      width: G.minWidth,
    });
    layout.tiers
      .flatMap((t) => t.branches)
      .flatMap((b) => b.nodes)
      .forEach((n) => {
        expect(n.x).toBeGreaterThan(0);
        expect(n.x).toBeLessThan(layout.width);
      });
  });

  it("hangs skills in pairs, one either side of the trunk at the same height", () => {
    const [a, b, c] = layoutSkillRoadmap([tier("a", [2, 2, 2])]).tiers[0]
      .branches;
    expect([a.side, b.side, c.side]).toEqual([-1, 1, -1]);
    expect(b.top).toBe(a.top);
    expect(c.top).toBeGreaterThan(a.top);
    expect(a.nodes[0].y).toBe(b.nodes[0].y);
  });

  it("runs every row away from the trunk, starting at the same distance", () => {
    const layout = layoutSkillRoadmap([tier("a", [13, 13])]);
    const [left, right] = layout.tiers[0].branches;
    expect(left.rows).toHaveLength(2);
    left.rows.forEach((row) => {
      expect(left.nodes[row.first].x).toBe(layout.trunkX - G.rowStart);
      expect(left.nodes[row.last].x).toBeLessThan(left.nodes[row.first].x);
    });
    right.rows.forEach((row) => {
      expect(right.nodes[row.first].x).toBe(layout.trunkX + G.rowStart);
      expect(right.nodes[row.last].x).toBeGreaterThan(right.nodes[row.first].x);
    });
    expect(left.rows[1].y - left.rows[0].y).toBe(G.rowPitch);
  });

  it("gives a narrower map shorter rows, not smaller keys", () => {
    const wide = layoutSkillRoadmap([tier("a", [16])]);
    const narrow = layoutSkillRoadmap([tier("a", [16])], { width: 700 });
    expect(narrow.width).toBe(700);
    expect(narrow.trunkX).toBe(350);
    expect(narrow.tiers[0].branches[0].rows.length).toBeGreaterThan(
      wide.tiers[0].branches[0].rows.length,
    );
    const [first, second] = narrow.tiers[0].branches[0].nodes;
    expect(Math.abs(second.x - first.x)).toBe(G.keyStep);
  });

  it("opens a gap in a row where the difficulty steps up, and marks each group", () => {
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
    expect(first.x - second.x).toBe(G.keyStep);
    expect(second.x - third.x).toBe(G.keyStep + G.groupGap);
    expect(branch.difficultyMarks).toEqual([
      { x: first.x, y: first.y, level: 1 },
      { x: third.x, y: third.y, level: 3 },
    ]);
  });

  it("makes room over the row that carries the Start tag", () => {
    const tiers = [tier("a", [3, 3])];
    const plain = layoutSkillRoadmap(tiers).tiers[0].branches[0];
    const marked = layoutSkillRoadmap(tiers, { currentId: "a_0_1" }).tiers[0]
      .branches[0];
    expect(marked.nodes[0].y - plain.nodes[0].y).toBe(G.startTagRoom);
  });

  it("opens the bubble under the picked key's row and pushes the rest down", () => {
    const tiers = [tier("a", [13, 2]), tier("b", [1])];
    const plain = layoutSkillRoadmap(tiers);
    const picked = layoutSkillRoadmap(tiers, { selectedId: "a_0_2" });
    const branch = picked.tiers[0].branches[0];
    const [firstRow, secondRow] = branch.rows;

    expect(branch.bubble?.nodeId).toBe("a_0_2");
    expect(branch.bubble?.top).toBeGreaterThan(firstRow.y + G.keySize / 2);
    // The second row's keys sit below the bubble, not under it. (Its twig
    // bends out next to the trunk, clear of the bubble's inner edge.)
    expect(secondRow.y - G.keySize / 2).toBeGreaterThanOrEqual(
      (branch.bubble?.top ?? 0) + G.bubbleHeight,
    );
    // The pointer sits over the picked key.
    expect((branch.bubble?.left ?? 0) + (branch.bubble?.pointerX ?? 0)).toBe(
      branch.nodes[2].x,
    );
    // Nothing else on the map carries a bubble, and everything below moved.
    expect(picked.tiers[0].branches[1].bubble).toBeUndefined();
    expect(picked.tiers[1].y).toBeGreaterThan(plain.tiers[1].y);
    expect(picked.height).toBeGreaterThan(plain.height);
  });

  it("keeps the bubble on its own side of the trunk", () => {
    const tiers = [tier("a", [4, 4])];
    const left = layoutSkillRoadmap(tiers, { selectedId: "a_0_0" }).tiers[0]
      .branches[0].bubble;
    const layout = layoutSkillRoadmap(tiers, { selectedId: "a_1_0" });
    const right = layout.tiers[0].branches[1].bubble;
    expect((left?.left ?? 0) + (left?.width ?? 0)).toBeLessThan(layout.trunkX);
    expect(right?.left).toBeGreaterThan(layout.trunkX);
    expect((right?.left ?? 0) + (right?.width ?? 0)).toBeLessThanOrEqual(
      layout.width - G.sideMargin,
    );
  });

  it("folds a tier down to its key and one line", () => {
    const tiers = [tier("a", [30, 30]), tier("b", [2])];
    const open = layoutSkillRoadmap(tiers);
    const folded = layoutSkillRoadmap(tiers, {
      foldedTierIds: new Set(["a"]),
    });
    expect(folded.tiers[0].folded).toBe(true);
    expect(folded.tiers[0].branches).toHaveLength(0);
    expect(folded.tiers[0].foldedNoteTop).toBeGreaterThan(
      folded.tiers[0].y + G.tierKeySize / 2,
    );
    expect(folded.tiers[1].y).toBeLessThan(open.tiers[1].y);
    expect(folded.tiers[1].branches).toHaveLength(1);
  });

  it("stacks tiers without overlap and ends at mastery", () => {
    const layout = layoutSkillRoadmap([tier("a", [30]), tier("b", [2])]);
    const [a, b] = layout.tiers;
    expect(b.labelTop).toBeGreaterThanOrEqual(a.bottom + G.tierGap);
    expect(b.y).toBeGreaterThan(b.labelTop);
    expect(layout.masteryLabelTop).toBeGreaterThan(b.bottom);
    expect(layout.masteryY).toBeGreaterThan(layout.masteryLabelTop);
    expect(layout.height).toBeGreaterThan(layout.masteryY);
  });

  it("keeps a pair's keys above the next pair", () => {
    const layout = layoutSkillRoadmap([tier("a", [40, 1, 5])]);
    const [long, , below] = layout.tiers[0].branches;
    const lowestKey = Math.max(...long.nodes.map((n) => n.y));
    expect(below.top).toBeGreaterThan(lowestKey + G.keySize / 2 + G.keyLip);
  });
});
