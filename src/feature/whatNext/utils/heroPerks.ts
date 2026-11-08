import type {
  NextAction,
  NextMessage,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";
import type { DailyQuestTask, DailyQuestTaskType } from "types/api.types";

/** Quest tasks any logged session moves forward, whatever was played. */
const ANY_SESSION: ReadonlySet<DailyQuestTaskType> = new Set([
  "practice_total_time",
  "long_session",
]);

/** Quest tasks that a hero from this source moves forward. */
const BY_SOURCE: Partial<Record<NextAction["source"], DailyQuestTaskType[]>> = {
  plan: ["practice_plan", "complete_two_plans"],
  songs: ["practice_any_song"],
};

const heroExerciseId = (hero: NextAction): string | undefined => {
  const item = hero.sessionItem;
  if (!item) return undefined;
  if (item.kind === "exercise" || item.kind === "goal") return item.exerciseId;
  if (item.kind === "roadmap") return item.exerciseId;
  return undefined;
};

/** Does playing the hero move this quest task forward? */
export const heroAdvancesTask = (
  hero: NextAction,
  task: Pick<DailyQuestTask, "type" | "exerciseId">,
): boolean => {
  if (ANY_SESSION.has(task.type)) return true;
  if (BY_SOURCE[hero.source]?.includes(task.type)) return true;
  return (
    task.type === "practice_specific_exercise" &&
    !!task.exerciseId &&
    task.exerciseId === heroExerciseId(hero)
  );
};

/**
 * What else the hero takes care of on the way. The streak and the daily quest
 * used to be steps of their own, which sent players to a filler exercise to
 * tick a box; now they are reasons the hero is worth playing today.
 */
export const heroPerks = (
  snapshot: WhatNextSnapshot,
  hero: NextAction | null,
): NextMessage[] => {
  if (!hero?.isPractice) return [];
  const perks: NextMessage[] = [];

  const streak = snapshot.streak;
  if (
    hero.source !== "streak" &&
    streak &&
    !streak.didPracticeToday &&
    streak.dayWithoutBreak > 0
  ) {
    perks.push({
      key: "perks.streak",
      params: { count: streak.dayWithoutBreak },
    });
  }

  const quest = snapshot.dailyQuest;
  if (
    quest &&
    !quest.isRewardClaimed &&
    quest.tasks.some(
      (task) => !task.isCompleted && heroAdvancesTask(hero, task),
    )
  ) {
    perks.push({ key: "perks.quest" });
  }

  return perks;
};
