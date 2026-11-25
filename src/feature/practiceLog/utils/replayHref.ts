import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { findExerciseByTitle } from "feature/logs/utils/practiceCatalog";

/**
 * Where a logged session can be played again. Only what has a page of its own:
 * a catalog plan, a song or a single catalog exercise. The player's own log
 * keeps no exercise ids, so the exercise is looked up by its title, the way the
 * feed does it. Auto plans and sessions of several songs have nowhere to go.
 */
export const getReplayHref = ({
  planId,
  songId,
  songs,
  exceriseTitle,
}: Pick<
  FirebaseUserExceriseLog,
  "planId" | "songId" | "songs" | "exceriseTitle"
>): string | undefined => {
  if (planId && defaultPlans.some((plan) => plan.id === planId))
    return `/timer/plans?planId=${planId}`;
  if (songId)
    return (songs?.length ?? 0) > 1 ? undefined : `/timer/song/${songId}`;
  const exercise = exceriseTitle ? findExerciseByTitle(exceriseTitle) : null;
  return exercise ? `/practice/exercise/${exercise.id}` : undefined;
};
