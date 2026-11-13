import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import {
  DIFFICULTY_RANK,
  type RoadmapBranch,
  type RoadmapTier,
} from "./skillRoadmap.data";

/**
 * Geometry of the roadmap, in CSS pixels.
 *
 * One straight trunk down the middle with a big key per tier on it. A tier's
 * skills hang off the trunk in pairs, one either side at the same height. A
 * skill is one or more rows of exercise keys, and every row leaves the trunk on
 * its own curve — a twig — and reads from the trunk outwards, so nothing snakes
 * back and the middle of the map is a single line.
 *
 * The map follows the width it is given: a narrower panel gets shorter rows,
 * not a scaled-down drawing, so the keys keep their size.
 */
export const ROADMAP_GEOMETRY = {
  maxWidth: 1100,
  minWidth: 640,
  /** Clear space kept at the map's left and right edges. */
  sideMargin: 20,

  /** An exercise key: its face, and the lip under it. */
  keySize: 30,
  keyLip: 4,
  /** Centre to centre along a row. */
  keyStep: 42,
  /** Extra room where a row steps up a difficulty, on top of `keyStep`. */
  groupGap: 12,
  /** Row to row inside one skill. */
  rowPitch: 52,
  /** Trunk to the centre of a row's first key. */
  rowStart: 112,
  /** Trunk to where a skill's name starts. */
  headerX: 96,
  /** How far above its row a twig leaves the trunk. */
  forkRise: 44,
  maxKeysPerRow: 8,
  minKeysPerRow: 3,

  /** A skill's name, plus the room above its first row. */
  headerHeight: 36,
  /** Extra room above the row that carries the "Start" tag. */
  startTagRoom: 34,
  /** Under a row's keys: the difficulty pips and a little air. */
  rowFoot: 12,
  /** Between two pairs of skills in a tier. */
  branchGap: 30,

  /** A tier's key on the trunk. */
  tierKeySize: 80,
  tierKeyLip: 7,
  /** The tier's name and count, stacked above its key. */
  tierLabelHeight: 70,
  /** From under a tier's key to its first pair of skills. */
  tierToBranches: 26,
  /** After a tier's last pair, before the next tier's name. */
  tierGap: 10,
  /** What a folded tier takes under its key: one line saying what is hidden. */
  foldedHeight: 64,

  /** The bubble that opens under the picked exercise. */
  bubbleHeight: 92,
  bubbleGap: 20,

  topPadding: 24,
  bottomPadding: 48,
} as const;

const G = ROADMAP_GEOMETRY;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  /** Position in its skill, easiest first. */
  index: number;
}

export interface LayoutRow {
  y: number;
  /** Indexes into the branch's nodes; a row is never empty. */
  first: number;
  last: number;
}

export interface LayoutBubble {
  nodeId: string;
  top: number;
  left: number;
  width: number;
  /** Where the picked key sits, measured from the bubble's left edge. */
  pointerX: number;
}

export interface LayoutBranch {
  id: string;
  /** -1 hangs left of the trunk, 1 right. Rows run away from the trunk. */
  side: -1 | 1;
  /** Top of the skill's name. */
  top: number;
  /** The edge the name is anchored to, on the trunk's side. */
  headerX: number;
  nodes: LayoutNode[];
  rows: LayoutRow[];
  /**
   * The first key of each difficulty group and how hard the group is, from
   * 1 (beginner) to 4 (hard) — that many pips sit under the key.
   */
  difficultyMarks: { x: number; y: number; level: number }[];
  /** Set on the one branch that holds the picked exercise. */
  bubble?: LayoutBubble;
}

export interface LayoutTier {
  id: string;
  /** Top of the tier's name, above its key. */
  labelTop: number;
  /** Centre of the tier's key. */
  y: number;
  folded: boolean;
  /** Top of the "skills hidden" line; only meaningful when folded. */
  foldedNoteTop: number;
  branches: LayoutBranch[];
  bottom: number;
}

