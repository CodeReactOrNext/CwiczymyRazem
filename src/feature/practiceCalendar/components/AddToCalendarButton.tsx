import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";

import { useCalendar } from "../hooks/useCalendar";
import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import { addDays, toDateKey } from "../utils/calendarDates";
import {
  MAX_SLOT_MINUTES,
  MIN_SLOT_MINUTES,
  planToItems,
} from "../utils/calendarItems";
import { MinutesInput } from "./PlannerControls";

const EXERCISES_BY_ID = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

/** The days offered: today and the thirteen after it. */
const DAYS_AHEAD = 14;

interface AddToCalendarDialogProps {
  exercise: Exercise;
  uid: string;
  onClose: () => void;
}

const AddToCalendarDialog = ({
  exercise,
  uid,
  onClose,
}: AddToCalendarDialogProps) => {
  const router = useRouter();
  const { formatDate, t } = useCalendarDisplay();
  const calendar = useCalendar(uid);
  const [today] = useState(() => toDateKey(new Date()));
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(() =>
    Math.min(
      MAX_SLOT_MINUTES,
      Math.max(MIN_SLOT_MINUTES, Math.round(exercise.timeInMinutes) || 10),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);
  const days = Array.from({ length: DAYS_AHEAD }, (_, index) =>
    addDays(today, index),
  );

  const add = async () => {
    const [item] = planToItems(
      { exercises: [{ ...exercise, timeInMinutes: minutes }] },
      EXERCISES_BY_ID,
    );
    setIsSaving(true);
    try {
      await calendar.addItem(date, item);
      posthog.capture("calendar_item_added_from_exercise", {
        exercise_id: exercise.id,
        days_ahead: days.indexOf(date),
      });
      toast.success(
        t("to_calendar.added", {
          day: formatDate(date, { weekday: "long", day: "numeric" }),
        }),
        {
          action: {
            label: t("to_calendar.open"),
            onClick: () => void router.push(`/calendar?week=${date}`),
          },
        },
      );
      onClose();
    } catch {
      toast.error(t("toast.error"));
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className='flex flex-col gap-6 border-0 bg-zinc-900 shadow-none sm:max-w-md sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("to_calendar.title")}
          </DialogTitle>
          <DialogDescription className='line-clamp-2 text-sm text-zinc-400'>
            {exercise.title}
          </DialogDescription>
        </div>

        <div
          role='radiogroup'
          aria-label={t("to_calendar.day")}
          className='grid grid-cols-7 gap-1'>
          {days.map((key) => {
            const selected = key === date;
            const planned = (calendar.days[key] ?? []).length > 0;
            return (
              <button
                key={key}
                type='button'
                role='radio'
                aria-checked={selected}
                onClick={() => setDate(key)}
                aria-label={formatDate(key, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                  selected
                    ? "bg-zinc-100 text-zinc-950"
                    : "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800",
                )}>
                <span
                  className={cn(
                    "text-[10px]",
                    selected ? "text-zinc-600" : "text-zinc-500",
                  )}>
                  {formatDate(key, { weekday: "narrow" })}
                </span>
                <span className='text-sm font-semibold tabular-nums'>
                  {formatDate(key, { day: "numeric" })}
                </span>
                {planned && !selected && (
                  <span
                    className='absolute bottom-1 h-1 w-1 rounded-full bg-zinc-500'
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className='flex items-center justify-between gap-4'>
          <span className='text-sm text-zinc-400'>
            {t("add.length_minutes")}
          </span>
          <MinutesInput
            value={minutes}
            min={MIN_SLOT_MINUTES}
            max={MAX_SLOT_MINUTES}
            onChange={setMinutes}
            label={t("add.length_minutes")}
          />
        </div>

        <Button
          onClick={() => void add()}
          disabled={calendar.isLoading || isSaving}
          className='h-11 rounded-lg border-b-black/25 bg-white font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
          {t("to_calendar.submit", {
            day: formatDate(date, { weekday: "short", day: "numeric" }),
          })}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

interface AddToCalendarButtonProps {
  exercise: Exercise;
  uid: string;
  className?: string;
}

/**
 * Puts the exercise on a day of the practice calendar, at a length to the
 * minute — from wherever the exercise is shown, without opening the calendar.
 */
export const AddToCalendarButton = ({
  exercise,
  uid,
  className,
}: AddToCalendarButtonProps) => {
  const { t } = useCalendarDisplay();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant='ghost'
        onClick={() => setOpen(true)}
        className={cn(
          "gap-1.5 text-zinc-300 hover:bg-white/5 hover:text-zinc-100",
          className,
        )}>
        <CalendarPlus className='h-3.5 w-3.5' />
        {t("to_calendar.button")}
      </Button>
      {open && (
        <AddToCalendarDialog
          exercise={exercise}
          uid={uid}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
