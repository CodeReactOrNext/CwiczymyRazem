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
import { CalendarClock, Clock, Play } from "lucide-react";
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
 * Places sit side by side while they fit (full or half width) and stack on
 * phones. The tiles only get a background from `sm` up: on a phone the card is
 * the one level of panel, and the places read as a plain list inside it — the
 * negative margin puts place numbers back on the card's text edge, while the
 * rows keep their padding for the "you" highlight.
 */
const PODIUM_GRID =
  "-mx-3 grid grid-cols-1 gap-1 sm:mx-0 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] sm:gap-3";
const TILE = "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 sm:px-4 sm:py-3";

const PlaceNumber = ({ place }: { place: number }) => (
  <span className='w-5 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-400'>
    {place}
  </span>
);

const PodiumTile = ({
  entry,
  place,
  isMe,
}: {
  entry: DailyExerciseEntry;
  place: number;
  isMe: boolean;
}) => (
  <li className={cn(TILE, isMe ? "bg-cyan-500/10" : "sm:bg-zinc-800/40")}>
    <PlaceNumber place={place} />
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
        {formatScore(entry.score)} · {entry.accuracy}%
      </span>
    </span>
  </li>
);

const OpenTile = ({ place }: { place: number }) => {
  const { t } = useTranslation("dashboard");
  return (
    <li className={cn(TILE, "sm:bg-zinc-800/20")}>
      <PlaceNumber place={place} />
      <span className='size-8 shrink-0 rounded-full bg-zinc-800/80' />
      <span className='min-w-0'>
        <span className='block truncate text-sm font-semibold text-zinc-400'>
          {t("daily_exercise.open_spot")}
        </span>
        <span className='block truncate text-xs text-zinc-400'>
          {t("daily_exercise.open_spot_hint")}
        </span>
      </span>
    </li>
  );
};

/**
 * One exercise, the same for everyone, for one UTC day — scored by pitch
 * detection. The card names the exercise and what #1 wins, with the button
 * and the time left beside it, and the podium underneath. A run counts whenever the
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
        <WidgetHeader icon={CalendarClock} title={t("daily_exercise.title")} />
        <p className='text-sm text-zinc-400'>{t("daily_exercise.none_today")}</p>
      </Card>
    );
  }

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader icon={CalendarClock} title={t("daily_exercise.title")} />

      <div className='flex flex-wrap items-center gap-4'>
        {board?.prize ? (
          <DailyPrizeArt prize={board.prize} />
        ) : (
          <div className='size-14 shrink-0 rounded bg-zinc-800' />
        )}

        <div className='min-w-0 flex-[1_1_14rem]'>
          <h4 className='text-lg font-semibold text-zinc-100'>
            {localizeExercise(exercise).title}
          </h4>
          {board?.prize && (
            <p className='mt-1 text-sm text-zinc-400'>
              {t("daily_exercise.wins")} <DailyPrizeName prize={board.prize} />
            </p>
          )}
        </div>

        <div className='flex shrink-0 items-center gap-4'>
          <span className='flex items-center gap-1.5 text-xs tabular-nums text-zinc-400'>
            <Clock size={12} className='text-zinc-500' />
            {t("daily_exercise.new_in", { time: formatTimeLeft(msLeft) })}
          </span>
          <Link
            href={`/practice/exercise/${exercise.id}`}
            className={cn(buttonVariants(), "h-11 px-5")}>
            <Play size={16} className='fill-current' />
            {me ? t("daily_exercise.beat_score") : t("daily_exercise.play")}
          </Link>
        </div>
      </div>

      {leaderboard.isLoading ? (
        <div className={cn(PODIUM_GRID, "mt-6")}>
          {Array.from({ length: DAILY_PODIUM_SIZE }, (_, i) => (
            <Skeleton key={i} className='h-14 w-full rounded-lg' />
          ))}
        </div>
      ) : leaderboard.isError ? (
        <p className='mt-6 text-sm text-zinc-400'>{t("daily_exercise.board_error")}</p>
      ) : (
        <ol className={cn(PODIUM_GRID, "mt-6")}>
          {dailyPodium(board?.top ?? [], me).map((slot, i) =>
            slot ? (
              <PodiumTile
                key={slot.entry.userId}
                entry={slot.entry}
                place={slot.place}
                isMe={slot.entry.userId === uid}
              />
            ) : (
              <OpenTile key={`open-${i}`} place={i + 1} />
            ),
          )}
        </ol>
      )}
    </Card>
  );
};
