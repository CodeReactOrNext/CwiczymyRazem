import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import {
  Coins,
  Dumbbell,
  Loader2,
  Music,
  Plus,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import React, { useState } from "react";
import { FaYoutube } from "react-icons/fa6";

import type { RefineAction, RefineCosts } from "../../../types/refine.types";
import type { RoadmapStepRef } from "../../../utils/roadmapSteps";

/** Which of a step's paid actions are in flight. */
export type RefineBusy = Partial<Record<RefineAction | "removeStep", boolean>>;

export const isRefineBusy = (flags?: RefineBusy) =>
  !!flags && Object.values(flags).some(Boolean);

const NOTE_MAX = 500;

export interface StepRefineMenuProps {
  stepRef: RoadmapStepRef;
  costs: RefineCosts;
  tokensLeft: number | null;
  /** This step's in-flight actions. */
  busy: RefineBusy;
  /** Any step on the map has a paid call running — one at a time. */
  anyBusy: boolean;
  /** Candidate exercise ids from the last swap, while the owner picks. */
  exerciseOptions?: string[];
  /** The side of the node the trigger sits on — the menu opens outward. */
  side: "left" | "right";
  onRewrite: (ref: RoadmapStepRef, note: string) => void;
  onSwapExercise: (ref: RoadmapStepRef, note: string) => void;
  onSelectExercise: (ref: RoadmapStepRef, exerciseId: string) => void;
  onDismissExerciseOptions: (ref: RoadmapStepRef) => void;
  onRefreshLessons: (ref: RoadmapStepRef) => void;
  onFindSong: (ref: RoadmapStepRef) => void;
  onAddStep: (ref: RoadmapStepRef, note: string) => void;
  onRemoveStep: (ref: RoadmapStepRef) => void;
}

interface ActionItemProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  cost: number;
  busy?: boolean;
  disabled?: boolean;
  /** Keeps the menu open after the click — for an action whose answer lands in the menu. */
  keepOpen?: boolean;
  onSelect: () => void;
}

/** One row of the menu: what the coach can redo, and what it costs. */
const ActionItem = ({
  icon,
  label,
  hint,
  cost,
  busy,
  disabled,
  keepOpen,
  onSelect,
}: ActionItemProps) => (
  <DropdownMenuItem
    disabled={disabled || busy}
    onSelect={(event) => {
      if (keepOpen) event.preventDefault();
      onSelect();
    }}
    className='flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-xs text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:opacity-40'>
    <span className='flex h-4 w-4 shrink-0 items-center justify-center text-zinc-400'>
      {busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : icon}
    </span>
    <span className='min-w-0 flex-1'>
      <span className='block font-semibold'>{label}</span>
      {hint && <span className='block truncate text-zinc-500'>{hint}</span>}
    </span>
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        cost > 0 ? "bg-amber-500/15 text-amber-300" : "text-zinc-500",
      )}>
      {cost > 0 ? (
        <>
          {cost}
          <Coins className='h-3 w-3' />
        </>
      ) : (
        "free"
      )}
    </span>
  </DropdownMenuItem>
);

/**
 * The owner's paid changes, on the step's node of the map: a small wand next
 * to the step opens what the coach can redo — rewrite, a different exercise,
 * lessons or song searched again, a step added after — each with its price,
 * and the free removal. A note typed at the top steers the next change.
 */
