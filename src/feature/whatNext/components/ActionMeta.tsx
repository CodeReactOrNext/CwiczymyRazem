import { cn } from "assets/lib/utils";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { NextAction } from "feature/whatNext/types/whatNext.types";
import { Clock, Ticket } from "lucide-react";

/** Deadlines inside this window get the orange of urgency; further ones stay grey. */
const URGENT_MS = 6 * 60 * 60 * 1000;

/** The small facts after a title: time left and what it pays. */
export const ActionMeta = ({
  action,
  now,
  className,
}: {
  action: NextAction;
  now: number;
  className?: string;
}) => {
  const { timeLeft } = useNextMessage();
  const deadline = action.deadlineAt;
  const fame = action.reward?.fame ?? 0;
  const cases = action.reward?.caseTokens ?? 0;
  if (!deadline && !fame && !cases) return null;

  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium",
        className,
      )}>
      {deadline !== undefined && deadline > now && (
        <span
          className={cn(
            "flex items-center gap-1 tabular-nums",
            deadline - now < URGENT_MS ? "text-orange-400" : "text-zinc-400",
          )}>
          <Clock size={12} />
          {timeLeft(deadline, now)}
        </span>
      )}
      {fame > 0 && (
        <span className='flex items-center gap-1 tabular-nums text-amber-400'>
          <img
            src='/images/tokens/coin.png'
            alt=''
            className='h-3 w-3 object-contain'
          />
          +{fame}
        </span>
      )}
      {cases > 0 && (
        <span className='flex items-center gap-1 tabular-nums text-cyan-300'>
          <Ticket size={12} />+{cases}
        </span>
      )}
    </span>
  );
};

/** A thin bar for "how far along": quiet grey track, emerald fill. */
export const ActionProgress = ({
  progress,
}: {
  progress?: NextAction["progress"];
}) => {
  if (!progress || progress.max <= 0) return null;
  const share = Math.min(1, progress.value / progress.max);
  return (
    <span className='mt-2 block h-1 w-full max-w-48 overflow-hidden rounded-full bg-zinc-800'>
      <span
        className='block h-full rounded-full bg-emerald-500/80'
        style={{ width: `${share * 100}%` }}
      />
    </span>
  );
};
