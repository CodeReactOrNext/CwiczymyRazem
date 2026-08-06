import {
  MONTHLY_RUNNING_COST,
  ROADMAP_TIERS,
  type RoadmapTier,
} from "../data/roadmap.data";

export interface FundingStatus {
  /** Money put toward this month's server cost, capped at the cost itself. */
  covered: number;
  /** This month's server cost is fully paid for. */
  isCovered: boolean;
  /** 0-100, this month's server cost. */
  costPct: number;
  /** First tier the lifetime total hasn't reached yet, if any is left. */
  nextTier: RoadmapTier | null;
  /** Dollars still missing for `nextTier`. */
  toGo: number;
  /**
   * 0-100 inside the current tier band (previous goal → next goal), not from
   * $0 — measured from zero the bar would barely move as the ladder climbs.
   */
  tierPct: number;
  /**
   * The bar tracks the next unlock instead of the server cost: once the cost
   * is paid a permanently full bar says nothing, so it moves on to the goal
   * that is actually still open.
   */
  showsTier: boolean;
}

const clampPct = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Funding numbers behind the support banners. `totalRaised` is the lifetime
 * total with `ROADMAP_RAISED_OFFSET` already subtracted (that's what drives
 * the tier ladder), `raisedThisMonth` is the raw month-to-date total.
 */
export const getFundingStatus = (
  totalRaised: number,
  raisedThisMonth: number,
): FundingStatus => {
  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;

  const nextTierIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);
  const nextTier = nextTierIndex === -1 ? null : ROADMAP_TIERS[nextTierIndex];

  const prevGoal =
    nextTierIndex > 0 ? ROADMAP_TIERS[nextTierIndex - 1].goal : 0;
  const tierSpan = nextTier ? nextTier.goal - prevGoal : 0;

  return {
    covered,
    isCovered,
    costPct: clampPct((covered / MONTHLY_RUNNING_COST) * 100),
    nextTier,
    toGo: nextTier ? Math.max(0, nextTier.goal - totalRaised) : 0,
    tierPct:
      tierSpan > 0 ? clampPct(((totalRaised - prevGoal) / tierSpan) * 100) : 0,
    showsTier: isCovered && nextTier !== null,
  };
};
