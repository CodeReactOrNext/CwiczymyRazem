import { Button } from "assets/components/ui/button";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { PracticeArea } from "feature/practiceCalendar/types/calendar.types";
import { toDateKey } from "feature/practiceCalendar/utils/calendarDates";
import { buildDayPlan } from "feature/practiceCalendar/utils/calendarItems";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { RankedAction } from "feature/whatNext/types/whatNext.types";
import {
  pickSessionItems,
  SESSION_LENGTHS,
  toCalendarItems,
} from "feature/whatNext/utils/buildSession";
import posthog from "posthog-js";
import { toast } from "sonner";

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

interface SessionLauncherProps {
  ranked: RankedAction[];
  onStart: (plan: ExercisePlan) => void;
}

/**
 * "Play 15 / 30 / 45 minutes": the top of the road packed into one session,
 * built by the calendar's own day builder so it plays like any planned day.
 */
export const SessionLauncher = ({ ranked, onStart }: SessionLauncherProps) => {
  const { t } = useNextMessage();
  const playable = ranked.some((action) => action.sessionItem);

  const start = (minutes: number) => {
    const picks = pickSessionItems(ranked, minutes);
    const plan = buildDayPlan(
      toDateKey(new Date()),
      toCalendarItems(picks, exerciseArea),
      EXERCISES_BY_ID,
    );
    if (!plan) {
      toast.error(t("session.nothing"));
      return;
    }
    posthog.capture("what_next_session_started", {
      minutes,
      items: plan.exercises.length,
    });
    onStart({
      ...plan,
      id: `what-next-${minutes}`,
      title: t("session.started"),
    });
  };

  if (!playable) return null;

  return (
    <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4'>
      <p className='text-sm text-zinc-400'>{t("session.title")}</p>
      <div className='flex gap-2'>
        {SESSION_LENGTHS.map((minutes) => (
          <Button
            key={minutes}
            size='sm'
            variant='subtle'
            onClick={() => start(minutes)}>
            {t("session.minutes", { count: minutes })}
          </Button>
        ))}
      </div>
    </div>
  );
};
