import type { PartSlot, RewardPayout } from "lib/rewards/rewardPayout";
import { rollRewardParts } from "lib/rewards/rewardPayout";

import type {
  BpmProgressMap,
  ScaleTreeNodeDef,
} from "../types/scaleTree.types";
import { collectBpms, isExerciseCleared } from "./exerciseClearance";
import { SCALE_TREE_NODES, SCALE_TREE_POSITIONS } from "./scaleTreeNodes";

type ScaleFamily = ScaleTreeNodeDef["scaleFamily"];

/**
 * How a tree pays out, box by box.
 *
 * One reward per box, and the ladder climbs: the fifth box of a pentatonic tree
 * is worth four times the first. A flat rate would have paid the same for the
 * row a player clears in their first month as for the one they reach a year
 * later, and the later rows are where trees are abandoned.
 *
 * The last box of a tree pays the bonus and the only free case in the whole
 * feature. Boxes are the common rung — five to seven per tree, nine trees — so
 * a token on each would have put over fifty free cases in the game; putting it
 * on the row that finishes a tree keeps it as rare as finishing one.
 *
 * No points anywhere. Points rank the leaderboard, and that board is meant to
 * say who practises, not who collects; Fame, parts and cases all spend inside
 * the Arsenal, where a reward for a long grind belongs.
 */
interface BoxLadder {
  /** What the first box of the tree pays. */
  baseFame: number;
  /** Added again for each box further down the tree. */
  stepFame: number;
  /** Paid on top of the ladder for closing the last box. */
  finaleFame: number;
}

export const BOX_LADDERS: Record<ScaleFamily, BoxLadder> = {
  // 5 boxes: 50/65/80/95/110, and the last one carries 210 in all.
  pentatonic: { baseFame: 50, stepFame: 15, finaleFame: 100 },
  // 7 rows apiece, so the same ladder runs two rungs further.
  diatonic: { baseFame: 50, stepFame: 15, finaleFame: 120 },
  mode: { baseFame: 50, stepFame: 15, finaleFame: 120 },
};

/** What the finishing box hands over on top of its Fame. */
const FINALE_PARTS: PartSlot[] = [
  { tier: "Epic", qty: 3 },
  { tier: "Legendary", qty: 1 },
];

/**
 * The ledger id one finished box is recorded under.
 *
 * Keyed on the fret the box is anchored at, not on its ordinal: the row labels
 * follow the key the player is in, but the shapes — and therefore the nodes and
 * their ids — never move. A box collected in A is the same box in C.
 *
 * Deliberately not the `_pos<n>_reward` id the retired React Flow tree used, so
 * a reward collected under that flow cannot be read as this one, or the reverse.
 */
export const boxRewardId = (scaleType: string, position: number): string =>
  `scale_box_${scaleType}_${position}`;

/** Every node belonging to one scale — the whole tree, gateway node included. */
export const getScaleNodes = (
  scaleType: string,
  nodes: readonly ScaleTreeNodeDef[] = SCALE_TREE_NODES,
): ScaleTreeNodeDef[] => nodes.filter((node) => node.scaleType === scaleType);

/** Every node in one box — the shapes of a single row, without the gateway. */
export const getBoxNodes = (
  scaleType: string,
  position: number,
  nodes: readonly ScaleTreeNodeDef[] = SCALE_TREE_NODES,
): ScaleTreeNodeDef[] =>
  getScaleNodes(scaleType, nodes).filter(
    (node) =>
      !node.id.includes("single_string") &&
      node.requiredExercises[0]?.position === position,
  );

/** Where this box sits in its tree, and whether it is the one that finishes it. */
const locateBox = (
  scaleType: string,
  position: number,
): { index: number; isFinale: boolean } | null => {
  const positions = SCALE_TREE_POSITIONS[scaleType];
  if (!positions) return null;

  const index = positions.indexOf(position);
  if (index < 0) return null;

  return { index, isFinale: index === positions.length - 1 };
};

/**
 * The payout for finishing one box, or null for a fret the tree has no box at.
 *
 * Deterministic in both halves: the ladder fixes the amounts, and the box's own
 * reward id seeds which parts come out — so the block can print the payout long
 * before the player is anywhere near earning it, and the claim route re-derives
 * exactly the same thing rather than trusting what the block said.
 */
export const getBoxReward = (
  scaleType: string,
  position: number,
  nodes: readonly ScaleTreeNodeDef[] = SCALE_TREE_NODES,
): RewardPayout | null => {
  const place = locateBox(scaleType, position);
  const family = getBoxNodes(scaleType, position, nodes)[0]?.scaleFamily;
  if (!place || !family) return null;

  const ladder = BOX_LADDERS[family];
  const fame =
    ladder.baseFame +
    ladder.stepFame * place.index +
    (place.isFinale ? ladder.finaleFame : 0);

  // Early boxes pay bulk Standard parts, later ones pay the Epic grade the
  // workshop actually wants, and the finale pays what a whole tree is worth.
  const parts: PartSlot[] = place.isFinale
    ? FINALE_PARTS
    : place.index < 2
      ? [{ tier: "Standard", qty: 3 }]
      : [{ tier: "Epic", qty: 1 }];

  return {
    fame,
    caseTokens: place.isFinale ? 1 : 0,
    parts: rollRewardParts(boxRewardId(scaleType, position), parts),
  };
};

/** True for the box that closes its tree — the one carrying the free case. */
export const isFinaleBox = (scaleType: string, position: number): boolean =>
  locateBox(scaleType, position)?.isFinale ?? false;

export interface ScaleCompletion {
  done: number;
  total: number;
  isComplete: boolean;
}

/**
 * How many of these nodes are finished, counted straight off the tempo record.
 *
 * Node *status* is not consulted, only clearance: a node whose exercises are all
 * passed counts even if the walk through the prerequisites has not caught up
 * with it. The two agree in practice — nothing can be cleared before what feeds
 * it — and counting the record itself is what lets the server run this without
 * rebuilding the whole status graph.
 */
const countCleared = (
  scaleNodes: readonly ScaleTreeNodeDef[],
  progress: BpmProgressMap,
): ScaleCompletion => {
  const done = scaleNodes.filter((node) =>
    node.requiredExercises.every((req) =>
      isExerciseCleared(req, collectBpms(req, progress)),
    ),
  ).length;

  return {
    done,
    total: scaleNodes.length,
    isComplete: scaleNodes.length > 0 && done === scaleNodes.length,
  };
};

/** How much of one box is finished. */
export const getBoxCompletion = (
  scaleType: string,
  position: number,
  progress: BpmProgressMap,
  nodes: readonly ScaleTreeNodeDef[] = SCALE_TREE_NODES,
): ScaleCompletion =>
  countCleared(getBoxNodes(scaleType, position, nodes), progress);
