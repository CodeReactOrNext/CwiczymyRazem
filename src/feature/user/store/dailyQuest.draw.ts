import type {
  DailyQuestSlot,
  DailyQuestTask,
  FeatureUseMap,
  QuestFeature,
} from "types/api.types";

import {
  COMEBACK_EVERY,
  CORE_QUEST_TEMPLATES,
  DISCOVERY_ORDER,
  FEATURE_COMEBACK_WINDOW,
  FEATURE_QUEST_TEMPLATES,
  FEATURE_USE_WINDOW,
  NEW_PLAYER_ACTIVE_DAYS,
  QUEST_FEATURES,
  type QuestTemplate,
} from "./dailyQuest.features";

/**
 * - `onboarding` — a new player: practice plus two tools from across the app.
 * - `regular` — practice plus two tools the player uses; every few days the
 *   third becomes a tool they dropped.
 * - `thin` — only one tool in use: one quest from it, one to widen out.
 * - `empty` — a profile with nothing in the window.
 * - `legacy` — an account with no profile yet (before its seed): any tools.
 */
export type DailyQuestDrawMode =
  | "onboarding"
  | "regular"
  | "thin"
  | "empty"
  | "legacy";

export interface DrawnQuestTask {
  template: QuestTemplate;
  slot?: DailyQuestSlot;
  feature?: QuestFeature;
}

export interface DailyQuestDraw {
  mode: DailyQuestDrawMode;
  tasks: DrawnQuestTask[];
  /** Features the tool quests came from. */
  features: QuestFeature[];
}

export interface DrawInput {
  /** Active days so far — see `FeatureUseMap`. */
  sessionCount: number;
  featureUse?: FeatureUseMap;
  /** Features yesterday's set was drawn from; skipped when there is enough else. */
  previousFeatures?: QuestFeature[];
  random?: () => number;
}

type Random = () => number;

const pick = <T>(items: readonly T[], random: Random): T =>
  items[Math.floor(random() * items.length) % items.length];

const weightedPick = <T>(
  items: readonly T[],
  weight: (item: T) => number,
  random: Random,
): T => {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
};

/** How many active days ago a feature was last used, or null if never. */
export const featureAge = (
  featureUse: FeatureUseMap | undefined,
  feature: QuestFeature,
  sessionCount: number,
): number | null => {
  const stamp = featureUse?.[feature];
  if (typeof stamp !== "number" || !Number.isFinite(stamp)) return null;
  return Math.max(0, sessionCount - stamp);
};

export const featuresInUse = (
  featureUse: FeatureUseMap | undefined,
  sessionCount: number,
) =>
  QUEST_FEATURES.filter((feature) => {
    const age = featureAge(featureUse, feature, sessionCount);
    return age !== null && age < FEATURE_USE_WINDOW;
  });

const droppedFeatures = (
  featureUse: FeatureUseMap | undefined,
  sessionCount: number,
) =>
  QUEST_FEATURES.filter((feature) => {
    const age = featureAge(featureUse, feature, sessionCount);
    return (
      age !== null && age >= FEATURE_USE_WINDOW && age < FEATURE_COMEBACK_WINDOW
    );
  });

/**
 * Features a player has not used yet, in the onboarding order — minus the
 * first three, which What Next's "use it once" card is already showing. Daily
 * walks one step ahead of it instead of repeating it.
 */
const discoveryPool = (
  featureUse: FeatureUseMap | undefined,
  exclude: QuestFeature[],
) => {
  const unused = DISCOVERY_ORDER.filter(
    (feature) =>
      featureUse?.[feature] === undefined && !exclude.includes(feature),
  );
  const ahead = unused.slice(3, 7);
  return ahead.length > 0 ? ahead : unused;
};

const toolTask = (
  feature: QuestFeature,
  slot: DailyQuestSlot | undefined,
  random: Random,
): DrawnQuestTask => ({
  template: pick(FEATURE_QUEST_TEMPLATES[feature], random),
  feature,
  ...(slot && { slot }),
});

/**
 * Draws today's three quests. Pure: everything it needs is on the user
 * document the store already holds, so drawing costs no read.
 */
