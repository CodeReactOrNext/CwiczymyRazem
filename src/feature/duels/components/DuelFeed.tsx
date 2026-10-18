import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { formatDistanceStrict } from "date-fns";
import { getDuelExercise } from "feature/duels/data/duelPool";
import type {
  DuelFeedEntry,
  DuelFeedPlayer,
} from "feature/duels/types/duel.types";
import { formatRatingDelta } from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale, useIntlLocale } from "lib/i18n/dateLocale";
import { Interpolate } from "lib/i18n/Interpolate";
import { Swords } from "lucide-react";

interface DuelFeedProps {
  feed: DuelFeedEntry[];
  now: number;
}

const Name = ({ player }: { player: DuelFeedPlayer }) => (
  <span className='font-semibold text-zinc-100'>{player.displayName}</span>
);

const FeedRow = ({ entry, now }: { entry: DuelFeedEntry; now: number }) => {
  const { t } = useTranslation("duels");
  const dateLocale = useDateFnsLocale();
  const intlLocale = useIntlLocale();
  const [first, second] = entry.players;
  const exercise = getDuelExercise(entry.exerciseId);
  const isDecided = entry.kind !== "void";
  // The winner's gain — or, on a draw, how the first side moved.
  const delta = first.ratingAfter - first.ratingBefore;
  const score = (value: number) => value.toLocaleString(intlLocale);

  return (
    <li className='-mx-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-zinc-800/30'>
      <div className='flex min-w-0 flex-[1_1_14rem] items-center gap-3'>
        <span className='flex shrink-0 -space-x-2' aria-hidden='true'>
          <Avatar
            avatarURL={first.avatar || undefined}
            name={first.displayName}
            size='xs'
            className='relative z-10 rounded-full ring-2 ring-zinc-900'
          />
          <Avatar
            avatarURL={second.avatar || undefined}
            name={second.displayName}
            size='xs'
            className='rounded-full ring-2 ring-zinc-900'
          />
        </span>
        <div className='min-w-0'>
          <p className='truncate text-sm text-zinc-400'>
            <Interpolate
              text={t(`feed.${entry.kind}`)}
              values={{
                winner: <Name player={first} />,
                loser: <Name player={second} />,
              }}
            />
          </p>
          <p className='truncate text-xs text-zinc-500'>
            {exercise?.title ?? entry.exerciseId}
            <span className='text-zinc-700'> · </span>
            {formatDistanceStrict(entry.settledAt, now, {
              addSuffix: true,
              locale: dateLocale,
            })}
          </p>
        </div>
      </div>

      {isDecided && (
        <p className='w-28 shrink-0 text-right text-sm tabular-nums'>
          <span className='font-semibold text-zinc-50'>
            {score(first.bestScore)}
          </span>
          <span className='text-zinc-600'> : </span>
          <span
            className={cn(
              "font-semibold",
              entry.kind === "draw" ? "text-zinc-50" : "text-zinc-500",
            )}>
            {score(second.bestScore)}
          </span>
        </p>
      )}

      <span
        className={cn(
          "ml-auto w-14 shrink-0 text-right font-teko text-2xl font-semibold tabular-nums leading-none",
          delta > 0 ? "text-emerald-400" : "text-zinc-500",
        )}>
        {isDecided ? formatRatingDelta(delta) : "—"}
      </span>
    </li>
  );
};

/**
 * Other players' settled duels, newest first — who beat whom, and by how much.
 * Your own are in Recent duels; with nothing else to show, the section stays out.
 */
export const DuelFeed = ({ feed, now }: DuelFeedProps) => {
  const { t } = useTranslation("duels");
  if (feed.length === 0) return null;
  return (
    <Card className='p-5 sm:p-7'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='flex items-center gap-2 text-base font-semibold text-zinc-100'>
          <Swords size={16} className='text-zinc-400' />
          {t("feed.title")}
        </h2>
        <span className='text-xs tabular-nums text-zinc-400'>
          {t("feed.latest", { count: feed.length })}
        </span>
      </div>
      <ul className='mt-5 space-y-1'>
        {feed.map((entry) => (
          <FeedRow key={entry.id} entry={entry} now={now} />
        ))}
      </ul>
    </Card>
  );
};
