import type {
  DailyQuestTaskType,
  FeatureUseMap,
  QuestFeature,
} from "types/api.types";

export interface QuestTemplate {
  type: DailyQuestTaskType;
  title: string;
  target: number;
}

/**
 * Plain practice. One of these is in every set: it can be done from anywhere
 * in the app, so a set never hinges on a tool the player does not open today.
 */
export const CORE_QUEST_TEMPLATES: QuestTemplate[] = [
  { type: "practice_total_time", title: "Practice for 15 minutes", target: 15 },
  { type: "long_session", title: "Practice for 30 minutes total", target: 30 },
  {
    type: "two_categories_min",
    title: "Practice 2 categories for 5 min each",
    target: 2,
  },
  { type: "well_rounded", title: "Practice 3 different categories", target: 3 },
  {
    type: "practice_three_exercises",
    title: "Practice 3 different exercises",
    target: 3,
  },
  {
    type: "practice_technique_time",
    title: "Practice Technique for 10 minutes",
    target: 10,
  },
  {
    type: "practice_specific_exercise",
    title: "Practice specific exercise",
    target: 1,
  },
  { type: "improve_skill", title: "Earn points in any Skill", target: 1 },
];

/**
 * Quests about one tool each. A feature's quests are only drawn for a player
 * who uses that feature (or, as onboarding, for a new one), which is what keeps
 * "Rate 3 Songs" away from someone who never opens Songs.
 */
export const FEATURE_QUEST_TEMPLATES: Record<QuestFeature, QuestTemplate[]> = {
  goals: [
    { type: "goal_run", title: "Do a run on one of your Goals", target: 1 },
    { type: "goal_run", title: "Do 3 runs on your Goals", target: 3 },
  ],
  calendar: [
    {
      type: "calendar_tick",
      title: "Tick off a Calendar item or plan one",
      target: 1,
    },
  ],
  rotation: [
    {
      type: "rotation_item",
      title: "Play an item from your Rotation",
      target: 1,
    },
    {
      type: "rotation_item",
      title: "Play 2 items from your Rotation",
      target: 2,
    },
  ],
  plans: [
    { type: "practice_plan", title: "Complete a Practice Plan", target: 1 },
    {
      type: "complete_two_plans",
      title: "Complete 2 Practice Plans",
      target: 2,
    },
    { type: "auto_plan", title: "Generate & Practice Auto Plan", target: 1 },
  ],
  songs: [
    { type: "practice_any_song", title: "Practice any Song", target: 1 },
    { type: "rate_multiple_songs", title: "Rate 3 Songs", target: 3 },
    {
      type: "add_want_to_learn",
      title: 'Add song to "Want to Learn"',
      target: 1,
    },
  ],
  journey: [
    { type: "journey_step", title: "Finish a Journey step", target: 1 },
  ],
  roadmap: [
    {
      type: "roadmap_step",
      title: "Practice a step from your Roadmap",
      target: 1,
    },
  ],
  trees: [
    { type: "tempo_cleared", title: "Clear a tempo on a Tree", target: 1 },
  ],
  daily: [
    { type: "daily_exercise", title: "Play today's Daily Exercise", target: 1 },
  ],
  duels: [{ type: "duel_run", title: "Play a Duel run", target: 1 }],
  bosses: [{ type: "boss_attempt", title: "Take on a Boss", target: 1 }],
  challenge: [
    {
      type: "challenge_play",
      title: "Practice this month's Challenge song",
      target: 1,
    },
  ],
  guild: [
    {
      type: "guild_contribution",
      title: "Contribute to your Guild",
      target: 1,
    },
  ],
  ear: [
    { type: "ear_round", title: "Play a Play by Ear round", target: 1 },
    {
      type: "practice_hearing_time",
      title: "Train your Ear for 10 minutes",
      target: 10,
    },
  ],
  habits: [
    { type: "healthy_habits", title: "Use 2 Healthy Habits", target: 2 },
  ],
};

export const QUEST_FEATURES = Object.keys(
  FEATURE_QUEST_TEMPLATES,
) as QuestFeature[];

/** The feature a quest type is about, if any — progress on it counts as using it. */
export const QUEST_TYPE_FEATURE: Partial<
  Record<DailyQuestTaskType, QuestFeature>
> = Object.fromEntries(
  QUEST_FEATURES.flatMap((feature) =>
    FEATURE_QUEST_TEMPLATES[feature].map((template) => [
      template.type,
      feature,
    ]),
  ),
);

/**
 * Features a new player is introduced to, in the order What Next's "use it
 * once" goals walk through them (FEATURE_GOAL_IDS). Guilds are level-locked
 * and the rest need something to exist first, so they are never discovered —
 * only drawn once the player uses them.
 */
export const DISCOVERY_ORDER: QuestFeature[] = [
  "songs",
  "goals",
  "plans",
  "journey",
  "daily",
  "trees",
  "calendar",
  "rotation",
  "bosses",
  "ear",
  "duels",
  "challenge",
];

/** A feature counts as "in use" when touched within this many active days. */
export const FEATURE_USE_WINDOW = 30;
/** Older than the window but younger than this: a "come back to" candidate. */
export const FEATURE_COMEBACK_WINDOW = 90;
/** Players below this many active days get the onboarding draw. */
export const NEW_PLAYER_ACTIVE_DAYS = 7;
/** Every Nth active day the third slot becomes a "come back to" quest. */
export const COMEBACK_EVERY = 4;

/**
 * What Next's "use it once" goals that stand for each feature. Used once, to
 * seed `featureUse` for accounts that predate it (see seedFeatureUse).
 */
export const FEATURE_GOAL_FEATURES: Record<string, QuestFeature> = {
  first_song: "songs",
  play_song: "songs",
  tempo_goal: "goals",
  practice_plan: "plans",
  auto_plan: "plans",
  own_plan: "plans",
  journey_step: "journey",
  daily_exercise: "daily",
  skill_tree: "trees",
  scale_tree: "trees",
  calendar: "calendar",
  rotation: "rotation",
  boss: "bosses",
  duel: "duels",
  challenge: "challenge",
  guild: "guild",
};

/** How long ago a seeded feature counts as used: inside the window, fading out. */
export const SEEDED_FEATURE_AGE = 20;

/**
 * A starting profile for an account that has none, from the What Next goals
 * it has completed. Every one is stamped as used `SEEDED_FEATURE_AGE` active
 * days ago — inside the window, so the very next draw is about tools the player
 * has touched, and dropping out of it on its own if they no longer use them.
 */
export const seedFeatureUse = (
  doneGoals: readonly string[],
  sessionCount: number,
): FeatureUseMap => {
  const seeded: FeatureUseMap = {};
  const at = Math.max(0, sessionCount - SEEDED_FEATURE_AGE);
  for (const goal of doneGoals) {
    const feature = FEATURE_GOAL_FEATURES[goal];
    if (feature) seeded[feature] = at;
  }
  return seeded;
};

/** Merges two copies of the profile — the later stamp per feature wins. */
export const mergeFeatureUse = (
  a: FeatureUseMap | undefined,
  b: FeatureUseMap | undefined,
): FeatureUseMap | undefined => {
  if (!a) return b;
  if (!b) return a;
  const merged: FeatureUseMap = { ...a };
  for (const feature of Object.keys(b) as QuestFeature[]) {
    merged[feature] = Math.max(merged[feature] ?? 0, b[feature] ?? 0);
  }
  return merged;
};
