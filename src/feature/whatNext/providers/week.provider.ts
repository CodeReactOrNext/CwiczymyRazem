import { DEFAULT_SLOT_MINUTES } from "feature/whatNext/providers/today.provider";
import type {
  NextAction,
  PracticeCategory,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";

const BALANCE_CATEGORIES: PracticeCategory[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];

/** Season places that pay Fame at the end of the month. */
const SEASON_PAID_PLACES = 10;

/**
 * The weekly goal the player is closest to finishing — one line, not one per
 * tier. Met tiers are claims; unowned tiers are the Milestones page's business.
 */
export const milestoneActions = (s: WhatNextSnapshot): NextAction[] => {
  const open = (s.milestones?.statuses ?? []).filter(
    (status) => status.owned && !status.met && status.progress.max > 0,
  );
  if (open.length === 0) return [];
  const closest = [...open].sort(
    (a, b) =>
      b.progress.value / b.progress.max - a.progress.value / a.progress.max,
  )[0];

  return [
    {
      id: `milestone:${closest.id}:${s.milestones!.weekKey}`,
      source: "milestones",
      kind: "week",
      isPractice: true,
      title: { key: "milestones.title", params: { name: closest.name } },
      reason: {
        key: "milestones.reason",
        params: {
          req: closest.req,
          value: closest.progress.value,
          max: closest.progress.max,
        },
      },
      href: "/summary",
      progress: { value: closest.progress.value, max: closest.progress.max },
      reward: { fame: closest.reward },
    },
  ];
};

export const challengeActions = (s: WhatNextSnapshot): NextAction[] => {
  const challenge = s.challenge;
  if (
    !challenge ||
    challenge.total === 0 ||
    challenge.cleared >= challenge.total
  )
    return [];
  return [
    {
      id: `challenge:${challenge.id}`,
      source: "challenge",
      // The last few days of the month turn it into a deadline.
      kind: challenge.daysLeft <= 3 ? "expiring" : "week",
      isPractice: true,
      title: {
        key: "challenge.title",
        params: { cleared: challenge.cleared, total: challenge.total },
      },
      reason: {
        key: "challenge.reason",
        params: { count: challenge.daysLeft },
      },
      href: "/challenges",
      deadlineAt: challenge.endsAt,
      progress: { value: challenge.cleared, max: challenge.total },
    },
  ];
};

export const seasonActions = (s: WhatNextSnapshot): NextAction[] => {
  const season = s.season;
  if (!season || season.gap <= 0) return [];
  return [
    {
      id: `season:${season.place}`,
      source: "season",
      kind: "week",
      isPractice: true,
      title: {
        key: "season.title",
        params: { gap: season.gap, name: season.rivalName },
      },
      reason:
        season.place <= SEASON_PAID_PLACES + 5
          ? { key: "season.reason_paid", params: { place: season.place } }
          : { key: "season.reason", params: { place: season.place } },
      href: "/seasons",
      deadlineAt: season.endsAt,
    },
  ];
};

/**
 * A part of practice that got no time at all in the last seven days, with an
 * exercise to fix it. Only once the player practises enough for a week to say
 * anything — someone who played twice has not neglected anything yet.
 */
export const balanceActions = (s: WhatNextSnapshot): NextAction[] => {
  const minutes = s.weekMinutes;
  if (!minutes) return [];
  const total = BALANCE_CATEGORIES.reduce(
    (sum, category) => sum + minutes[category],
    0,
  );
  if (total < 60) return [];

  const missing = BALANCE_CATEGORIES.find(
    (category) => minutes[category] === 0 && s.categoryPicks?.[category],
  );
  if (!missing) return [];
  const pick = s.categoryPicks![missing]!;

  return [
    {
      id: `balance:${missing}`,
      source: "balance",
      kind: "balance",
      isPractice: true,
      title: { key: `balance.${missing}` },
      reason: { key: "balance.reason", params: { title: pick.title } },
      href: `/practice/exercise/${pick.exerciseId}`,
      estMinutes: DEFAULT_SLOT_MINUTES,
      sessionItem: {
        kind: "exercise",
        exerciseId: pick.exerciseId,
        minutes: DEFAULT_SLOT_MINUTES,
      },
    },
  ];
};

/** The player's share of the guild's open quests, and applications for a founder. */
export const guildActions = (s: WhatNextSnapshot): NextAction[] => {
  const guild = s.guild;
  if (!guild?.isMember) return [];
  const actions: NextAction[] = guild.openShares.slice(0, 1).map((share) => ({
    id: `guild-quest:${share.id}`,
    source: "guilds" as const,
    kind: "week" as const,
    isPractice: true,
    title: { key: "guilds.title", params: { name: share.name } },
    reason: {
      key: "guilds.reason",
      params: { mine: share.mine, target: share.target },
    },
    href: "/guilds?tab=quests",
    progress: { value: share.mine, max: share.target },
  }));

  if (guild.applications > 0) {
    actions.push({
      id: "guild:applications",
      source: "guilds",
      kind: "continue",
      isPractice: false,
      title: {
        key: "guilds.applications",
        params: { count: guild.applications },
      },
      href: "/guilds?tab=members",
    });
  }
  return actions;
};
