import staticRoadmaps from "data/roadmaps";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { ROADMAP_TROPHY_GUITARS } from "feature/arsenal/data/trophyGuitars";
import type { GuitarDefinition } from "feature/arsenal/types/arsenal.types";
import type { PartSlot, RewardPayout } from "lib/rewards/rewardPayout";
import { rollRewardParts } from "lib/rewards/rewardPayout";

import type { PhaseCheckResult } from "../types/phaseCheck.types";
import type { StaticRoadmap } from "../types/roadmap.types";
import { allCheckpointsPassed } from "../utils/phaseCheck";

/**
 * What the parts and the free cases are worth, before the Fame is sized.
 *
 * Two free cases rather than one. A curated roadmap is 31 to 52 steps and
 * upwards of two hundred practice sessions — several times a mastery journey,
 * and the longest single commitment the app asks for — so its finish pays more
 * than any other single reward in the game.
 */
const ROADMAP_PARTS: PartSlot[] = [
  { tier: "Epic", qty: 4 },
  { tier: "Legendary", qty: 2 },
];

const ROADMAP_CASE_TOKENS = 2;

/** Fame is `BASE + PER_STEP × steps`, so a longer roadmap pays more. */
const BASE_FAME = 500;
const FAME_PER_STEP = 6;

/** The ledger id a finished roadmap is recorded under. One per roadmap, forever. */
export const roadmapRewardId = (roadmapId: string): string =>
  `roadmap_complete_${roadmapId}`;

/**
 * The curated roadmap behind an id, or null.
 *
 * Only these pay out. A roadmap the player generated for themselves lives in a
 * document they can write, so its steps — and therefore how much work a reward
 * costs — would be theirs to set; the seven authored ones ship in the repo and
 * cannot be edited from a browser. See `/api/rewards/claim-roadmap`, which
 * re-derives every step from here rather than from the stored roadmap.
 */
export const getCuratedRoadmap = (roadmapId: string): StaticRoadmap | null =>
  (staticRoadmaps as StaticRoadmap[]).find((entry) => entry.id === roadmapId) ??
  null;

/** True for the roadmaps whose finish is worth something. */
export const isRewardableRoadmap = (roadmapId: string): boolean =>
  getCuratedRoadmap(roadmapId) !== null && roadmapId in ROADMAP_TROPHY_GUITARS;

/**
 * The guitar at the end of a roadmap.
 *
 * The model is fixed; the copy is not. Year, condition, features and traits are
 * still rolled per player when the trophy is granted, so no two are identical
 * and the serial is genuinely earned.
 */
export const getRoadmapTrophy = (
  roadmapId: string,
): GuitarDefinition | null => {
  const guitarId = ROADMAP_TROPHY_GUITARS[roadmapId];
  return guitarId == null ? null : (GUITARS_BY_ID.get(guitarId) ?? null);
};

/** Every step of a curated roadmap, in path order. */
export const getRoadmapSteps = (roadmapId: string) =>
  getCuratedRoadmap(roadmapId)?.phases.flatMap((phase) => phase.steps) ?? [];

export interface RoadmapReward {
  payout: RewardPayout;
  /** The instrument. Null for a roadmap with no trophy pinned. */
  guitar: GuitarDefinition | null;
}

/** Everything a finished roadmap hands over. Null for one that pays nothing. */
export const getRoadmapReward = (roadmapId: string): RoadmapReward | null => {
  if (!isRewardableRoadmap(roadmapId)) return null;

  const steps = getRoadmapSteps(roadmapId).length;

  return {
    payout: {
      fame: BASE_FAME + FAME_PER_STEP * steps,
      caseTokens: ROADMAP_CASE_TOKENS,
      parts: rollRewardParts(roadmapRewardId(roadmapId), ROADMAP_PARTS),
    },
    guitar: getRoadmapTrophy(roadmapId),
  };
};

export interface RoadmapCompletion {
  done: number;
  total: number;
  /** Phase checkpoints passed, out of the roadmap's phases. */
  checkpointsPassed: number;
  checkpointsTotal: number;
  isComplete: boolean;
}

/**
 * How much of a curated roadmap is finished.
 *
 * Counted against the authored steps rather than against the keys in the
 * progress document: a step whose id is not in the roadmap any more must not
 * count towards it, and a step missing from the document simply has no sessions
 * on it yet.
 */
export const getRoadmapCompletion = (
  roadmapId: string,
  /** `stepProgress` as stored: step id → sessions completed. */
  stepProgress: Record<string, number> | null | undefined,
  /** `phaseChecks` as stored: phase id → checkpoint result. */
  phaseChecks?: Record<string, PhaseCheckResult> | null,
): RoadmapCompletion => {
  const steps = getRoadmapSteps(roadmapId);
  const progress = stepProgress ?? {};
  const phaseIds = (getCuratedRoadmap(roadmapId)?.phases ?? []).map(
    (p) => p.id,
  );

  const done = steps.filter(
    (step) => (progress[step.id] ?? 0) >= (step.sessionsRequired || 0),
  ).length;
  const checkpointsPassed = phaseIds.filter(
    (phaseId) => !!phaseChecks?.[phaseId]?.passedAt,
  ).length;

  // The steps and every phase's checkpoint: a roadmap is finished when the
  // work is done AND the player has shown they understood it.
  return {
    done,
    total: steps.length,
    checkpointsPassed,
    checkpointsTotal: phaseIds.length,
    isComplete:
      steps.length > 0 &&
      done === steps.length &&
      allCheckpointsPassed(phaseIds, phaseChecks),
  };
};
