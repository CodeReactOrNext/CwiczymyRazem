import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import type { DuelOverview } from "feature/duels/types/duel.types";
import type { RankRowEntry } from "feature/duels/utils/duelScreens";
import { rankGap, rankNeighbours } from "feature/duels/utils/duelScreens";
import { useTranslation } from "hooks/useTranslation";
import { Fragment } from "react";

const RankRow = ({
  entry,
  showRecord = true,
}: {
  entry: RankRowEntry;
  showRecord?: boolean;
}) => {
  const { t } = useTranslation("duels");
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5",
        entry.isMe && "bg-zinc-800/70",
      )}>
      <span
        className={cn(
          "w-7 shrink-0 text-center font-teko text-xl font-semibold tabular-nums leading-none",
          entry.isMe ? "text-cyan-300" : "text-zinc-500",
        )}>
        {entry.place}
      </span>
      <Avatar
        avatarURL={entry.avatar || undefined}
        name={entry.displayName}
        size='xs'
        className='shrink-0'
      />
      <span className='min-w-0 flex-1'>
        <span
          className={cn(
            "block truncate text-sm",
            entry.isMe ? "font-semibold text-zinc-50" : "text-zinc-200",
          )}>
          {entry.displayName}
        </span>
        {showRecord && (
          <span className='block text-[11px] tabular-nums text-zinc-500'>
            {t("ranking.record", { wins: entry.wins, losses: entry.losses })}
          </span>
        )}
      </span>
      <span className='shrink-0 font-teko text-2xl font-semibold tabular-nums leading-none text-zinc-50'>
        {entry.rating}
      </span>
    </li>
  );
};

const Ellipsis = () => (
  <li
    className='px-3 py-0.5 text-center text-sm leading-none text-zinc-600'
    aria-hidden='true'>
    ⋯
  </li>
);

/** "101 ELO to place #6" — the one number that makes the next duel worth playing. */
const GapNote = ({ overview }: { overview: DuelOverview }) => {
  const { t } = useTranslation("duels");
  const gap = rankGap(overview);
  if (!gap) return null;
  return (
    <p className='text-sm text-zinc-400'>
      {t("rank.gap", { points: gap.points, place: gap.place })}
    </p>
  );
};

interface DuelRankingProps {
  overview: DuelOverview;
  uid: string | null;
  myName: string;
  myAvatar: string;
}

/** The Ranking tab: the ladder, your row lit, and how far the next place is. */
export const DuelRanking = ({
  overview,
  uid,
  myName,
  myAvatar,
}: DuelRankingProps) => {
  const { t } = useTranslation("duels");
  const listed: RankRowEntry[] = overview.ranking.map((entry, i) => ({
    key: entry.userId,
    displayName: entry.displayName,
    avatar: entry.avatar,
    rating: entry.rating,
    wins: entry.wins,
    losses: entry.losses,
    place: i + 1,
    isMe: entry.userId === uid,
  }));
  const isMeListed = listed.some((row) => row.isMe);
  const showMeBelow = overview.isRated && !!overview.rank && !isMeListed;

  return (
    <section className='flex max-w-2xl flex-col gap-4'>
      <div className='flex items-baseline justify-between gap-3 px-1'>
        <h2 className='text-base font-semibold text-zinc-100'>
          {t("ranking.title")}
        </h2>
        {overview.rankedPlayers > 0 && (
          <span className='text-sm tabular-nums text-zinc-500'>
            {t("ranking.players", { count: overview.rankedPlayers })}
          </span>
        )}
      </div>
      <div className='px-1'>
        <GapNote overview={overview} />
      </div>

      {listed.length === 0 ? (
        <p className='px-1 text-sm leading-relaxed text-zinc-400'>
          {t("ranking.empty")}
        </p>
      ) : (
        <ol className='flex flex-col gap-0.5'>
          {listed.map((entry) => (
            <RankRow key={entry.key} entry={entry} />
          ))}
          {showMeBelow && (
            <>
              <Ellipsis />
              <RankRow
                entry={{
                  key: uid ?? "me",
                  displayName: myName,
                  avatar: myAvatar,
                  rating: overview.rating,
                  wins: overview.wins,
                  losses: overview.losses,
                  place: overview.rank!,
                  isMe: true,
                }}
              />
            </>
          )}
        </ol>
      )}
    </section>
  );
};

interface DuelRankPeekProps extends DuelRankingProps {
  onOpenRanking: () => void;
}

/** The side panel's slice of the ladder: the places around you, Duolingo-league style. */
export const DuelRankPeek = ({
  overview,
  uid,
  myName,
  myAvatar,
  onOpenRanking,
}: DuelRankPeekProps) => {
  const { t } = useTranslation("duels");
  const rows = rankNeighbours(overview, uid, {
    displayName: myName,
    avatar: myAvatar,
  });

  return (
    <section className='flex flex-col gap-3 rounded-2xl bg-zinc-900/60 p-5'>
      <h2 className='text-base font-semibold text-zinc-100'>
        {t("rank.peek_title")}
      </h2>
      {overview.isRated ? (
        <GapNote overview={overview} />
      ) : (
        <p className='text-sm leading-relaxed text-zinc-400'>
          {t("rating.unrated")}
        </p>
      )}
      {rows.length > 0 && (
        <ol className='-mx-2 flex flex-col gap-0.5'>
          {rows.map((entry, i) => (
            <Fragment key={entry.key}>
              {/* Places skipped between two rows (you, far below the list). */}
              {i > 0 && rows[i - 1].place + 1 < entry.place && <Ellipsis />}
              <RankRow entry={entry} showRecord={false} />
            </Fragment>
          ))}
        </ol>
      )}
      <Button variant='ghost' className='h-10 w-full' onClick={onOpenRanking}>
        {t("rank.full")}
      </Button>
    </section>
  );
};
