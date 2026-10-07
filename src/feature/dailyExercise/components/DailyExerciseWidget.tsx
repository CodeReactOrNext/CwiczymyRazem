import { Card } from "assets/components/ui/card";
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
import { useTranslation } from "hooks/useTranslation";
import { CalendarClock, Clock, Play, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

import { DailyPrize } from "./DailyPrize";

const formatTimeLeft = (ms: number): string => {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const formatScore = (score: number) => score.toLocaleString();

/** Places the empty board still shows, so a quiet morning reads as "up for grabs", not "broken". */
const EMPTY_PLACES = 3;

const PlaceNumber = ({ place }: { place: number }) => (
  <span className='w-5 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-400'>
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
      <span className='block text-[11px] tabular-nums text-zinc-400'>
        {entry.accuracy}%{entry.bpm ? ` · ${entry.bpm} BPM` : ""}
      </span>
    </span>
  </li>
);

const OpenSpotRow = ({ place }: { place: number }) => {
  const { t } = useTranslation("dashboard");
  return (
    <li className='flex items-center gap-3 rounded-lg px-3 py-2'>
      <PlaceNumber place={place} />
      <span className='size-7 shrink-0 rounded-full bg-zinc-800/80' />
      <span className='flex-1 text-sm text-zinc-400'>{t("daily_exercise.open_spot")}</span>
      <span className='h-2 w-12 rounded-full bg-zinc-800/80' />
    </li>
  );
};

const EmptyBoard = () => {
  const { t } = useTranslation("dashboard");
  return (
  <div>
    <ol className='space-y-1'>
      {Array.from({ length: EMPTY_PLACES }, (_, i) => (
        <OpenSpotRow key={i} place={i + 1} />
      ))}
    </ol>
    <p className='mt-3 px-3 text-sm text-zinc-400'>
      {t("daily_exercise.no_scores")}
    </p>
  </div>
  );
};

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
  const { t } = useTranslation("dashboard");
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
        title={t("daily_exercise.title")}
        action={
          <span className='flex items-center gap-1.5 text-xs tabular-nums text-zinc-400'>
            <Clock size={12} className='text-zinc-500' />
            {t("daily_exercise.new_in", { time: formatTimeLeft(msLeft) })}
          </span>
        }
      />

      {!exercise ? (
        <p className='text-sm text-zinc-400'>{t("daily_exercise.none_today")}</p>
      ) : (
        // Two columns with no panels of their own, like the rest of Home: the
        // exercise (what, how it looks, what #1 takes home, the button) and
        // the board. They wrap rather than sit in a fixed grid, because the
        // card can be full or half width on the dashboard; half width and
        // phones stack the board under the exercise.
        <div className='flex flex-1 flex-wrap gap-x-12 gap-y-8'>
          <div className='flex min-w-0 flex-[1_1_20rem] flex-col'>
            <h4 className='text-lg font-semibold text-zinc-100 sm:text-xl'>
              {exercise.title}
            </h4>

            {tabPreview.length > 0 && (
              <TabPreviewGlyph
                notes={tabPreview}
                className='mt-5 h-auto w-full max-w-sm'
              />
            )}

            {board?.prize && <DailyPrize prize={board.prize} className='mt-6' />}

            <div className='mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6'>
              <Link
                href={`/practice/exercise/${exercise.id}`}
                className='inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'>
                <Play size={16} className='fill-current' />
                {me ? t("daily_exercise.beat_score") : t("daily_exercise.play")}
              </Link>
              {me && (
                <p className='text-sm text-zinc-400'>
                  {t("daily_exercise.your_best")}{" "}
                  <span className='font-semibold tabular-nums text-zinc-100'>
                    {formatScore(me.score)}
                  </span>{" "}
                  · {t("daily_exercise.rank_of", { rank: me.rank, players: board?.players })}
                </p>
              )}
            </div>
          </div>

          <div className='min-w-0 flex-[1_1_20rem]'>
            <div className='mb-3 flex items-center justify-between gap-3'>
              <span className='text-sm font-semibold text-zinc-100'>
                {t("daily_exercise.todays_board")}
              </span>
              {!!board?.players && (
                <span className='flex items-center gap-1.5 text-xs tabular-nums text-zinc-400'>
                  <Users size={12} className='text-zinc-500' />
                  {board.players}
                </span>
              )}
            </div>

            {/* Rows keep their padding for the "you" highlight; the negative
                margin puts place numbers back on the column's text edge. */}
            <div className='-mx-3'>
              {leaderboard.isLoading ? (
                <BoardSkeleton />
              ) : leaderboard.isError ? (
                <p className='px-3 text-sm text-zinc-400'>
                  {t("daily_exercise.board_error")}
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
                  {Array.from(
                    { length: Math.max(0, EMPTY_PLACES - board.top.length) },
                    (_, i) => (
                      <OpenSpotRow key={i} place={board.top.length + i + 1} />
                    ),
                  )}
                  {me && !meInTop && (
                    <BoardRow entry={me} place={me.rank} isMe />
                  )}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
