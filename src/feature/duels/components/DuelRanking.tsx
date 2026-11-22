import { Button } from "assets/components/ui/button";
import { EmptyState } from "components/EmptyState/EmptyState";
import type { DuelOverview } from "feature/duels/types/duel.types";
import type { RankRowEntry } from "feature/duels/utils/duelScreens";
import { rankGap, rankNeighbours } from "feature/duels/utils/duelScreens";
import { RankRow } from "feature/leadboard/components/RankRow";
import { useTranslation } from "hooks/useTranslation";
import { Trophy } from "lucide-react";
import { Fragment } from "react";

/** One place on the ELO ladder, in the app's shared ranking row. */
const DuelRankRow = ({
  entry,
  showRecord = true,
}: {
  entry: RankRowEntry;
  showRecord?: boolean;
}) => {
  const { t } = useTranslation("duels");
  return (
    <RankRow
      place={entry.place}
      nick={entry.displayName}
      avatarUrl={entry.avatar}
      // The player's own row falls back to "me" when signed out — no profile.
      profileId={entry.key === "me" ? undefined : entry.key}
      isCurrentUser={entry.isMe}
      score={entry.rating}
      density={showRecord ? "default" : "compact"}
      meta={
        showRecord && (
          <span className='tabular-nums'>
            {t("ranking.record", { wins: entry.wins, losses: entry.losses })}
          </span>
        )
      }
    />
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
        // A plain icon: the duels page already has Kostek on its empty seat.
        <EmptyState
          size='compact'
          icon={<Trophy />}
          title={t("ranking.empty")}
        />
      ) : (
        <ol className='flex flex-col gap-1.5'>
          {listed.map((entry) => (
            <DuelRankRow key={entry.key} entry={entry} />
          ))}
          {showMeBelow && (
            <>
              <Ellipsis />
              <DuelRankRow
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
    <section className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-5 sm:p-6'>
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
        <ol className='flex flex-col gap-1.5'>
          {rows.map((entry, i) => (
            <Fragment key={entry.key}>
              {/* Places skipped between two rows (you, far below the list). */}
              {i > 0 && rows[i - 1].place + 1 < entry.place && <Ellipsis />}
              <DuelRankRow entry={entry} showRecord={false} />
            </Fragment>
          ))}
        </ol>
      )}
      <Button variant='ghost' size='lg' className='w-full' onClick={onOpenRanking}>
        {t("rank.full")}
      </Button>
    </section>
  );
};
