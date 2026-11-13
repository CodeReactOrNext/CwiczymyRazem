import {
  ROADMAP_GEOMETRY as G,
  type RoadmapLayout,
  twigPath,
} from "./skillRoadmapLayout";
import type { RoadmapProgress } from "./skillRoadmapStates";

export interface RoadmapLines {
  /** The skeleton: every row's twig, out to its last key. */
  base: string[];
  /** The way to what is done: a row's twig, out to its furthest finished key. */
  done: string[];
  /** The last step to the "up next" key. */
  next: string[];
  /**
   * How far down the trunk the finished colour runs, or null on a blank map.
   * It reaches the lowest twig that leads somewhere done, so every finished
   * exercise is joined to the top of the tree by one unbroken line.
   */
  sapTo: number | null;
}

/**
 * The lines of the map, sorted by what they mean. The skeleton is neutral;
 * colour only marks the way from the root to something finished, and the last
 * step to what is next.
 */
export const roadmapLines = (
  layout: RoadmapLayout,
  progress: Pick<RoadmapProgress, "states" | "byTier">,
): RoadmapLines => {
  const lines: Omit<RoadmapLines, "sapTo"> = { base: [], done: [], next: [] };
  let sapTo: number | null = null;
  const reach = (y: number) => {
    sapTo = sapTo === null ? y : Math.max(sapTo, y);
  };

  layout.tiers.forEach((tier) => {
    // A folded tier draws no rows, but what is done inside still lights its key.
    if ((progress.byTier.get(tier.id)?.completed ?? 0) > 0) reach(tier.y);

    tier.branches.forEach((branch) => {
      branch.rows.forEach((row) => {
        const twigTo = (index: number) =>
          twigPath(layout.trunkX, branch.side, row.y, branch.nodes[index].x);
        lines.base.push(twigTo(row.last));

        let furthestDone = -1;
        let current = -1;
        for (let index = row.first; index <= row.last; index += 1) {
          const state = progress.states.get(branch.nodes[index].id);
          if (state === "completed") furthestDone = index;
          if (state === "current") current = index;
        }

        if (furthestDone >= 0) {
          lines.done.push(twigTo(furthestDone));
          reach(row.y - G.forkRise);
        }
        if (current === row.first) {
          lines.next.push(twigTo(current));
          reach(row.y - G.forkRise);
        } else if (current > row.first) {
          lines.next.push(
            `M ${branch.nodes[current - 1].x} ${row.y} L ${branch.nodes[current].x} ${row.y}`,
          );
        }
      });
    });
  });

  return { ...lines, sapTo };
};
