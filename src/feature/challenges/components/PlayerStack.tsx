import { cn } from "assets/lib/utils";
import type { ChallengeSubmission } from "feature/challenges/types/challenge.types";

interface PlayerStackProps {
  submissions: ChallengeSubmission[];
  /** How many faces to show before collapsing the rest into a “+N”. */
  max?: number;
  className?: string;
}

/** Overlapping avatars of the players who already put a recording on a song. */
export const PlayerStack = ({
  submissions,
  max = 4,
  className,
}: PlayerStackProps) => {
  if (submissions.length === 0) return null;

  const shown = submissions.slice(0, max);
  const overflow = submissions.length - shown.length;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((submission) => (
        <span
          key={submission.id}
          title={submission.userName}
          className='flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[9px] font-bold text-zinc-300 ring-2 ring-zinc-950'>
          {submission.userAvatarUrl ? (
            <img
              src={submission.userAvatarUrl}
              alt=''
              className='h-full w-full object-cover'
            />
          ) : (
            (submission.userName || "?").charAt(0).toUpperCase()
          )}
        </span>
      ))}
      {overflow > 0 && (
        <span className='flex h-6 items-center rounded-full bg-zinc-800 px-2 text-[10px] font-bold text-zinc-400 ring-2 ring-zinc-950'>
          +{overflow}
        </span>
      )}
    </div>
  );
};
