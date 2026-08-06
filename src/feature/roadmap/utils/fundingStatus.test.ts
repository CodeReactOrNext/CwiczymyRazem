import { describe, expect, it } from "vitest";

import { MONTHLY_RUNNING_COST, ROADMAP_TIERS } from "../data/roadmap.data";
import { getFundingStatus } from "./fundingStatus";

const lastGoal = ROADMAP_TIERS[ROADMAP_TIERS.length - 1].goal;

describe("getFundingStatus", () => {
  it("tracks the server cost while it is unpaid", () => {
    const status = getFundingStatus(0, MONTHLY_RUNNING_COST / 2);

    expect(status.isCovered).toBe(false);
    expect(status.showsTier).toBe(false);
    expect(status.covered).toBe(MONTHLY_RUNNING_COST / 2);
    expect(status.costPct).toBe(50);
  });

  it("switches to the next unlock once the cost is covered", () => {
    const status = getFundingStatus(0, MONTHLY_RUNNING_COST);

    expect(status.isCovered).toBe(true);
    expect(status.showsTier).toBe(true);
    expect(status.costPct).toBe(100);
    expect(status.nextTier).toBe(ROADMAP_TIERS[0]);
  });

  it("measures tier progress inside the current band, not from zero", () => {
    const [first, second] = ROADMAP_TIERS;
    const halfway = first.goal + (second.goal - first.goal) / 2;

    const status = getFundingStatus(halfway, MONTHLY_RUNNING_COST);

    expect(status.nextTier).toBe(second);
    expect(status.tierPct).toBe(50);
    expect(status.toGo).toBe(second.goal - halfway);
  });

  it("caps the cost bar when support runs past the monthly cost", () => {
    const status = getFundingStatus(0, MONTHLY_RUNNING_COST * 3);

    expect(status.covered).toBe(MONTHLY_RUNNING_COST);
    expect(status.costPct).toBe(100);
  });

  it("has no tier left once every goal is funded", () => {
    const status = getFundingStatus(lastGoal, MONTHLY_RUNNING_COST);

    expect(status.nextTier).toBeNull();
    expect(status.showsTier).toBe(false);
    expect(status.tierPct).toBe(0);
    expect(status.toGo).toBe(0);
  });
});
