import { getClaims } from "feature/whatNext/providers/claims.provider";
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
  dailyQuestActions,
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
  WhatNextResult,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";
import type { RankOptions } from "feature/whatNext/utils/rankActions";
import {
  groupLanes,
  pickHero,
  rankActions,
} from "feature/whatNext/utils/rankActions";

const PROVIDERS: ((s: WhatNextSnapshot) => NextAction[])[] = [
  onboardingActions,
  streakActions,
  dailyQuestActions,
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

/** Every provider's actions, raw. */
export const collectActions = (snapshot: WhatNextSnapshot): NextAction[] =>
  PROVIDERS.flatMap((provider) => provider(snapshot));

/** Snapshot in, road out: the claims strip, the hero and the lanes under it. */
export const buildWhatNext = (
  snapshot: WhatNextSnapshot,
  options: Omit<RankOptions, "now"> = {},
): WhatNextResult => {
  const ranked = rankActions(collectActions(snapshot), {
    ...options,
    now: snapshot.now,
  });
  const hero = pickHero(ranked, snapshot.now);
  return {
    claims: getClaims(snapshot),
    hero,
    lanes: groupLanes(ranked, snapshot.now, hero?.id),
    ranked,
  };
};
