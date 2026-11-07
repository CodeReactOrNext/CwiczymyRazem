import { snapshot } from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import { getClaims } from "./claims.provider";

const doneQuest = {
  date: "2026-11-07",
  isRewardClaimed: false,
  tasks: [
    {
      id: "t1",
      type: "auto_plan" as const,
      title: "",
      isCompleted: true,
      progress: 1,
      target: 1,
    },
  ],
};

describe("getClaims", () => {
  it("is empty when nothing is waiting", () => {
    expect(getClaims(snapshot())).toEqual([]);
  });

  it("claims a finished daily quest in place", () => {
    const [claim] = getClaims(
      snapshot({
        dailyQuest: doneQuest,
        dailyQuestReward: { fame: 40, points: 10 },
      }),
    );
    expect(claim).toMatchObject({
      claim: "dailyQuest",
      reward: { fame: 40, points: 10 },
    });
  });

  it("skips a quest with tasks left or already claimed", () => {
    expect(
      getClaims(
        snapshot({ dailyQuest: { ...doneQuest, isRewardClaimed: true } }),
      ),
    ).toEqual([]);
    expect(
      getClaims(
        snapshot({
          dailyQuest: {
            ...doneQuest,
            tasks: [{ ...doneQuest.tasks[0], isCompleted: false }],
          },
        }),
      ),
    ).toEqual([]);
  });

  it("collects badge rewards in place and sends free cases to the shelf, last", () => {
    const claims = getClaims(
      snapshot({
        rewards: {
          caseTokens: 2,
          achievementsClaimable: 3,
          achievementsPending: { fame: 145, caseTokens: 0, parts: [] },
        },
        availableSkillPoints: 4,
      }),
    );
    expect(claims.map((c) => c.id)).toEqual([
      "claim:achievements",
      "claim:skill-points",
      "claim:free-cases",
    ]);
    expect(claims[0]).toMatchObject({
      claim: "achievements",
      reward: { fame: 145 },
    });
    expect(claims[2].href).toBe("/arsenal?tab=cases");
  });

  it("links guild quest rewards only for a member", () => {
    const guild = {
      isMember: true,
      claimableFame: 80,
      claimableQuests: 2,
      openShares: [],
      applications: 0,
    };
    expect(getClaims(snapshot({ guild }))[0].href).toBe("/guilds?tab=quests");
    expect(
      getClaims(snapshot({ guild: { ...guild, isMember: false } })),
    ).toEqual([]);
  });
});