export const drawDailyQuest = ({
  sessionCount,
  featureUse,
  previousFeatures = [],
  random = Math.random,
}: DrawInput): DailyQuestDraw => {
  const tasks: DrawnQuestTask[] = [
    { template: pick(CORE_QUEST_TEMPLATES, random), slot: "core" },
  ];
  const taken = (): QuestFeature[] =>
    tasks.flatMap((task) => (task.feature ? [task.feature] : []));

  // One pool for the whole draw, picked without putting back — recomputing it
  // after each pick would slide the window past What Next's three.
  const discover = (count: number) => {
    const pool = discoveryPool(featureUse, taken());
    for (let i = 0; i < count && pool.length > 0; i++) {
      const [feature] = pool.splice(
        Math.floor(random() * pool.length) % pool.length,
        1,
      );
      tasks.push(toolTask(feature, "discover", random));
    }
  };

  let mode: DailyQuestDrawMode;
  const used = featuresInUse(featureUse, sessionCount);
  const dropped = droppedFeatures(featureUse, sessionCount);

  if (sessionCount < NEW_PLAYER_ACTIVE_DAYS) {
    mode = "onboarding";
    discover(2);
  } else if (!featureUse) {
    mode = "legacy";
    const pool = QUEST_FEATURES.filter((feature) => feature !== "guild");
    while (tasks.length < 3) {
      const rest = pool.filter((feature) => !taken().includes(feature));
      tasks.push(toolTask(pick(rest, random), undefined, random));
    }
  } else if (used.length >= 2) {
    mode = "regular";
    const fresh = used.filter((feature) => !previousFeatures.includes(feature));
    const pool = fresh.length >= 2 ? fresh : used;
    const weight = (feature: QuestFeature) =>
      1 +
      (FEATURE_USE_WINDOW -
        (featureAge(featureUse, feature, sessionCount) ?? 0)) /
        10;

    const first = weightedPick(pool, weight, random);
    tasks.push(toolTask(first, "tool", random));

    if (sessionCount % COMEBACK_EVERY === 0 && dropped.length > 0) {
      tasks.push(toolTask(pick(dropped, random), "comeback", random));
    } else {
      const rest = pool.filter((feature) => feature !== first);
      const second =
        rest.length > 0 ? rest : used.filter((feature) => feature !== first);
      tasks.push(
        toolTask(weightedPick(second, weight, random), "tool", random),
      );
    }
  } else if (used.length === 1) {
    mode = "thin";
    tasks.push(toolTask(used[0], "tool", random));
    if (dropped.length > 0)
      tasks.push(toolTask(pick(dropped, random), "comeback", random));
    else discover(1);
  } else {
    mode = "empty";
    if (dropped.length > 0)
      tasks.push(toolTask(pick(dropped, random), "comeback", random));
    discover(3 - tasks.length);
  }

  // A profile can run out of candidates (everything discovered, nothing
  // dropped). Fill with practice rather than hand out a short set.
  while (tasks.length < 3) {
    const types = tasks.map((task) => task.template.type);
    const rest = CORE_QUEST_TEMPLATES.filter(
      (template) => !types.includes(template.type),
    );
    tasks.push({ template: pick(rest, random), slot: "core" });
  }

  return { mode, tasks, features: taken() };
};

/**
 * A replacement for one task of today's set — the daily swap. A tool quest is
 * swapped for another tool the player uses (else one to discover, else any),
 * a practice quest for another practice quest. Never a feature or type already
 * in the set, and never the specific-exercise quest, which needs the catalog.
 */
export const drawReplacementTask = (
  tasks: Pick<DailyQuestTask, "type" | "feature" | "slot">[],
  index: number,
  {
    sessionCount,
    featureUse,
    random = Math.random,
  }: Omit<DrawInput, "previousFeatures">,
): DrawnQuestTask | null => {
  const current = tasks[index];
  if (!current) return null;

  const types = tasks.map((task) => task.type);

  if (!current.feature) {
    const rest = CORE_QUEST_TEMPLATES.filter(
      (template) =>
        !types.includes(template.type) &&
        template.type !== "practice_specific_exercise",
    );
    return rest.length > 0
      ? { template: pick(rest, random), slot: "core" }
      : null;
  }

  const inSet = tasks.flatMap((task) => (task.feature ? [task.feature] : []));
  const notInSet = (feature: QuestFeature) => !inSet.includes(feature);

  const used = featuresInUse(featureUse, sessionCount).filter(notInSet);
  if (used.length > 0) return toolTask(pick(used, random), "tool", random);

  const discoverable = discoveryPool(featureUse, inSet);
  if (discoverable.length > 0)
    return toolTask(pick(discoverable, random), "discover", random);

  const any = QUEST_FEATURES.filter(
    (feature) => notInSet(feature) && feature !== "guild",
  );
  return any.length > 0
    ? toolTask(pick(any, random), current.slot, random)
    : null;
};
