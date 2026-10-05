import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { resolveLoggedExercises } from "feature/logs/utils/loggedPractice";
import {
  EXERCISES_BY_ID,
  findExerciseByTitle,
} from "feature/logs/utils/practiceCatalog";
import type { ActivityPreview } from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import type { CurrentActivityInterface } from "types/api.types";

export interface LiveActivityTargets {
  /** What the name of the thing being played opens: the exercise or lesson, or the song's page. */
  current: { preview: ActivityPreview } | { href: string } | null;
  /** What the plan's name opens — only when the plan is more than that one exercise again. */
  plan: ActivityPreview | null;
}

/**
 * What another player can open from someone's "Live now" entry. Players on an older build publish
 * only titles, so an exercise is still looked up by its title when no id came along.
 */
export const resolveLiveActivity = (
  activity: CurrentActivityInterface,
): LiveActivityTargets => {
  const exercise =
    (activity.exerciseId && EXERCISES_BY_ID.get(activity.exerciseId)) ||
    findExerciseByTitle(activity.exerciseTitle);

  const current: LiveActivityTargets["current"] = activity.lessonVideoId
    ? {
        preview: {
          kind: "lesson",
          title: activity.exerciseTitle,
          videoId: activity.lessonVideoId,
        },
      }
    : activity.songId
      ? { href: `/songs?view=management&songId=${activity.songId}` }
      : exercise
        ? { preview: { kind: "exercise", exercise } }
        : null;

  const catalogPlan = activity.planId
    ? defaultPlans.find((plan) => plan.id === activity.planId)
    : undefined;
  const routine = resolveLoggedExercises(activity.exerciseIds, EXERCISES_BY_ID);

  const plan: ActivityPreview | null = catalogPlan
    ? { kind: "plan", plan: catalogPlan }
    : // A single-exercise session is wrapped in a plan too — its exercise line already covers it.
      routine.length > 1
      ? { kind: "routine", title: activity.planTitle, exercises: routine }
      : null;

  return { current, plan };
};
