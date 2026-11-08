import {
  achievementActions,
  bossActions,
  progressionActions,
} from "feature/whatNext/providers/horizon.provider";
import {
  goalActions,
  journeyActions,
  planActions,
  roadmapActions,
  rotationActions,
  scaleTreeActions,
  skillTreeActions,
  songActions,
} from "feature/whatNext/providers/progress.provider";
import {
  calendarActions,
  dailyExerciseActions,
  duelActions,
  onboardingActions,
  streakActions,
} from "feature/whatNext/providers/today.provider";
import {
  balanceActions,
  challengeActions,
  guildActions,
  milestoneActions,
  seasonActions,
} from "feature/whatNext/providers/week.provider";
import type {
  NextAction,
  RankedAction,
  WhatNextResult,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";
import { heroPerks } from "feature/whatNext/utils/heroPerks";
import type { RankOptions } from "feature/whatNext/utils/rankActions";
import {
  groupLanes,
  pickHero,
  rankActions,
  scoreAction,
} from "feature/whatNext/utils/rankActions";

/**
 * The streak and the daily quest are not here: any session keeps the one and
 * moves the other, so they show up as perks of the hero instead of as steps
 * that send the player to a filler exercise.
 */
const PROVIDERS: ((s: WhatNextSnapshot) => NextAction[])[] = [
  onboardingActions,
  dailyExerciseActions,
  calendarActions,
  duelActions,
  goalActions,
  journeyActions,
  roadmapActions,
  skillTreeActions,
  scaleTreeActions,
  songActions,
  rotationActions,
  planActions,
  milestoneActions,
  challengeActions,
  seasonActions,
  balanceActions,
  guildActions,
  progressionActions,
  achievementActions,
  bossActions,
];

/**
 * With nothing of the player's own to play — no plan, goal, song or path step —
 * a streak still running gets a short session to keep it, unless snoozed.
 */
const streakFallback = (
  snapshot: WhatNextSnapshot,
  options: RankOptions,
): RankedAction | null => {
  const [action] = streakActions(snapshot);
  if (!action || (options.snoozed?.[action.id] ?? 0) > options.now) return null;
  return { ...action, score: scoreAction(action, options) };
};

/** Every provider's actions, raw. */
export const collectActions = (snapshot: WhatNextSnapshot): NextAction[] =>
  PROVIDERS.flatMap((provider) => provider(snapshot));

/** Snapshot in, road out: the hero and the lanes under it. */
export const buildWhatNext = (
  snapshot: WhatNextSnapshot,
  options: Omit<RankOptions, "now"> = {},
): WhatNextResult => {
  const rankOptions = { ...options, now: snapshot.now };
  const ranked = rankActions(collectActions(snapshot), rankOptions);
  const hero = pickHero(ranked) ?? streakFallback(snapshot, rankOptions);
  return {
    hero,
    perks: heroPerks(snapshot, hero),
    lanes: groupLanes(ranked, snapshot.now, hero?.id),
    ranked: hero && !ranked.includes(hero) ? [hero, ...ranked] : ranked,
  };
};
