import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { getDuelExercise } from "feature/duels/data/duelPool";
import type {
  DuelFeedEntry,
  DuelFeedPlayer,
  DuelOpponentRevealed,
  DuelView,
} from "feature/duels/types/duel.types";
import { formatRatingDelta } from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";

const RESULT_TEXT: Record<NonNullable<DuelView["result"]>, string> = {
  won: "text-emerald-400",
  lost: "text-zinc-400",
  draw: "text-zinc-300",
  void: "text-zinc-500",
};

const RecentDuelRow = ({ duel }: { duel: DuelView }) => {
  const { t } = useTranslation("duels");
  const result = duel.result ?? "void";
  const opponent = duel.opponent.revealed
    ? (duel.opponent as DuelOpponentRevealed)
    : null;
  const exercise = getDuelExercise(duel.exerciseId);
  const delta = duel.ratingDelta ?? 0;

  // Who never sent a run — the reason a walkover went the way it did.
  const note =
    result === "void"
      ? t("recent.nobody_played")
      : duel.me.attempts === 0
        ? t("recent.no_show_me")
        : opponent && opponent.attempts === 0
          ? t("recent.no_show_them")
          : null;

  return (
    <li>
      <Link
        href={{
          pathname: "/duels",
          query: { tab: "history", result: duel.id },
        }}
        shallow
        className='flex items-center gap-4 rounded-xl px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 hover:bg-zinc-900/60'>
        <span
          className={cn(
            "w-[4.5rem] shrink-0 text-sm font-semibold",
            RESULT_TEXT[result],
          )}>
          {t(`recent.${result}`)}
        </span>
        {opponent ? (
          <Avatar
            avatarURL={opponent.avatar || undefined}
            name={opponent.displayName}
            size='xs'
            className='shrink-0'
          />
        ) : (
          <span
            className='size-8 shrink-0 rounded-full bg-zinc-800'
            aria-hidden='true'
          />
        )}
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-semibold text-zinc-100'>
            {opponent?.displayName ?? t("active.anonymous")}
          </span>
          <span className='block truncate text-xs text-zinc-500'>
            {note ?? exercise?.title ?? duel.exerciseId}
          </span>
        </span>
        <span
          className={cn(
            "w-12 shrink-0 text-right font-teko text-2xl font-semibold tabular-nums leading-none",
            delta > 0 ? "text-emerald-400" : "text-zinc-500",
          )}>
          {result === "void" ? "—" : formatRatingDelta(delta)}
        </span>
      </Link>
    </li>
  );
};

/** How many of the app's latest duels the Duels tab shows. */
const LATEST_COUNT = 3;

const FeedAvatar = ({
  player,
  className,
}: {
  player: DuelFeedPlayer;
  className?: string;
}) => (
  <Avatar
    avatarURL={player.avatar || undefined}
    name={player.displayName}
    size='xs'
    className={cn("shrink-0", className)}
  />
);

const LatestDuelRow = ({
  entry,
  isOpenable,
}: {
  entry: DuelFeedEntry;
  /** The viewer played it and its result screen is still within reach. */
  isOpenable: boolean;
}) => {
  const { t } = useTranslation("duels");
  const [winner, loser] = entry.players;
  const isDraw = entry.kind === "draw";
  const exercise = getDuelExercise(entry.exerciseId);
  const rowClass = "flex items-center gap-4 rounded-xl px-3 py-3";

  const content = (
    <>
      <span className='flex shrink-0 items-center'>
        <FeedAvatar player={winner} />
        <FeedAvatar player={loser} className='-ml-2' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-semibold text-zinc-100'>
          {t(`feed.${entry.kind}`, {
            winner: winner.displayName,
            loser: loser.displayName,
          })}
        </span>
        <span className='block truncate text-xs text-zinc-500'>
          {exercise?.title ?? entry.exerciseId}
        </span>
      </span>
      <span className='shrink-0 font-teko text-2xl font-semibold tabular-nums leading-none text-zinc-500'>
        <span className={isDraw ? "text-zinc-300" : "text-zinc-50"}>
          {winner.bestScore}
        </span>
        {" : "}
        <span className={isDraw ? "text-zinc-300" : undefined}>
          {loser.bestScore}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {isOpenable ? (
        <Link
          href={{ pathname: "/duels", query: { result: entry.id } }}
          shallow
          className={cn(
            rowClass,
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 hover:bg-zinc-900/60",
          )}>
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
};

/**
 * The newest few decided duels across the app, under the slots: who beat whom,
 * on what, and by how much. A duel the viewer played opens its result screen.
 * Renders nothing until there is a duel to show.
 */
export const LatestDuels = ({
  feed,
  ownDuels,
}: {
  feed: DuelFeedEntry[];
  /** The viewer's settled duels — the ones with a result screen to open. */
  ownDuels: DuelView[];
}) => {
  const { t } = useTranslation("duels");
  if (feed.length === 0) return null;
  return (
    <section className='mt-6 flex flex-col gap-2'>
      <h2 className='px-1 text-base font-semibold text-zinc-100'>
        {t("recent.title")}
      </h2>
      <ul className='-mx-2 flex flex-col gap-0.5'>
        {feed.slice(0, LATEST_COUNT).map((entry) => (
          <LatestDuelRow
            key={entry.id}
            entry={entry}
            isOpenable={ownDuels.some((duel) => duel.id === entry.id)}
          />
        ))}
      </ul>
    </section>
  );
};

/** The History tab: settled duels, newest first, each one opening its result screen again. */
export const RecentDuels = ({ duels }: { duels: DuelView[] }) => {
  const { t } = useTranslation("duels");
  return (
    <section className='flex max-w-2xl flex-col gap-4'>
      <div className='flex items-baseline justify-between gap-3 px-1'>
        <h2 className='text-base font-semibold text-zinc-100'>
          {t("history.title")}
        </h2>
        {duels.length > 0 && (
          <span className='text-sm tabular-nums text-zinc-500'>
            {duels.length}
          </span>
        )}
      </div>
      {duels.length === 0 ? (
        <p className='px-1 text-sm text-zinc-400'>{t("recent.empty")}</p>
      ) : (
        <ul className='flex flex-col gap-0.5'>
          {duels.map((duel) => (
            <RecentDuelRow key={duel.id} duel={duel} />
          ))}
        </ul>
      )}
    </section>
  );
};
