import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
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
import { ChevronRight, Clock, ListChecks, Play } from "lucide-react";
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

const KIND_LABEL: Record<ActivityPreview["kind"], string> = {
  plan: "Plan",
  routine: "Routine",
  exercise: "Exercise",
  lesson: "Lesson",
};

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
      {/* One padded card: header, meta and actions are separated by spacing
          rather than the rules the modal used to draw across itself. */}
      {/* No `relative` here — DialogContent is `fixed` (which already anchors the
          absolute decorations below), and tailwind-merge would drop the `fixed`. */}
      <DialogContent
        overlayClassName='z-[120]'
        className='z-[120] flex flex-col gap-6 overflow-hidden rounded-lg bg-zinc-950/95 p-6 backdrop-blur-3xl sm:max-w-[480px]'>
        {/* Cyan wash over the top of the card — same treatment the header block
            used to carry, now spanning the whole (borderless) panel. */}
        <div className='pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-500/10 to-transparent' />
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_70%)]' />

        <DialogHeader className='relative space-y-2 text-left'>
          <span className='text-xs font-semibold text-cyan-400'>
            {KIND_LABEL[kind]}
          </span>
          <DialogTitle className='pr-10 text-xl font-bold leading-tight text-zinc-100'>
            {title}
          </DialogTitle>
          {description && (
            <p className='text-sm leading-relaxed text-zinc-400'>
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

        {/* Uppercase kept on request — it is the look the owner signed off on,
            styleguide rule #11 notwithstanding. */}
        {totalDuration !== null && (
          <div className='relative flex flex-wrap items-center gap-2 uppercase tracking-wider'>
            <Chip color='cyan'>
              <Clock className='h-3.5 w-3.5' />
              {formatDuration(totalDuration)}
            </Chip>
            {difficulty && <Chip color='emerald'>{difficulty}</Chip>}
            {category && <Chip>{category}</Chip>}
            {listedExercises && (
              <Chip>
                <ListChecks className='h-3.5 w-3.5 text-zinc-400' />
                {listedExercises.length}
              </Chip>
            )}
          </div>
        )}

        {listedExercises && listedExercises.length > 0 && (
          <div className='scrollbar-premium relative -mx-2 max-h-[40vh] overflow-y-auto'>
            <h4 className='mb-2 px-2 text-xs font-semibold text-zinc-500'>
              Exercises
            </h4>
            <ul className='space-y-1'>
              {listedExercises.map((ex, i) => (
                <li key={`${ex.id}-${i}`}>
                  <button
                    type='button'
                    onClick={() => setPickedExercise(ex)}
                    className='flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-white'>
                    <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-[10px] font-semibold text-zinc-400'>
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

        {/* Kept as they were on request — the uppercase pair is the look the
            owner signed off on, styleguide rule #11 notwithstanding. */}
        <div className='relative flex items-center justify-end gap-3'>
          <Button
            variant='ghost'
            onClick={pickedExercise ? () => setPickedExercise(null) : onClose}
            className='rounded-[8px] text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-white/5 hover:text-white'>
            {pickedExercise ? "Back" : "Close"}
          </Button>
          {/* Button wraps its children in its own flex span, so the variant's
              `gap-2` never reaches the icon — the margin has to live here. */}
          {canStart && (
            <Button
              onClick={handleStart}
              className='rounded-[8px] text-[11px] font-bold uppercase tracking-widest'>
              Start
              <Play className='ml-2 h-3 w-3' />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
