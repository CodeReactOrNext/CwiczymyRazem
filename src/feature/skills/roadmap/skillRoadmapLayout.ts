import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import {
  DIFFICULTY_RANK,
  type RoadmapBranch,
  type RoadmapTier,
} from "./skillRoadmap.data";

/**
 * Geometry of the roadmap in map units (the SVG viewBox); the view scales it.
 *
 * One trunk down the middle, milestones on it, and up to four branch lanes per
 * band — two either side of the trunk, the way a tree fans out. A branch is a
 * serpentine chain: `dotsPerRow` dots left-to-right, a half-circle turn, the
 * next row back right-to-left, so a long chain grows down instead of across.
 * Branches of a tier fill a band of four lanes at a time; a tier with more
 * branches gets more bands stacked below the first.
 */
export const ROADMAP_GEOMETRY = {
  width: 1200,
  trunkX: 600,
  /** Left edge of each lane, outermost-left to outermost-right. */
  laneStarts: [40, 290, 690, 940],
  dotSpacing: 27,
  rowSpacing: 32,
  /**
   * Extra room where a chain steps up a difficulty, on top of `dotSpacing`.
   * A branch has at most four difficulties, so at most three of these.
   */
  groupGap: 10,
  /** Upper bound on a row; a branch that wraps spreads its dots evenly instead. */
  dotsPerRow: 8,
  /** Dot radius; the chain starts this far into the lane. */
  dotRadius: 7,
  /** The branch's name plus breathing room above its first row of dots. */
  branchHeaderHeight: 26,
  /** Vertical room between two bands of the same tier. */
  bandGap: 30,
  /** How far above a band its rail runs — clear of the branch names. */
  railOffset: 16,
  milestoneRadius: 24,
  /** From the milestone's bottom edge to the first band: the tier's name and count sit here, then the connectors swoop out below them. */
  milestoneLabelHeight: 80,
  tierGap: 16,
  /** Above the first milestone, clear of the view's top fade. */
  topPadding: 56,
  /** Mastery marker below the last tier, as far down as a milestone would be. */
  masteryOffset: 40,
  bottomPadding: 120,
} as const;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  /** Position in its branch, easiest first. */
  index: number;
}

export interface LayoutBranch {
  id: string;
  /** Lane index (0–3): 0–1 hang left of the trunk, 2–3 right. */
  lane: number;
  /** Left edge of the lane; labels start here. */
  x: number;
  /** Baseline of the branch label. */
  labelY: number;
  /** Where the connector lands: a small root marker left of the label. */
  root: { x: number; y: number };
  nodes: LayoutNode[];
  /** Right edge of the first row's last dot; the branch's level closes the header here. */
  firstRowRight: number;
  /** SVG path through the dots, with the serpentine turns, broken where the difficulty steps up. */
  chainPath: string;
  /**
   * The first dot of each difficulty group and how hard the group is, from
   * 1 (beginner) to 4 (hard) — that many pips sit under the dot.
   */
  difficultyMarks: { x: number; y: number; level: number }[];
  /** Short vertical drop from the band's rail down to the root marker. */
  connectorPath: string;
}

export interface LayoutTier {
  id: string;
  /** Milestone centre. */
  x: number;
  y: number;
  /** Where the tier's last band ends. */
  bottom: number;
  /** One horizontal rail per band, hung off the trunk, feeding its branches. */
  rails: string[];
  branches: LayoutBranch[];
}

export interface RoadmapLayout {
  width: number;
  height: number;
  trunkX: number;
  masteryY: number;
  tiers: LayoutTier[];
}

const G = ROADMAP_GEOMETRY;

/**
 * Which lanes a band of branches occupies, so a short band sits balanced around
 * the trunk instead of bunching against the left edge and leaving a hole on the
 * right. Lanes read outer-left, inner-left, inner-right, outer-right.
 */
const LANES_BY_BAND_SIZE: Record<number, number[]> = {
  1: [1],
  2: [1, 2],
  3: [0, 1, 2],
  4: [0, 1, 2, 3],
};