export interface RoadmapLayout {
  width: number;
  height: number;
  trunkX: number;
  keysPerRow: number;
  masteryLabelTop: number;
  masteryY: number;
  tiers: LayoutTier[];
}

export interface RoadmapLayoutOptions {
  /** Width of the panel the map is drawn in; clamped to the geometry's range. */
  width?: number;
  /** The picked exercise — its row makes room for the bubble under it. */
  selectedId?: string | null;
  /** The "up next" exercise — its row makes room for the Start tag over it. */
  currentId?: string | null;
  foldedTierIds?: ReadonlySet<string>;
}

export const clampRoadmapWidth = (width: number): number =>
  Math.min(G.maxWidth, Math.max(G.minWidth, Math.round(width)));

/**
 * How many keys fit on a row for a given map width, with room left for the
 * three difficulty gaps a row can carry.
 */
export const keysPerRowForWidth = (width: number): number => {
  const room =
    width / 2 - G.sideMargin - G.keySize / 2 - G.rowStart - 3 * G.groupGap;
  const fits = Math.floor(room / G.keyStep) + 1;
  return Math.min(G.maxKeysPerRow, Math.max(G.minKeysPerRow, fits));
};

/**
 * Keys per row for one skill. Rows come out near-equal — thirteen is 7 + 6,
 * never 8 + 5 — so a skill reads as a block rather than a row and a leftover.
 */
export const rowSizeFor = (
  exerciseCount: number,
  maxPerRow: number,
): number => {
  const rows = Math.max(1, Math.ceil(exerciseCount / maxPerRow));
  return Math.max(1, Math.ceil(exerciseCount / rows));
};

/**
 * Where a branch steps up a difficulty: the index of the first exercise of
 * each new difficulty. Branches are sorted easiest first, so these split the
 * chain into its beginner, easy, medium and hard groups.
 */
export const difficultyBreaks = (exercises: Exercise[]): Set<number> =>
  new Set(
    exercises.flatMap((exercise, i) =>
      i > 0 && exercise.difficulty !== exercises[i - 1].difficulty ? [i] : [],
    ),
  );

/**
 * A twig: leaves the trunk heading down, bends out to the side and runs level
 * to `toX`. Every row hangs off the trunk on one of these.
 */
export const twigPath = (
  trunkX: number,
  side: -1 | 1,
  y: number,
  toX: number,
): string =>
  `M ${trunkX} ${y - G.forkRise} C ${trunkX} ${y - 12}, ${trunkX + side * 12} ${y}, ${trunkX + side * G.forkRise} ${y} L ${toX} ${y}`;

interface BranchContext {
  width: number;
  trunkX: number;
  keysPerRow: number;
  selectedId?: string | null;
  currentId?: string | null;
}

