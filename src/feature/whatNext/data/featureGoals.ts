import type { LockedFeatureId } from "feature/levelGate/data/featureUnlocks";

/** Goals done for every free case the player collects. */
export const FEATURE_GOALS_PER_CASE = 5;

/** Goals on show at a time — the next three in line. */
export const VISIBLE_FEATURE_GOALS = 3;

/**
 * Every "use this at least once" goal, in the order they are offered: the first
 * day's basics, then the core of the app, then its depth, then the community.
 * A goal is done when the player's own data says so — nothing here is ticked
 * off by opening a page. Goals pay nothing on their own: every
 * {@link FEATURE_GOALS_PER_CASE} done since the account was first seen earn
 * one free case (see `utils/featureGoalCases`).
 *
 * Shared by the client (what to show) and `/api/feature-goals/*` (what to pay),
 * so it must stay free of any Firebase SDK.
 */
export const FEATURE_GOAL_IDS = [
  // The first day.
  "first_session",
  "first_song",
  "tempo_goal",
  "second_day",
  // The first week: the core of the app.
  "practice_plan",
  // Right after the fifth goal, which pays the case it is opened with.
  "first_guitar",
  "journey_step",
  "play_song",
  "daily_exercise",
  "auto_plan",
  "all_categories",
  "open_case",
  "weekly_goal",
  "favorite",
  "customize",
  "skill_tree",
  "scale_tree",
  // Depth.
  "calendar",
  "rotation",
  "own_plan",
  "own_exercise",
  "boss",
  "rig",
  "achievement",
  // Community.
  "duel",
  "challenge",
  "guild",
] as const;

export type FeatureGoalId = (typeof FEATURE_GOAL_IDS)[number];

export interface FeatureGoal {
  id: FeatureGoalId;
  /** Where the goal is done. `null` for one whose page depends on the day. */
  href: string | null;
  /** Kept off the list until the page it points at is open to the player. */
  unlock?: LockedFeatureId;
}

const HREFS: Record<FeatureGoalId, string | null> = {
  first_session: "/timer",
  first_guitar: "/arsenal",
  first_song: "/songs?view=explore",
  tempo_goal: "/goals",
  second_day: "/timer",
  practice_plan: "/timer/plans",
  journey_step: "/journey",
  play_song: "/songs?view=board",
  daily_exercise: null,
  auto_plan: "/timer/auto",
  all_categories: "/timer",
  open_case: "/arsenal",
  weekly_goal: "/summary",
  favorite: "/profile/skills?tab=browse",
  customize: "/dashboard",
  skill_tree: "/profile/skills",
  scale_tree: "/scale-tree",
  calendar: "/calendar",
  rotation: "/rotation",
  own_plan: "/timer/plans",
  own_exercise: "/tab-editor",
  boss: "/bosses",
  rig: "/tone-studio",
  achievement: "/profile/achievements",
  duel: "/duels",
  challenge: "/challenges",
  guild: "/guilds",
};

const UNLOCKS: Partial<Record<FeatureGoalId, LockedFeatureId>> = {
  weekly_goal: "summary",
  guild: "guilds",
};

export const FEATURE_GOALS: FeatureGoal[] = FEATURE_GOAL_IDS.map((id) => ({
  id,
  href: HREFS[id],
  ...(UNLOCKS[id] && { unlock: UNLOCKS[id] }),
}));

const KNOWN = new Set<string>(FEATURE_GOAL_IDS);

export const isFeatureGoalId = (value: unknown): value is FeatureGoalId =>
  typeof value === "string" && KNOWN.has(value);
