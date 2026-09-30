import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { Music, Play } from "lucide-react";
import { FaClock, FaListUl } from "react-icons/fa";

interface PlanPreviewDialogProps {
  plan: ExercisePlan | null;
  onClose: () => void;
  onOpenPlan: (planId: string) => void;
  isLoading?: boolean;
}

/**
 * Shows what's inside a routine (full description + exercise list) before the
 * player opens it, so similar plans can be compared without starting either.
 */
export const PlanPreviewDialog = ({
  plan,
  onClose,
  onOpenPlan,
  isLoading,
}: PlanPreviewDialogProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const totalDuration = plan
    ? Math.round(plan.exercises.reduce((acc, ex) => acc + ex.timeInMinutes, 0))
    : 0;

  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='border-none bg-zinc-950 text-zinc-100 sm:max-w-lg'>
        {plan && (
          <>
            <DialogHeader className='space-y-3 pr-10 text-left'>
              <p className='text-xs font-medium text-zinc-500'>
                {t(`exercises:categories.${plan.category}` as any)}
                {" · "}
                {t(`exercises:difficulty.${plan.difficulty}` as any)}
              </p>
              <DialogTitle className='text-xl font-bold leading-tight text-zinc-50'>
                {plan.title}
              </DialogTitle>
              <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
                {plan.description}
              </DialogDescription>
              <div className='flex items-center gap-4 pt-1 text-xs font-medium text-zinc-400'>
                <span className='flex items-center gap-1.5'>
                  <FaClock className='h-3.5 w-3.5 text-zinc-500' />
                  {totalDuration} min
                </span>
                <span className='flex items-center gap-1.5'>
                  <FaListUl className='h-3.5 w-3.5 text-zinc-500' />
                  {plan.exercises.length}{" "}
                  {plan.exercises.length === 1 ? "exercise" : "exercises"}
                </span>
              </div>
            </DialogHeader>

            <ol className='space-y-1.5'>
              {plan.exercises.map((exercise, index) => (
                <li
                  key={`${exercise.id}-${index}`}
                  className='flex items-center gap-3 rounded-lg bg-zinc-900/60 px-3 py-2.5'>
                  <span className='w-5 shrink-0 text-center text-xs font-semibold text-zinc-500'>
                    {index + 1}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='flex items-center gap-1.5 truncate text-sm font-medium text-zinc-100'>
                      {exercise.songData && (
                        <Music className='h-3.5 w-3.5 shrink-0 text-zinc-500' />
                      )}
                      <span className='truncate'>{exercise.title}</span>
                    </p>
                    <p className='text-xs text-zinc-500'>
                      {t(`exercises:categories.${exercise.category}` as any)}
                    </p>
                  </div>
                  <span className='shrink-0 text-xs font-medium text-zinc-400'>
                    {Math.round(exercise.timeInMinutes)} min
                  </span>
                </li>
              ))}
            </ol>

            <DialogFooter className='gap-2 pt-2 sm:space-x-0'>
              <Button
                variant='ghost'
                onClick={onClose}
                className='text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'>
                Close
              </Button>
              <Button
                onClick={() => onOpenPlan(plan.id)}
                loading={isLoading}
                className='bg-white text-zinc-950 hover:bg-zinc-200'>
                {/* It drops you straight into the session — not a link out. */}
                <Play className='fill-current' />
                Start plan
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