export const lanesForBand = (size: number): number[] =>
  LANES_BY_BAND_SIZE[size] ?? LANES_BY_BAND_SIZE[4];

export const branchRowCount = (exerciseCount: number): number =>
  Math.max(1, Math.ceil(exerciseCount / G.dotsPerRow));

/**
 * Dots per row for a given chain. A branch of nine is laid out 5 + 4 rather
 * than 8 + 1: rows of near-equal length read as a considered block, a single
 * orphan below a full row reads as an accident.
 */
export const dotsPerRowFor = (exerciseCount: number): number =>
  Math.ceil(exerciseCount / branchRowCount(exerciseCount));

const branchHeight = (exerciseCount: number): number =>
  G.branchHeaderHeight + branchRowCount(exerciseCount) * G.rowSpacing;

const NO_BREAKS: ReadonlySet<number> = new Set();

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
 * Serpentine dot positions for a chain that starts at (x0, y0), with a wider
 * step before every index in `breaksBefore`.
 */
export const chainPositions = (
  count: number,
  x0: number,
  y0: number,
  breaksBefore: ReadonlySet<number> = NO_BREAKS,
): { x: number; y: number }[] => {
  const perRow = dotsPerRowFor(count);
  const points: { x: number; y: number }[] = [];
  let x = 0;
  let direction = 1;
  for (let i = 0; i < count; i += 1) {
    if (i > 0 && i % perRow === 0) {
      // A new row starts right under the last dot and runs back the other
      // way, so the chain reads as one continuous line rather than as rows.
      direction = -direction;
    } else if (i > 0) {
      x +=
        direction * (G.dotSpacing + (breaksBefore.has(i) ? G.groupGap : 0));
    }
    points.push({ x, y: y0 + Math.floor(i / perRow) * G.rowSpacing });
  }
  // A gap on a row that runs back can carry it past the lane's left edge; the
  // whole chain then moves right so its leftmost dot still starts the lane.
  const minX = Math.min(0, ...points.map((p) => p.x));
  return points.map((p) => ({ x: x0 + p.x - minX, y: p.y }));
};

/**
 * One stretch of a chain, from dot `from` to dot `to`. Straight runs along a
 * row, half-circle turns between rows; the whole chain is passed in so a turn
 * drawn on its own still bends the same way as the line it belongs to.
 */
export const chainPathBetween = (
  points: { x: number; y: number }[],
  from: number,
  to: number,
): string => {
  if (to <= from || from < 0 || to >= points.length) return "";
  const r = G.rowSpacing / 2;
  let d = `M ${points[from].x} ${points[from].y}`;
  for (let i = from + 1; i <= to; i += 1) {
    const prev = points[i - 1];
    const p = points[i];
    if (prev.y === p.y) {
      d += ` L ${p.x} ${p.y}`;
      continue;
    }
    // Row change: the turn sits on the right when the previous row ran
    // left-to-right (clockwise arc), on the left otherwise.
    const sweep = prev.x >= (points[i - 2]?.x ?? -Infinity) ? 1 : 0;
    d += ` A ${r} ${r} 0 0 ${sweep} ${p.x} ${p.y}`;
  }
  return d;
};

/**
 * The whole chain, dot to dot, left open before every index in `breaksBefore`
 * so each difficulty group is its own stretch of line.
 */
export const chainPathFor = (
  points: { x: number; y: number }[],
  breaksBefore: ReadonlySet<number> = NO_BREAKS,
): string => {
  const stretches: string[] = [];
  let start = 0;
  for (let i = 1; i <= points.length; i += 1) {
    if (i === points.length || breaksBefore.has(i)) {
      const stretch = chainPathBetween(points, start, i - 1);
      if (stretch) stretches.push(stretch);
      start = i;
    }
  }
  return stretches.join(" ");
};

/**
 * One mark per difficulty group, under the leftmost dot of the row the group
 * starts on — on a row that runs back, that is the group's last dot there,
 * not its first, so the marks always sit at the left edge the eye starts from.
 */
