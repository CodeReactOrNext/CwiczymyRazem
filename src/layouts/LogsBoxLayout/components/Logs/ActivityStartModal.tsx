import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight, Play } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { formatMinutesDuration } from "utils/converter";

/** What a feed row opens: something another player practiced, ready to try. */
export type ActivityPreview =
  | { kind: "plan"; plan: ExercisePlan }
  /**
   * A routine known only from its log — someone's own plan or an auto plan. Nobody else can start
   * it as a whole, but every catalog exercise in it opens on its own.
   */
  | { kind: "routine"; title: string; exercises: Exercise[] }
  | { kind: "exercise"; exercise: Exercise }
  | { kind: "lesson"; title: string; videoId: string };

interface ActivityStartModalProps {
  preview: ActivityPreview;
  onClose: () => void;
  /**
   * A lesson isn't a page to go to — it plays in a practice window the caller opens. Without this
   * a lesson can only be watched here.
   */
  onStartLesson?: (lesson: { title: string; videoId: string }) => void;
}



const formatDuration = (minutes: number) =>
  minutes < 1 ? `${Math.round(minutes * 60)}s` : formatMinutesDuration(minutes);

const sumDuration = (exercises: Exercise[]) =>
  exercises.reduce((acc, ex) => acc + ex.timeInMinutes, 0);

/** Mounted only while open, so the exercise picked out of a routine resets with every opening. */
export const ActivityStartModal = ({
  preview,
  onClose,
  onStartLesson,
}: ActivityStartModalProps) => {
  const { t } = useTranslation("feed");
  const router = useRouter();
  // An exercise picked from the plan's or routine's list — the modal shows that one until "Back".
  const [pickedExercise, setPickedExercise] = useState<Exercise | null>(null);

  const exercise =
    pickedExercise ?? (preview.kind === "exercise" ? preview.exercise : null);
  const plan = !exercise && preview.kind === "plan" ? preview.plan : null;
  const lesson = !exercise && preview.kind === "lesson" ? preview : null;
  const listedExercises = plan
    ? plan.exercises
    : !exercise && preview.kind === "routine"
      ? preview.exercises
      : null;

  const kind = exercise ? "exercise" : preview.kind;
  const title =
    exercise?.title ??
    plan?.title ??
    (preview.kind === "routine" || preview.kind === "lesson"
      ? preview.title
      : "");
  const description = exercise?.description ?? plan?.description;
  const difficulty = exercise?.difficulty ?? plan?.difficulty;
  const category = exercise?.category ?? plan?.category;
  const totalDuration = exercise
    ? exercise.timeInMinutes
    : listedExercises
      ? sumDuration(listedExercises)
      : null;
  const meta = [
    totalDuration !== null && formatDuration(totalDuration),
    difficulty,
    category,
  ].filter((item): item is string => !!item);
  // A routine has no route of its own — only its exercises, one at a time.
  const canStart = kind === "lesson" ? !!onStartLesson : kind !== "routine";

  const handleStart = () => {
    if (lesson) {
      onStartLesson?.({ title: lesson.title, videoId: lesson.videoId });
      onClose();
      return;
    }

    // The practice page opens under the Community drawer otherwise.
    useCommunityDrawer.getState().setOpen(false);
    if (exercise) {
      router.push(`/practice/exercise/${exercise.id}`);
    } else if (plan) {
      router.push(`/timer/plans?planId=${plan.id}`);
    }
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}>
      {/* A plain panel: what it is, how long, and one way in. Sections are set
          apart by spacing — no washes, chips or rules. */}
      <DialogContent
        overlayClassName='z-[120]'
        className='z-[120] flex flex-col gap-5 rounded-lg p-6 sm:max-w-[480px]'>
        <DialogHeader className='space-y-1.5 text-left'>
          <span className='text-xs font-medium text-zinc-500'>
            {t(`activity_kind.${kind}`)}
          </span>
          <DialogTitle className='pr-10 text-lg font-bold leading-snug text-zinc-100'>
            {title}
          </DialogTitle>
          {/* Length, level and kind read as one quiet line under the title. */}
          {meta.length > 0 && (
            <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400'>
              {meta.map((item, i) => (
                <span key={i} className='flex items-center gap-2 capitalize'>
                  {i > 0 && <span className='text-zinc-600'>·</span>}
                  {item}
                </span>
              ))}
            </p>
          )}
          {description && (
            <p className='pt-1.5 text-sm leading-relaxed text-zinc-400'>
              {description}
            </p>
          )}
        </DialogHeader>

        {lesson && (
          <div className='relative aspect-video w-full overflow-hidden rounded-lg bg-black'>
            <iframe
              className='absolute inset-0 h-full w-full'
              src={`https://www.youtube.com/embed/${lesson.videoId}?rel=0`}
              title={lesson.title}
              allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen
            />
          </div>
        )}

        {listedExercises && listedExercises.length > 0 && (
          <div className='scrollbar-premium -mx-2 max-h-[40vh] overflow-y-auto'>
            <h4 className='mb-2 px-2 text-xs font-semibold text-zinc-500'>
              {t("exercises")}
            </h4>
            <ul className='space-y-1'>
              {listedExercises.map((ex, i) => (
                <li key={`${ex.id}-${i}`}>
                  <button
                    type='button'
                    onClick={() => setPickedExercise(ex)}
                    className='flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-white'>
                    <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-xs font-semibold text-zinc-400'>
                      {i + 1}
                    </span>
                    <span className='flex-1 leading-snug'>{ex.title}</span>
                    <span className='shrink-0 text-xs text-zinc-500'>
                      {formatDuration(ex.timeInMinutes)}
                    </span>
                    <ChevronRight className='h-4 w-4 shrink-0 text-zinc-600' />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Closing is the X in the corner; the only second action is the way
            back from an exercise opened out of a list. Phones get a full-width
            Start, easy to hit with a thumb. */}
        {(canStart || pickedExercise) && (
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3'>
            {pickedExercise && (
              <Button
                variant='ghost'
                onClick={() => setPickedExercise(null)}
                className='h-11 sm:h-10'>
                {t("back")}
              </Button>
            )}
            {/* Button wraps its children in its own flex span, so the variant's
                `gap-2` never reaches the icon — the margin has to live here. */}
            {canStart && (
              <Button onClick={handleStart} className='h-11 w-full sm:h-10 sm:w-auto sm:px-6'>
                <Play className='mr-2 h-4 w-4' />
                {t("start")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
