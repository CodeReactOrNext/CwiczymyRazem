import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type { GuitarDefinition } from "feature/arsenal/types/arsenal.types";
import type { PartSlot, RewardPayout } from "lib/rewards/rewardPayout";
import { rollRewardParts } from "lib/rewards/rewardPayout";

import type { JourneyProgressDocument } from "../types/journey.types";
import { journeyModules } from "./journeyModules";

interface JourneySpec {
  fame: number;
  caseTokens: number;
  parts: PartSlot[];
}

/**
 * What finishing a roadmap pays.
 *
 * A module is a course rather than a grind — thirteen steps for the
 * fundamentals, twenty-three for the fretboard — so it is priced under a whole
 * scale tree on Fame, and the longer module pays more than the shorter one.
 *
 * The Fame is not really the reward, though. The trophy guitar is, and it is
 * worth more than everything else here put together: see `getTrophyGuitar`.
 */
const JOURNEY_REWARDS: Record<string, JourneySpec> = {
  fundamentals: {
    fame: 200,
    caseTokens: 1,
    parts: [{ tier: "Epic", qty: 2 }],
  },
  fretboard: {
    fame: 300,
    caseTokens: 1,
    parts: [
      { tier: "Epic", qty: 3 },
      { tier: "Legendary", qty: 1 },
    ],
  },
};

/** What a module with no entry of its own is worth — the shorter course's rate. */
const DEFAULT_JOURNEY_REWARD: JourneySpec = JOURNEY_REWARDS.fundamentals;

/** The ledger id a finished roadmap is recorded under. One per module, forever. */
export const journeyRewardId = (moduleId: string): string =>
  `journey_complete_${moduleId}`;

/**
 * The guitar waiting at the end of each roadmap, named outright.
 *
 * Hand-picked rather than drawn. A trophy is the one reward worth choosing on
 * purpose, and the model is printed on the card from a player's first visit —
 * so it must not be able to move under them because the module list was
 * reordered or the guitar catalogue grew, which is exactly what the seeded
 * draw this replaces could do.
 *
 * Both are Legendary, the rarity a case pays about once in two hundred pulls.
 * Add a line for every new roadmap; a module with no line here simply shows no
 * trophy rather than inventing a guitar.
 */
const TROPHY_GUITAR_IDS: Record<string, number | string> = {
  fundamentals: 62, // RPS Osprey Custom
  fretboard: 49, // Fairmont Stratocaster Heavy Relic
};

/**
 * The guitar at the end of a roadmap.
 *
 * The model is fixed; the copy is not. Year, condition, features and traits are
 * still rolled per player when the trophy is granted, so no two are identical
 * and the serial is genuinely earned.
 */
export const getTrophyGuitar = (moduleId: string): GuitarDefinition | null => {
  const guitarId = TROPHY_GUITAR_IDS[moduleId];
  return guitarId == null ? null : (GUITARS_BY_ID.get(guitarId) ?? null);
};

export interface JourneyReward {
  payout: RewardPayout;
  /** The instrument. Null only if the Legendary pool is ever emptied. */
  guitar: GuitarDefinition | null;
}

/** Everything a finished module hands over. Null for a module that does not exist. */
export const getJourneyReward = (moduleId: string): JourneyReward | null => {
  if (!journeyModules.some((module) => module.id === moduleId)) return null;

  const spec = JOURNEY_REWARDS[moduleId] ?? DEFAULT_JOURNEY_REWARD;

  return {
    payout: {
      fame: spec.fame,
      caseTokens: spec.caseTokens,
      parts: rollRewardParts(journeyRewardId(moduleId), spec.parts),
    },
    guitar: getTrophyGuitar(moduleId),
  };
};

/** Every step id in a module, in path order. */
export const getModuleStepIds = (moduleId: string): string[] => {
  const journeyModule = journeyModules.find((entry) => entry.id === moduleId);
  if (!journeyModule) return [];
  return journeyModule.stages.flatMap((stage) =>
    stage.steps.map((step) => step.id),
  );
};

export interface JourneyCompletion {
  done: number;
  total: number;
  isComplete: boolean;
}

/**
 * How much of a module is finished, read off the stored progress document.
 *
 * Counted against the module definition rather than against the keys in the
 * document: a step that has since been added to the roadmap has to re-open a
 * module somebody had already finished, and counting the document's own keys
 * would have quietly called it done.
 */
export const getJourneyCompletion = (
  moduleId: string,
  progress: JourneyProgressDocument | null | undefined,
): JourneyCompletion => {
  const stepIds = getModuleStepIds(moduleId);
  const steps = progress?.moduleProgress?.[moduleId]?.steps ?? {};

  const done = stepIds.filter((stepId) => steps[stepId]?.completed).length;

  return {
    done,
    total: stepIds.length,
    isComplete: stepIds.length > 0 && done === stepIds.length,
  };
};
