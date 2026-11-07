import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { PracticeArea } from "feature/practiceCalendar/types/calendar.types";
import { toDateKey } from "feature/practiceCalendar/utils/calendarDates";
import { buildDayPlan } from "feature/practiceCalendar/utils/calendarItems";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { RankedAction } from "feature/whatNext/types/whatNext.types";
import {
  pickSessionItems,
  toCalendarItems,
} from "feature/whatNext/utils/buildSession";
import posthog from "posthog-js";
import { useCallback } from "react";
import { toast } from "sonner";

/** How long "play the whole road" runs. */
export const ROAD_SESSION_MINUTES = 30;

const EXERCISES_BY_ID = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

const exerciseArea = (exerciseId: string): PracticeArea => {
  const category = EXERCISES_BY_ID.get(exerciseId)?.category;
  return category === "theory" ||
    category === "hearing" ||
    category === "creativity"
    ? category
    : "technique";
};

/**
 * The road as one session: its playable steps, in order, packed into
 * `ROAD_SESSION_MINUTES` by the calendar's own day builder. Null when nothing
 * on the road can be played in a session.
 */
export const useRoadSession = (ranked: RankedAction[] | undefined) => {
  const { t } = useNextMessage();
  const playable = !!ranked?.some((action) => action.sessionItem);

  const build = useCallback((): ExercisePlan | null => {
    if (!ranked) return null;
    const picks = pickSessionItems(ranked, ROAD_SESSION_MINUTES);
    const plan = buildDayPlan(
      toDateKey(new Date()),
      toCalendarItems(picks, exerciseArea),
      EXERCISES_BY_ID,
    );
    if (!plan) {
      toast.error(t("road.nothing_to_play"));
      return null;
    }
    posthog.capture("what_next_session_started", {
      minutes: ROAD_SESSION_MINUTES,
      items: plan.exercises.length,
    });
    return { ...plan, id: "what-next-road", title: t("road.session_title") };
  }, [ranked, t]);

  return { playable, build };
};
