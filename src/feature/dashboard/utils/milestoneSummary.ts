import type { PracticeLevelsState } from "feature/aiSummary/services/practiceLevels.service";
import type {
  LevelDef,
  ProgressData,
} from "feature/aiSummary/utils/milestoneLogic";
import {
  LEVEL_COLORS,
  LEVELS,
  milestoneLockedAtLvl,
} from "feature/aiSummary/utils/milestoneLogic";
import type { LucideIcon } from "lucide-react";

export interface MilestoneStatus {
  id: number;
  name: string;
  /** The one-word label the node strip fits under a disc. */
  short: string;
  req: string;
  color: string;
  Icon: LucideIcon;
  /** Fame this tier pays each week its goal is met. */
  reward: number;
  /** One-off Fame price to own the tier; 0 for the free first rung. */
  cost: number;
  met: boolean;
  owned: boolean;
  /** Claimed in the week being summarised. */
  claimed: boolean;
  /** The account level still needed before this tier can be bought, or null. */
  lockedAtLvl: number | null;
  progress: { value: number; max: number };
}

interface SummarizeInput {
  progress: ProgressData;
  levels: PracticeLevelsState;
  weekKey: string;
  playerLvl: number;
  tiers?: LevelDef[];
}

/**
 * Where every weekly goal stands right now: met or not, owned or not, claimed
 * this week or still paying out, and how far into it the week has got.
 *
 * Built from the same tier table and the same lock rule as the Milestones page,
 * so a card on Home never offers a reward the page would refuse.
 */
export const milestoneStatuses = ({
  progress,
  levels,
  weekKey,
  playerLvl,
  tiers = LEVELS,
}: SummarizeInput): MilestoneStatus[] => {
  const owned = new Set(levels.ownedLevelIds);

  return tiers.map((tier) => {
    const isOwned = owned.has(tier.id);
    return {
      id: tier.id,
      name: tier.name,
      short: tier.short ?? tier.name.split(" ")[0],
      req: tier.req,
      color: LEVEL_COLORS[tier.id - 1] ?? LEVEL_COLORS[0],
      Icon: tier.Icon,
      reward: tier.reward,
      cost: tier.cost,
      met: tier.isMet(progress),
      owned: isOwned,
      claimed: levels.claims[tier.id]?.weekKey === weekKey,
      lockedAtLvl: milestoneLockedAtLvl(tier, playerLvl, isOwned),
      progress: tier.getProgress(progress),
    };
  });
};
