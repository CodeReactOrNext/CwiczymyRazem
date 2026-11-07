import type {
  ClaimItem,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";

/**
 * Every reward that can be taken right now. These never compete with playing:
 * they sit in one strip above the road, and the ones the app can pay in place
 * (`claim`) go out together on one button.
 */
export const getClaims = (s: WhatNextSnapshot): ClaimItem[] => {
  const claims: ClaimItem[] = [];

  const quest = s.dailyQuest;
  if (
    quest &&
    !quest.isRewardClaimed &&
    quest.tasks.length > 0 &&
    quest.tasks.every((t) => t.isCompleted)
  ) {
    claims.push({
      id: `claim:daily-quest:${quest.date}`,
      label: { key: "claims.daily_quest" },
      reward: s.dailyQuestReward,
      claim: "dailyQuest",
      href: "/dashboard",
    });
  }

  s.milestones?.statuses
    .filter((status) => status.met && status.owned && !status.claimed)
    .forEach((status) => {
      claims.push({
        id: `claim:milestone:${status.id}:${s.milestones!.weekKey}`,
        label: { key: "claims.milestone", params: { name: status.name } },
        reward: { fame: status.reward },
        claim: "milestones",
        milestone: {
          id: status.id,
          name: status.name,
          reward: status.reward,
          weekKey: s.milestones!.weekKey,
        },
        href: "/summary",
      });
    });

  if (s.rewards && s.rewards.achievementsClaimable > 0) {
    claims.push({
      id: "claim:achievements",
      label: {
        key: "claims.achievements",
        params: { count: s.rewards.achievementsClaimable },
      },
      reward: {
        fame: s.rewards.achievementsPending.fame,
        caseTokens: s.rewards.achievementsPending.caseTokens,
      },
      claim: "achievements",
      href: "/profile/achievements",
    });
  }

  if (s.scaleBoxes && s.scaleBoxes.length > 0) {
    claims.push({
      id: "claim:scale-boxes",
      label: {
        key: "claims.scale_boxes",
        params: { count: s.scaleBoxes.length },
      },
      reward: {
        fame: s.scaleBoxes.reduce((sum, box) => sum + box.reward.fame, 0),
        caseTokens: s.scaleBoxes.reduce(
          (sum, box) => sum + box.reward.caseTokens,
          0,
        ),
      },
      href: "/scale-tree",
    });
  }

  if (s.guild?.isMember && s.guild.claimableQuests > 0) {
    claims.push({
      id: "claim:guild-quests",
      label: {
        key: "claims.guild_quests",
        params: { count: s.guild.claimableQuests },
      },
      reward: { fame: s.guild.claimableFame },
      href: "/guilds?tab=quests",
    });
  }

  if (s.availableSkillPoints > 0) {
    claims.push({
      id: "claim:skill-points",
      label: {
        key: "claims.skill_points",
        params: { count: s.availableSkillPoints },
      },
      href: "/profile/skills",
    });
  }

  // Last: a free case is spent, not collected — it opens on the shelf.
  if (s.rewards && s.rewards.caseTokens > 0) {
    claims.push({
      id: "claim:free-cases",
      label: {
        key: "claims.free_cases",
        params: { count: s.rewards.caseTokens },
      },
      href: "/arsenal?tab=cases",
    });
  }

  return claims;
};