export const difficultyMarksFor = (
  points: { x: number; y: number }[],
  exercises: Exercise[],
  breaks: ReadonlySet<number>,
): LayoutBranch["difficultyMarks"] => {
  const perRow = dotsPerRowFor(points.length);
  const starts = [0, ...breaks].filter((i) => i < points.length);
  return starts.map((start, k) => {
    const groupEnd = (starts[k + 1] ?? points.length) - 1;
    const rowEnd = (Math.floor(start / perRow) + 1) * perRow - 1;
    const onRow = points.slice(start, Math.min(groupEnd, rowEnd) + 1);
    return {
      x: Math.min(...onRow.map((p) => p.x)),
      y: points[start].y,
      level: DIFFICULTY_RANK[exercises[start].difficulty] + 1,
    };
  });
};

/** The horizontal rail a band hangs from, always reaching the trunk. */
export const railPathFor = (rootXs: number[], railY: number): string => {
  const left = Math.min(G.trunkX, ...rootXs);
  const right = Math.max(G.trunkX, ...rootXs);
  return `M ${left} ${railY} L ${right} ${railY}`;
};

/** The drop from that rail into one branch's root marker. */
export const dropPathFor = (
  root: { x: number; y: number },
  railY: number,
): string => `M ${root.x} ${railY} L ${root.x} ${root.y}`;

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};

export const layoutSkillRoadmap = (tiers: RoadmapTier[]): RoadmapLayout => {
  const laneCount = G.laneStarts.length;
  let cursor = G.topPadding;

  const laidOut: LayoutTier[] = tiers.map((tier) => {
    const milestoneY = cursor + G.milestoneRadius;
    let bandTop = milestoneY + G.milestoneRadius + G.milestoneLabelHeight;
    const branches: LayoutBranch[] = [];
    const rails: string[] = [];

    chunk<RoadmapBranch>(tier.branches, laneCount).forEach((band) => {
      // A band hangs off the trunk on one horizontal rail, with a short drop
      // into each branch — the same right angles the chains themselves use.
      const railY = bandTop - G.railOffset;
      const lanes = lanesForBand(band.length);
      const rootXs: number[] = [];

      band.forEach((branch, indexInBand) => {
        const lane = lanes[indexInBand];
        const x = G.laneStarts[lane];
        const labelY = bandTop + 14;
        const root = { x: x + G.dotRadius, y: bandTop + 8 };
        rootXs.push(root.x);
        const breaks = difficultyBreaks(branch.exercises);
        const points = chainPositions(
          branch.exercises.length,
          x + G.dotRadius,
          bandTop + G.branchHeaderHeight + G.dotRadius,
          breaks,
        );
        const nodes = points.map((p, index) => ({
          id: branch.exercises[index].id,
          x: p.x,
          y: p.y,
          index,
        }));
        branches.push({
          id: branch.id,
          lane,
          x,
          labelY,
          root,
          nodes,
          firstRowRight:
            Math.max(
              ...points.filter((p) => p.y === points[0].y).map((p) => p.x),
            ) + G.dotRadius,
          chainPath: chainPathFor(points, breaks),
          difficultyMarks: difficultyMarksFor(points, branch.exercises, breaks),
          connectorPath: dropPathFor(root, railY),
        });
      });

      rails.push(railPathFor(rootXs, railY));

      const bandHeight = Math.max(
        ...band.map((branch) => branchHeight(branch.exercises.length)),
      );
      bandTop += bandHeight + G.bandGap;
    });

    const bottom = bandTop - G.bandGap;
    cursor = bottom + G.tierGap;

    return { id: tier.id, x: G.trunkX, y: milestoneY, bottom, rails, branches };
  });

  const lastBottom = laidOut.length
    ? laidOut[laidOut.length - 1].bottom
    : G.topPadding;
  const masteryY = lastBottom + G.masteryOffset;

  return {
    width: G.width,
    height: masteryY + G.bottomPadding,
    trunkX: G.trunkX,
    masteryY,
    tiers: laidOut,
  };
};
