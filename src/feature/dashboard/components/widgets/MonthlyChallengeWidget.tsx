import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import {
  useChallengeSubmissions,
  useCurrentChallenge,
} from "feature/challenges/hooks/useChallenges";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import type { Timestamp } from "firebase/firestore";
import { Check, Medal, Music } from "lucide-react";
import { useMemo } from "react";

import { WidgetHeader, WidgetLink } from "./WidgetHeader";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysLeftLabel = (endsAt: Timestamp | undefined): string | null => {
  if (!endsAt || typeof endsAt.toDate !== "function") return null;
  const days = Math.ceil((endsAt.toDate().getTime() - Date.now()) / DAY_MS);
  if (!Number.isFinite(days) || days <= 0) return "ends today";
  return days === 1 ? "1 day left" : `${days} days left`;
};

/**
 * The month's board in five rows: which songs are up, which ones already have
 * a recording from this player, and how long is left to add the rest.
 */
export const MonthlyChallengeWidget = () => {
  const { userAuth } = useDashboardData();
  const { data: challenge, isLoading } = useCurrentChallenge();
  const { data: submissions = [] } = useChallengeSubmissions(challenge?.id);

  const recorded = useMemo(
    () =>
      new Set(
        submissions
          .filter((submission) => submission.userId === userAuth)
          .map((submission) => submission.songId),
      ),
    [submissions, userAuth],
  );

  const songs = challenge?.songs ?? [];
  const daysLeft = daysLeftLabel(challenge?.endsAt);

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        icon={Medal}
        title='Monthly challenge'
        action={<WidgetLink href='/challenges'>Open challenge</WidgetLink>}
      />

      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-10 w-full rounded-lg' />
          ))}
        </div>
      ) : !challenge ? (
        <p className='text-sm text-zinc-400'>
          No challenge is running right now. The next board opens with the new
          month.
        </p>
      ) : (
        <div className='flex flex-1 flex-col gap-4'>
          <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
            <p className='text-sm font-semibold text-zinc-100'>
              {challenge.title}
            </p>
            {daysLeft && (
              <span className='text-xs text-zinc-500'>{daysLeft}</span>
            )}
          </div>

          <ul className='space-y-1.5'>
            {songs.map((song) => {
              const done = recorded.has(song.songId);
              return (
                <li key={song.songId} className='flex items-center gap-3'>
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt=''
                      className='h-9 w-9 shrink-0 rounded object-cover'
                    />
                  ) : (
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded bg-zinc-800'>
                      <Music size={14} className='text-zinc-500' />
                    </div>
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm text-zinc-100'>
                      {song.title}
                    </p>
                    <p className='truncate text-xs text-zinc-500'>
                      {song.artist}
                    </p>
                  </div>
                  {done && (
                    <Check
                      size={16}
                      className='shrink-0 text-emerald-400'
                      aria-label='Recorded'
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <p className='mt-auto text-xs text-zinc-500'>
            <span className='font-semibold text-zinc-300'>
              {recorded.size} of {songs.length}
            </span>{" "}
            recorded
          </p>
        </div>
      )}
    </Card>
  );
};
