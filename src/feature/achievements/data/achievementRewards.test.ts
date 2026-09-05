import { PART_TIERS, PARTS_BY_ID } from "feature/arsenal/data/partDefinitions";
import { describe, expect, it } from "vitest";

import type { AchievementList } from "../types";
import {
  ACHIEVEMENT_REWARDS,
  getAchievementReward,
  getClaimableAchievements,
  previewClaim,
  resolveAchievementReward,
  sumAchievementRewards,
} from "./achievementRewards";
import { achievementsData } from "./achievementsData";

const tierRank = (tier: string) => PART_TIERS.indexOf(tier as never);

describe("getAchievementReward", () => {
  it("pays the same thing every time it is asked", () => {
    const first = getAchievementReward("time_1", "common");
    const second = getAchievementReward("time_1", "common");
    expect(second).toEqual(first);
  });

  it("gives different badges different parts", () => {
    const ids = achievementsData.map((data) =>
      getAchievementReward(data.id, data.rarity),
    );
    const drawn = new Set(ids.map((reward) => reward.parts[0].partId));
    expect(drawn.size).toBeGreaterThan(1);
  });

  it("never hands out a part above the grade it can reach", () => {
    for (const data of achievementsData) {
      for (const part of getAchievementReward(data.id, data.rarity).parts) {
        const def = PARTS_BY_ID.get(part.partId);
        expect(def, `${part.partId} is not a real part`).toBeDefined();
        expect(tierRank(def!.maxTier)).toBeGreaterThanOrEqual(
          tierRank(part.tier),
        );
      }
    }
  });

  it("pays a free case only at epic", () => {
    for (const rarity of ["common", "rare", "veryRare"] as const) {
      expect(ACHIEVEMENT_REWARDS[rarity].caseTokens).toBe(0);
    }
    expect(ACHIEVEMENT_REWARDS.epic.caseTokens).toBe(1);
  });

  it("is worth more the rarer the badge", () => {
    const fame = (["common", "rare", "veryRare", "epic"] as const).map(
      (rarity) => ACHIEVEMENT_REWARDS[rarity].fame,
    );
    expect(fame).toEqual([...fame].sort((a, b) => a - b));
  });
});

describe("resolveAchievementReward", () => {
  it("prices every badge in the registry", () => {
    for (const data of achievementsData) {
      expect(resolveAchievementReward(data.id)).not.toBeNull();
    }
  });

  it("refuses to price a badge that is not in the registry", () => {
    expect(
      resolveAchievementReward("retired_badge" as AchievementList),
    ).toBeNull();
  });
});

describe("sumAchievementRewards", () => {
  it("stacks parts of the same kind and grade into one row", () => {
    const total = sumAchievementRewards([
      {
        fame: 10,
        caseTokens: 0,
        parts: [{ partId: "pot", tier: "Epic", qty: 2 }],
      },
      {
        fame: 5,
        caseTokens: 1,
        parts: [{ partId: "pot", tier: "Epic", qty: 3 }],
      },
    ]);

    expect(total.fame).toBe(15);
    expect(total.caseTokens).toBe(1);
    expect(total.parts).toEqual([{ partId: "pot", tier: "Epic", qty: 5 }]);
  });

  it("keeps the same part apart when the grades differ", () => {
    const total = sumAchievementRewards([
      {
        fame: 0,
        caseTokens: 0,
        parts: [{ partId: "pot", tier: "Epic", qty: 1 }],
      },
      {
        fame: 0,
        caseTokens: 0,
        parts: [{ partId: "pot", tier: "Standard", qty: 1 }],
      },
    ]);

    expect(total.parts).toHaveLength(2);
  });

  it("adds up to nothing when there is nothing to add", () => {
    expect(sumAchievementRewards([])).toEqual({
      fame: 0,
      caseTokens: 0,
      parts: [],
    });
  });
});

describe("getClaimableAchievements", () => {
  it("keeps the badges that have been earned and not yet collected", () => {
    expect(getClaimableAchievements(["time_1", "time_2"], ["time_1"])).toEqual([
      "time_2",
    ]);
  });

  it("drops a badge no definition prices", () => {
    expect(
      getClaimableAchievements(["time_1", "gone" as AchievementList], []),
    ).toEqual(["time_1"]);
  });

  it("pays a duplicated badge once", () => {
    expect(getClaimableAchievements(["time_1", "time_1"], [])).toEqual([
      "time_1",
    ]);
  });
});

describe("previewClaim", () => {
  it("is worth the sum of its badges", () => {
    const both = previewClaim(["time_1", "time_2"]);
    const apart = sumAchievementRewards([
      resolveAchievementReward("time_1")!,
      resolveAchievementReward("time_2")!,
    ]);
    expect(both).toEqual(apart);
  });

  it("ignores a badge it cannot price", () => {
    expect(previewClaim(["gone" as AchievementList])).toEqual({
      fame: 0,
      caseTokens: 0,
      parts: [],
    });
  });
});
