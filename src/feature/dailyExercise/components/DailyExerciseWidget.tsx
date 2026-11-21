import { buttonVariants } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { useDailyExercise } from "feature/dailyExercise/hooks/useDailyExercise";
import type { DailyExerciseEntry } from "feature/dailyExercise/types/dailyExercise.types";
import { DAILY_PODIUM_SIZE, dailyPodium } from "feature/dailyExercise/utils/dailyExercise";
import { WidgetHeader } from "feature/dashboard/components/widgets/WidgetHeader";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Play } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "store/hooks";

import { DailyPrizeArt, DailyPrizeName } from "./DailyPrize";

const formatTimeLeft = (ms: number): string => {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const formatScore = (score: number) => score.toLocaleString();

/**
 * The board is a short list beside the exercise, one place per row. The rows
 * get no background of their own — the card is the one level of panel — except
 * the player's own, which is tinted. On a phone the negative margin puts place
 * numbers back on the card's text edge while the rows keep their padding for
 * that tint.
 */
const BOARD = "-mx-3 flex flex-col gap-1 sm:mx-0";
const ROW =
  "grid grid-cols-[1.25rem_2rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-3 py-2.5";

const PlaceNumber = ({ place, isMe }: { place: number; isMe?: boolean }) => (
  <span
    className={cn(
      "text-center text-sm font-bold tabular-nums",
      isMe ? "text-cyan-300" : "text-zinc-400",
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
  <li className={cn(ROW, isMe && "bg-cyan-500/10")}>
    <PlaceNumber place={place} isMe={isMe} />
    <Avatar
      avatarURL={entry.avatar || undefined}
      name={entry.displayName}
      size='xs'
    />
    <span className='min-w-0'>
      <span
        className={cn(
          "block truncate text-sm font-semibold",
          isMe ? "text-cyan-300" : "text-zinc-100",
        )}>
        {entry.displayName}
      </span>
      <span className='block text-xs tabular-nums text-zinc-400'>
        {entry.accuracy}%{entry.bpm ? ` · ${entry.bpm} BPM` : null}
      </span>
    </span>
    <span
      className={cn(
        "text-[15px] font-bold tabular-nums",
        isMe ? "text-cyan-300" : "text-zinc-100",
      )}>
      {formatScore(entry.score)}
    </span>
  </li>
);

const OpenRow = ({ place }: { place: number }) => {
  const { t } = useTranslation("dashboard");
  return (
    <li className={ROW}>
      <PlaceNumber place={place} />
      <span className='size-8 rounded-full border-2 border-dashed border-zinc-600' />
      <span className='min-w-0 truncate text-sm font-semibold text-zinc-400'>
        {t("daily_exercise.open_spot")}
      </span>
    </li>
  );
};

/**
 * How far the player's best run is from the prize: a bar that fills toward the
 * leader's score, or stands full once the player is the leader.
 */
const ChaseBar = ({
  me,
  top,
}: {
  me: DailyExerciseEntry & { rank: number };
  top: readonly DailyExerciseEntry[];
}) => {
  const { t } = useTranslation("dashboard");
  const isLeading = me.rank === 1;
  const leader = top[0];
  const runnerUp = top[1];
  if (!isLeading && !leader) return null;

  const percent = isLeading
    ? 100
    : Math.min(100, (me.score / Math.max(1, leader.score)) * 100);

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-baseline justify-between gap-3 text-[13px] font-semibold tabular-nums'>
        {isLeading ? (
          <span className='text-amber-400'>{t("daily_exercise.leading")}</span>
        ) : (
          <span className='text-zinc-100'>
            {t("daily_exercise.your_best", { score: formatScore(me.score) })}
          </span>
        )}
        <span className='text-zinc-400'>
          {isLeading
            ? runnerUp &&
              t("daily_exercise.ahead_of_second", {
                gap: formatScore(me.score - runnerUp.score),
              })
            : t("daily_exercise.gap_to_first", {
                gap: formatScore(leader.score - me.score),
              })}
        </span>
      </div>
      <div className='h-3.5 overflow-hidden rounded-full bg-zinc-700/50'>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-slow",
            isLeading ? "bg-amber-400" : "bar-shine bg-cyan-400",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

/**
 * One exercise, the same for everyone, for one UTC day — scored by pitch
 * detection. On the left the exercise, what #1 wins, how far the player is
 * from it and the button; on the right the board. A run counts whenever the
 * exercise is played through with the mic on, wherever it was started from.
 */
export const DailyExerciseWidget = () => {
  const { t } = useTranslation("dashboard");
  const localizeExercise = useLocalizeExercise();
  const uid = useAppSelector(selectUserAuth) ?? null;
  const { exercise, msLeft, leaderboard } = useDailyExercise(uid);
  const board = leaderboard.data;
  const me = board?.me ?? null;

  if (!exercise) {
    return (
      <Card className='flex h-full flex-col p-5 sm:p-6'>
        <WidgetHeader title={t("daily_exercise.title")} />
        <p className='text-sm text-zinc-400'>{t("daily_exercise.none_today")}</p>
      </Card>
    );
  }

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        title={t("daily_exercise.title")}
        className='mb-6'
        action={
          <span className='flex shrink-0 items-center gap-1.5 text-[13px] font-semibold tabular-nums text-orange-400'>
            <Clock size={14} strokeWidth={2.5} aria-hidden />
            {t("daily_exercise.time_left", { time: formatTimeLeft(msLeft) })}
          </span>
        }
      />

      <div className='flex flex-wrap items-center gap-x-14 gap-y-6'>
        <div className='flex min-w-0 flex-[1_1_20rem] flex-col gap-6'>
          <div className='flex items-center gap-4'>
            {board?.prize ? (
              <DailyPrizeArt
                prize={board.prize}
                className='size-[72px] rounded-lg'
              />
            ) : (
              <div className='size-[72px] shrink-0 rounded-lg bg-zinc-800' />
            )}
            <div className='min-w-0'>
              <h4 className='text-xl font-bold text-zinc-100'>
                {localizeExercise(exercise).title}
              </h4>
              {board?.prize && (
                <p className='mt-1.5 text-sm text-zinc-400'>
                  {t("daily_exercise.wins")}{" "}
                  <DailyPrizeName prize={board.prize} />
                </p>
              )}
            </div>
          </div>

          {me && <ChaseBar me={me} top={board?.top ?? []} />}

          <Link
            href={`/practice/exercise/${exercise.id}`}
            className={cn(buttonVariants(), "h-12 self-start px-8 text-[15px]")}>
            <Play size={16} className='fill-current' />
            {me ? t("daily_exercise.beat_score") : t("daily_exercise.play")}
          </Link>
        </div>

        {leaderboard.isLoading ? (
          <div className='flex max-w-md flex-[1_1_18rem] flex-col gap-1'>
            {Array.from({ length: DAILY_PODIUM_SIZE }, (_, i) => (
              <Skeleton key={i} className='h-14 w-full rounded-lg' />
            ))}
          </div>
        ) : leaderboard.isError ? (
          <p className='flex-[1_1_18rem] text-sm text-zinc-400'>
            {t("daily_exercise.board_error")}
          </p>
        ) : (board?.top?.length ?? 0) === 0 ? null : (
          <div className='min-w-0 max-w-md flex-[1_1_18rem]'>
            <ol className={BOARD}>
              {dailyPodium(board?.top ?? [], me).map((slot, i) =>
                slot ? (
                  <BoardRow
                    key={slot.entry.userId}
                    entry={slot.entry}
                    place={slot.place}
                    isMe={slot.entry.userId === uid}
                  />
                ) : (
                  <OpenRow key={`open-${i}`} place={i + 1} />
                ),
              )}
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
};
