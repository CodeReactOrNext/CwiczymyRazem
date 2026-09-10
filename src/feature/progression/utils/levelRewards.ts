import { getModPool, MOD_ROLL_BONUS } from "feature/arsenal/data/workshop";
import type {
  ScrapPart,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";
import { seededPick } from "feature/arsenal/utils/seededRandom";
import { rewardRandom, rollRewardParts } from "lib/rewards/rewardPayout";

import type { LevelMilestone } from "../data/levelMilestones";
import { levelRewardId } from "../data/levelMilestones";

/** A mod a level pays, before the stash gives it an id. */
export interface RolledMod {
  featureId: string;
  kind: WorkshopKind;
  label: string;
  points: number;
}

export interface LevelReward {
  lvl: number;
  rewardId: string;
  caseTokens: number;
  parts: ScrapPart[];
  mods: RolledMod[];
}

/** Even split between the two pools, exactly as the trader's daily mod draws. */
const MOD_GUITAR_CHANCE = 0.5;

/**
 * The mods a level pays.
 *
 * Seeded off the level alone, so every account is promised the same mod at the
 * same rung — which is what lets the ladder print it in advance, and what stops
 * the screen and the claim route from disagreeing about what was owed. The
 * points roll is the counter's, not the bench's: `MOD_ROLL_BONUS` is the edge
 * you get for building one yourself, and a reward is not built.
 */
export const rollLevelMods = (lvl: number, count: number): RolledMod[] => {
  const mods: RolledMod[] = [];

  for (let i = 0; i < count; i++) {
    const random = rewardRandom(`${levelRewardId(lvl)}:mod:${i}`);
    const kind: WorkshopKind =
      random() < MOD_GUITAR_CHANCE ? "guitar" : "effect";
    const def = seededPick(getModPool(kind), random);
    if (!def) continue;

    const max = Math.max(def.min, def.max - MOD_ROLL_BONUS);
    mods.push({
      featureId: def.id,
      kind,
      label: def.label,
      points: def.min + Math.floor(random() * (max - def.min + 1)),
    });
  }

  return mods;
};

/**
 * Everything a rung pays, resolved.
 *
 * A pure function of the level, so the ladder, the level-up card and the claim
 * route all derive the same reward rather than passing one around — the client
 * never tells the server what it is owed.
 */
export const rollLevelReward = (
  milestone: LevelMilestone,
): LevelReward | null => {
  if (!milestone.payout) return null;

  const rewardId = levelRewardId(milestone.lvl);
  return {
    lvl: milestone.lvl,
    rewardId,
    caseTokens: milestone.payout.caseTokens,
    parts: rollRewardParts(rewardId, milestone.payout.parts),
    mods: rollLevelMods(milestone.lvl, milestone.payout.mods),
  };
};