export const StepRefineMenu: React.FC<StepRefineMenuProps> = ({
  stepRef,
  costs,
  tokensLeft,
  busy,
  anyBusy,
  exerciseOptions,
  side,
  onRewrite,
  onSwapExercise,
  onSelectExercise,
  onDismissExerciseOptions,
  onRefreshLessons,
  onFindSong,
  onAddStep,
  onRemoveStep,
}) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { step, phase } = stepRef;
  const isBusy = isRefineBusy(busy);
  const hasOptions = exerciseOptions !== undefined;
  const lastStep = phase.steps.length <= 1;
  const canAfford = (cost: number) => tokensLeft === null || tokensLeft >= cost;
  const cheapest = Math.min(...Object.values(costs));
  const broke = tokensLeft !== null && tokensLeft < cheapest;

  const exercise = step.suggestedExerciseId
    ? exercisesAgregat.find((e) => e.id === step.suggestedExerciseId)
    : undefined;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmRemove(false);
      }}>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label={`Refine "${step.title}"`}
          title='Refine this step'
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:bg-zinc-800",
            hasOptions
              ? "bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
              : "text-zinc-500 data-[state=open]:text-amber-300 hover:bg-zinc-800 hover:text-amber-300",
          )}>
          {isBusy ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin text-amber-300' />
          ) : hasOptions ? (
            <Dumbbell className='h-3.5 w-3.5' />
          ) : (
            <Wand2 className='h-3.5 w-3.5' />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        align='start'
        sideOffset={8}
        collisionPadding={16}
        className='w-72 border-white/10 bg-zinc-900 p-2 text-zinc-100 shadow-none'>
        <div className='flex items-start justify-between gap-3 px-2.5 pb-2 pt-1.5'>
          <span className='min-w-0'>
            <span className='block text-[10px] font-bold text-amber-300'>
              Refine step
            </span>
            <span className='block truncate text-sm font-semibold text-zinc-100'>
              {step.title}
            </span>
          </span>
          {tokensLeft !== null && (
            <span className='flex shrink-0 items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-zinc-300'>
              <Coins className='h-3 w-3 text-amber-300' />
              {tokensLeft}
            </span>
          )}
        </div>

        {hasOptions ? (
          <div className='flex flex-col gap-1.5 px-1 pb-1'>
            <p className='px-1.5 text-xs font-semibold text-zinc-400'>
              {exerciseOptions.length
                ? "Pick the exercise for this step"
                : "Nothing in the library fits this step better."}
            </p>
            {exerciseOptions.map((id) => {
              const candidate = exercisesAgregat.find((e) => e.id === id);
              if (!candidate) return null;
              const isCurrent = id === step.suggestedExerciseId;
              return (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => onSelectExercise(stepRef, id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-xs focus:text-zinc-100",
                    isCurrent
                      ? "bg-cyan-500/10 focus:bg-cyan-500/15"
                      : "focus:bg-zinc-800",
                  )}>
                  <Dumbbell className='h-4 w-4 shrink-0 text-cyan-400' />
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate font-semibold text-zinc-100'>
                      {candidate.title}
                    </span>
                    <span className='block truncate capitalize text-zinc-500'>
                      {candidate.difficulty} · {candidate.category}
                      {isCurrent && " · current"}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem
              onSelect={() => onDismissExerciseOptions(stepRef)}
              className='cursor-pointer justify-center rounded-md px-2.5 py-1.5 text-xs text-zinc-500 focus:bg-zinc-800 focus:text-zinc-300'>
              Keep the current one
            </DropdownMenuItem>
          </div>
        ) : (
          <>
            <div className='px-1 pb-2'>
              <textarea
                rows={2}
                maxLength={NOTE_MAX}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder='What should change? (optional)'
                className='w-full resize-none rounded-md bg-zinc-800/60 px-2.5 py-2 text-xs leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 focus:bg-zinc-800'
              />
            </div>

            <ActionItem
              icon={<RefreshCw className='h-3.5 w-3.5' />}
              label='Rewrite this step'
              hint={`${step.sessionsRequired} sessions`}
              cost={costs.rewriteStep}
              busy={busy.rewriteStep}
              disabled={anyBusy || !canAfford(costs.rewriteStep)}
              onSelect={() => onRewrite(stepRef, note)}
            />
            <ActionItem
              icon={<Dumbbell className='h-3.5 w-3.5' />}
              label='Swap the exercise'
              hint={exercise?.title ?? "No exercise linked"}
              cost={costs.swapExercise}
              busy={busy.swapExercise}
              disabled={anyBusy || !canAfford(costs.swapExercise)}
              keepOpen
              onSelect={() => onSwapExercise(stepRef, note)}
            />
            <ActionItem
              icon={<FaYoutube className='h-3.5 w-3.5' />}
              label='Find lessons again'
              hint={
                step.suggestedLessonIds?.length
                  ? `${step.suggestedLessonIds.length} linked`
                  : "No lessons linked"
              }
              cost={costs.refreshLessons}
              busy={busy.refreshLessons}
              disabled={anyBusy || !canAfford(costs.refreshLessons)}
              onSelect={() => onRefreshLessons(stepRef)}
            />
            <ActionItem
              icon={<Music className='h-3.5 w-3.5' />}
              label={
                step.suggestedSong ? "Find the song again" : "Find the song"
              }
              hint={step.suggestedSong?.title}
              cost={costs.findSong}
              busy={busy.findSong}
              disabled={anyBusy || !canAfford(costs.findSong)}
              onSelect={() => onFindSong(stepRef)}
            />
            <ActionItem
              icon={<Plus className='h-3.5 w-3.5' />}
              label='Add a step after this one'
              cost={costs.addStep}
              busy={busy.addSteps}
              disabled={anyBusy || !canAfford(costs.addStep)}
              onSelect={() => onAddStep(stepRef, note)}
            />

            <div className='mt-2 pt-1'>
              {confirmRemove ? (
                <div className='flex items-center gap-2 px-2.5 py-1.5'>
                  <span className='flex-1 text-xs font-semibold text-rose-200'>
                    Remove this step?
                  </span>
                  <DropdownMenuItem
                    onSelect={() => onRemoveStep(stepRef)}
                    className='cursor-pointer rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-200 focus:bg-rose-500/30 focus:text-rose-100'>
                    Remove
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setConfirmRemove(false);
                    }}
                    className='cursor-pointer rounded-md px-2 py-1 text-xs text-zinc-400 focus:bg-zinc-800 focus:text-zinc-200'>
                    Keep
                  </DropdownMenuItem>
                </div>
              ) : (
                <ActionItem
                  icon={<Trash2 className='h-3.5 w-3.5' />}
                  label='Remove this step'
                  hint={
                    lastStep ? "A phase keeps at least one step" : undefined
                  }
                  cost={0}
                  disabled={anyBusy || lastStep}
                  keepOpen
                  onSelect={() => setConfirmRemove(true)}
                />
              )}
            </div>

            {broke && (
              <p className='px-2.5 pb-1 pt-2 text-[11px] text-amber-300/80'>
                Not enough tokens for a paid change.
              </p>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