/** One skill on one side of the trunk, and how tall it came out. */
const layoutBranch = (
  branch: RoadmapBranch,
  side: -1 | 1,
  top: number,
  ctx: BranchContext,
): { branch: LayoutBranch; height: number } => {
  const { exercises } = branch;
  const breaks = difficultyBreaks(exercises);
  const perRow = rowSizeFor(exercises.length, ctx.keysPerRow);
  const selectedIndex = exercises.findIndex((e) => e.id === ctx.selectedId);
  const selectedRow =
    selectedIndex < 0 ? -1 : Math.floor(selectedIndex / perRow);
  const hasCurrent = exercises.some((e) => e.id === ctx.currentId);
  const firstRowY =
    top + G.headerHeight + (hasCurrent ? G.startTagRoom : 0) + G.keySize / 2;
  const underKey = G.keySize / 2 + G.keyLip;
  // What an open bubble pushes the rows below it down by.
  const bubbleRoom = G.bubbleGap + G.bubbleHeight + 6;

  const nodes: LayoutNode[] = [];
  const rows: LayoutRow[] = [];
  const difficultyMarks: LayoutBranch["difficultyMarks"] = [];
  let bubble: LayoutBubble | undefined;
  let bottom = firstRowY;

  for (let first = 0; first < exercises.length; first += perRow) {
    const row = rows.length;
    const last = Math.min(exercises.length, first + perRow) - 1;
    const y =
      firstRowY +
      row * G.rowPitch +
      (selectedRow >= 0 && row > selectedRow ? bubbleRoom : 0);
    let distance = G.rowStart;
    for (let index = first; index <= last; index += 1) {
      if (index > first)
        distance += G.keyStep + (breaks.has(index) ? G.groupGap : 0);
      const x = ctx.trunkX + side * distance;
      nodes.push({ id: exercises[index].id, x, y, index });
      if (index === 0 || breaks.has(index))
        difficultyMarks.push({
          x,
          y,
          level: DIFFICULTY_RANK[exercises[index].difficulty] + 1,
        });
    }
    rows.push({ y, first, last });
    bottom = y + underKey + G.rowFoot;

    if (row === selectedRow) {
      const left = side > 0 ? ctx.trunkX + G.headerX - 16 : G.sideMargin;
      bubble = {
        nodeId: exercises[selectedIndex].id,
        top: y + underKey + G.bubbleGap,
        left,
        width: ctx.width / 2 - G.headerX - G.sideMargin + 16,
        pointerX: nodes[selectedIndex].x - left,
      };
      bottom = y + underKey + bubbleRoom;
    }
  }

  return {
    branch: {
      id: branch.id,
      side,
      top,
      headerX: ctx.trunkX + side * G.headerX,
      nodes,
      rows,
      difficultyMarks,
      bubble,
    },
    height: bottom - top,
  };
};

export const layoutSkillRoadmap = (
  tiers: RoadmapTier[],
  options: RoadmapLayoutOptions = {},
): RoadmapLayout => {
  const width = clampRoadmapWidth(options.width ?? G.maxWidth);
  const ctx: BranchContext = {
    width,
    trunkX: width / 2,
    keysPerRow: keysPerRowForWidth(width),
    selectedId: options.selectedId,
    currentId: options.currentId,
  };
  const keyRadius = G.tierKeySize / 2;
  let cursor = G.topPadding;

  const laidOut: LayoutTier[] = tiers.map((tier) => {
    const labelTop = cursor;
    const y = labelTop + G.tierLabelHeight + keyRadius;
    const underKey = y + keyRadius + G.tierKeyLip;
    const folded = !!options.foldedTierIds?.has(tier.id);
    const branches: LayoutBranch[] = [];

    if (folded) {
      cursor = underKey + G.foldedHeight;
      return {
        id: tier.id,
        labelTop,
        y,
        folded,
        foldedNoteTop: underKey + 16,
        branches,
        bottom: cursor,
      };
    }

    let top = underKey + G.tierToBranches;
    for (let i = 0; i < tier.branches.length; i += 2) {
      const left = layoutBranch(tier.branches[i], -1, top, ctx);
      branches.push(left.branch);
      let height = left.height;
      if (tier.branches[i + 1]) {
        const right = layoutBranch(tier.branches[i + 1], 1, top, ctx);
        branches.push(right.branch);
        height = Math.max(height, right.height);
      }
      top += height + G.branchGap;
    }

    const bottom = top - G.branchGap;
    cursor = top + G.tierGap;
    return {
      id: tier.id,
      labelTop,
      y,
      folded,
      foldedNoteTop: underKey + 16,
      branches,
      bottom,
    };
  });

  const masteryLabelTop = cursor;
  const masteryY = masteryLabelTop + G.tierLabelHeight + keyRadius;

  return {
    width,
    height: masteryY + keyRadius + G.tierKeyLip + G.bottomPadding,
    trunkX: ctx.trunkX,
    keysPerRow: ctx.keysPerRow,
    masteryLabelTop,
    masteryY,
    tiers: laidOut,
  };
};
