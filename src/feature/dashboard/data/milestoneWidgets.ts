import type { LevelDef } from "feature/aiSummary/utils/milestoneLogic";
import { LEVELS } from "feature/aiSummary/utils/milestoneLogic";
import type { MilestoneWidgetId } from "feature/dashboard/types/dashboard.types";

const PREFIX = "milestone-";

export const milestoneWidgetId = (tierId: number): MilestoneWidgetId =>
  `${PREFIX}${tierId}`;

const TIER_BY_ID: ReadonlyMap<number, LevelDef> = new Map(
  LEVELS.map((tier) => [tier.id, tier]),
);

/**
 * The tier a milestone widget id stands for, or null when the id is not a
 * milestone at all or names a tier that no longer exists. Callers use the null
 * to drop the card rather than render a nameless one.
 */
export const milestoneWidgetTier = (id: string): LevelDef | null => {
  if (!id.startsWith(PREFIX)) return null;
  const raw = id.slice(PREFIX.length);
  // Rejects "", "1.5", "01", " 1" and anything else that is not the exact
  // decimal spelling of a tier number, so one tier cannot have two ids.
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  return TIER_BY_ID.get(Number(raw)) ?? null;
};

export const isMilestoneWidgetId = (id: string): id is MilestoneWidgetId =>
  milestoneWidgetTier(id) !== null;

/** Every tier, in ladder order, as an addable card. */
export const MILESTONE_WIDGET_IDS: MilestoneWidgetId[] = LEVELS.map((tier) =>
  milestoneWidgetId(tier.id),
);

/**
 * What one tier's card promises: the goal in the player's words and what it
 * pays every week it is met. The price is deliberately left out — the card
 * shows it only while the tier is still unbought, where it means something.
 */
export const milestoneWidgetDescription = (tier: LevelDef): string =>
  `${tier.req}. Pays ${tier.reward} Fame a week.`;
