import staticRoadmaps from "data/roadmaps";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type { GuitarDefinition } from "feature/arsenal/types/arsenal.types";
import type { PartSlot, RewardPayout } from "lib/rewards/rewardPayout";
import { rollRewardParts } from "lib/rewards/rewardPayout";

import type { StaticRoadmap } from "../types/roadmap.types";

/**
 * The guitar waiting at the end of each curated roadmap.
 *
 * Hand-picked to suit the roadmap and pinned by id, so the model printed on the
 * card from a player's first visit can never move under them.
 *
 * The five artist roadmaps end in a Mythic built for the job. The same models
 * also drop from the cases, so this is a guaranteed one rather than an
 * otherwise-unobtainable one — a case pays that rarity about once in two
 * hundred pulls, and never the model you were hoping for. The two skill
 * roadmaps end in a Legendary: they are shorter, and they teach a craft rather
 * than a player, so their trophy is a great guitar rather than *that* guitar.
 */
const TROPHY_GUITAR_IDS: Record<string, number | string> = {
  // John Mayer — the tungsten Strat.
  "58c48c07-c673-42fe-ba6b-493a9fb27274": 68, // Fairmont Stratocaster Tungsten
  // Adam Jones — the silverburst single-cut he is never seen without.
  "f078b316-705e-416d-b831-a842fdff7a24": 69, // Louis Carver Eclipse Silverburst
  // Hendrix — the white Strat.
  "0cbc5208-e56a-428f-8465-a0510e7b1f88": 67, // Fairmont Stratocaster Olympic White
  // Petrucci — the graphic superstrat.
  "2a4fbdde-83a5-4588-8bc1-6c79c626ac73": 71, // Izanor JTY Kaleido
  // Marty Friedman — the pointy one.
  "46f35fb5-be6a-494e-970c-78227135660d": 70, // Grayson Warhead Crimson
  // Improvisation — an all-rounder.
  "5431b95a-0733-4595-ae38-d600b132cbbe": 19, // Grayson Lewis Palmer Custom Shop
  // Rhythm — a workhorse.
  "d44c57a7-c2e4-4115-9abb-dde4d318e5f7": 50, // Fairmont Stratocaster Heavy Relic
};

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
  getCuratedRoadmap(roadmapId) !== null && roadmapId in TROPHY_GUITAR_IDS;

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
  const guitarId = TROPHY_GUITAR_IDS[roadmapId];
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
): RoadmapCompletion => {
  const steps = getRoadmapSteps(roadmapId);
  const progress = stepProgress ?? {};

  const done = steps.filter(
    (step) => (progress[step.id] ?? 0) >= (step.sessionsRequired || 0),
  ).length;

  return {
    done,
    total: steps.length,
    isComplete: steps.length > 0 && done === steps.length,
  };
};
