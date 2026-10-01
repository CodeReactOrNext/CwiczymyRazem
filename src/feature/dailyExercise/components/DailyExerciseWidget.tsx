import { Card } from "assets/components/ui/card";
import { Chip } from "assets/components/ui/chip";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { useDailyExercise } from "feature/dailyExercise/hooks/useDailyExercise";
import type { DailyExerciseEntry } from "feature/dailyExercise/types/dailyExercise.types";
import { DAILY_LEADERBOARD_SIZE } from "feature/dailyExercise/utils/dailyExercise";
import { WidgetHeader } from "feature/dashboard/components/widgets/WidgetHeader";
import { TabPreviewGlyph } from "feature/landing/components/TabPreviewGlyph";
import { getTabPreview } from "feature/landing/lib/tabPreview";
import { selectUserAuth } from "feature/user/store/userSlice";
import { CalendarClock, Clock, Gauge, Mic, Play, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

const formatTimeLeft = (ms: number): string => {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const formatScore = (score: number) => score.toLocaleString("en-US");

const PLACE_COLORS = ["text-amber-400", "text-zinc-300", "text-orange-400"];

/** Places the empty board still shows, so a quiet morning reads as "up for grabs", not "broken". */
const EMPTY_PLACES = 3;

const PlaceNumber = ({ place }: { place: number }) => (
  <span
    className={cn(
      "w-5 shrink-0 text-center text-sm font-bold tabular-nums",
      PLACE_COLORS[place - 1] ?? "text-zinc-500",
    )}>
    {place}
  </span>
);

const BoardRow = ({
  entry,
  place,
  isMe,
}: {
  entry: DailyExerciseEntry;
  place: number;
  isMe: boolean;
}) => (
  <li
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2",
      isMe && "bg-cyan-500/10",
    )}>
    <PlaceNumber place={place} />
    <Avatar
      avatarURL={entry.avatar || undefined}
      name={entry.displayName}
      lvl={entry.lvl}
      size='xs'
    />
    <span
      className={cn(
        "min-w-0 flex-1 truncate text-sm",
        isMe ? "font-semibold text-cyan-300" : "text-zinc-200",
      )}>
      {entry.displayName}
    </span>
    <span className='shrink-0 text-right'>
      <span className='block text-sm font-semibold tabular-nums text-zinc-100'>
        {formatScore(entry.score)}
      </span>
      <span className='block text-[11px] tabular-nums text-zinc-500'>
        {entry.accuracy}%{entry.bpm ? ` · ${entry.bpm} BPM` : ""}
      </span>
    </span>
  </li>
);

const EmptyBoard = () => (
  <div>
    <ol className='space-y-1'>
      {Array.from({ length: EMPTY_PLACES }, (_, i) => (
        <li key={i} className='flex items-center gap-3 rounded-lg px-3 py-2'>
          <PlaceNumber place={i + 1} />
          <span className='size-7 shrink-0 rounded-full bg-zinc-800/80' />
          <span className='flex-1 text-sm text-zinc-500'>Open spot</span>
          <span className='h-2 w-12 rounded-full bg-zinc-800/80' />
        </li>
      ))}
    </ol>
    <p className='mt-3 px-3 text-sm text-zinc-400'>
      No scores yet. The first run takes #1.
    </p>
  </div>
);

const BoardSkeleton = () => (
  <div className='space-y-2'>
    {Array.from({ length: EMPTY_PLACES }, (_, i) => (
      <Skeleton key={i} className='h-11 w-full rounded-lg' />
    ))}
  </div>
);

/**
 * One exercise, the same for everyone, for one UTC day — scored by pitch
 * detection, with the day's top five next to it. A run counts whenever the
 * exercise is played through with the mic on, wherever it was started from.
 */
export const DailyExerciseWidget = () => {
  const uid = useAppSelector(selectUserAuth) ?? null;
  const { exercise, msLeft, leaderboard } = useDailyExercise(uid);
  const board = leaderboard.data;
  const me = board?.me ?? null;
  const meInTop = !!me && me.rank <= DAILY_LEADERBOARD_SIZE;
  const tabPreview = useMemo(
    () => getTabPreview(exercise?.tablature),
    [exercise],
  );

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        icon={CalendarClock}
        iconClassName='text-cyan-400'
        title='Exercise of the day'
        action={
          <span className='flex items-center gap-1.5 text-xs tabular-nums text-zinc-400'>
            <Clock size={12} className='text-zinc-500' />
            New in {formatTimeLeft(msLeft)}
          </span>
        }
      />

      {!exercise ? (
        <p className='text-sm text-zinc-400'>No exercise today.</p>
      ) : (
        <div className='grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10'>
          <div className='flex min-w-0 flex-col'>
            <h4 className='text-xl font-semibold text-zinc-100 sm:text-2xl'>
              {exercise.title}
            </h4>

            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <Chip className='capitalize'>{exercise.difficulty}</Chip>
              {exercise.metronomeSpeed && (
                <Chip>
                  <Gauge size={12} />
                  {exercise.metronomeSpeed.recommended} BPM
                </Chip>
              )}
              <Chip color='emerald'>
                <Mic size={12} />
                Mic scored
              </Chip>
            </div>

            {tabPreview.length > 0 && (
              <TabPreviewGlyph
                notes={tabPreview}
                className='mt-6 h-auto w-full max-w-xs'
              />
            )}

            <div className='mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6'>
              <Link
                href={`/practice/exercise/${exercise.id}`}
                className='inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'>
                <Play size={16} className='fill-current' />
                {me ? "Beat your score" : "Play"}
              </Link>
              {me ? (
                <p className='text-sm text-zinc-400'>
                  Your best{" "}
                  <span className='font-semibold tabular-nums text-zinc-100'>
                    {formatScore(me.score)}
                  </span>{" "}
                  · #{me.rank} of {board?.players}
                </p>
              ) : (
                <p className='text-sm text-zinc-400'>
                  Mic on, play it through, land on the board.
                </p>
              )}
            </div>
          </div>

          <div className='min-w-0 lg:rounded-lg lg:bg-zinc-900/40 lg:p-4'>
            <div className='mb-3 flex items-center justify-between gap-3 px-3'>
              <span className='text-sm font-semibold text-zinc-200'>
                Today&apos;s board
              </span>
              {!!board?.players && (
                <span className='flex items-center gap-1.5 text-xs tabular-nums text-zinc-400'>
                  <Users size={12} className='text-zinc-500' />
                  {board.players}
                </span>
              )}
            </div>

            {leaderboard.isLoading ? (
              <BoardSkeleton />
            ) : leaderboard.isError ? (
              <p className='px-3 text-sm text-zinc-400'>
                The board could not be loaded.
              </p>
            ) : !board?.top.length ? (
              <EmptyBoard />
            ) : (
              <ol className='space-y-1'>
                {board.top.map((entry, i) => (
                  <BoardRow
                    key={entry.userId}
                    entry={entry}
                    place={i + 1}
                    isMe={entry.userId === uid}
                  />
                ))}
                {me && !meInTop && (
                  <BoardRow entry={me} place={me.rank} isMe />
                )}
              </ol>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
