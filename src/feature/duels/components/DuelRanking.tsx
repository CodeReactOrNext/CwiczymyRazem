import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import type {
  DuelOverview,
  DuelRankingEntry,
} from "feature/duels/types/duel.types";
import { useTranslation } from "hooks/useTranslation";
import { Trophy } from "lucide-react";

interface DuelRankingProps {
  overview: DuelOverview;
  uid: string | null;
  myName: string;
  myAvatar: string;
}

const RankRow = ({
  entry,
  place,
  isMe,
}: {
  entry: Pick<
    DuelRankingEntry,
    "displayName" | "avatar" | "rating" | "wins" | "losses"
  >;
  place: number;
  isMe: boolean;
}) => {
  const { t } = useTranslation("duels");
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2",
        isMe && "bg-cyan-500/10",
      )}>
      <span
        className={cn(
          "w-7 shrink-0 text-center font-teko text-xl font-semibold tabular-nums leading-none",
          isMe ? "text-cyan-300" : "text-zinc-500",
        )}>
        {place}
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
            isMe ? "font-semibold text-cyan-300" : "text-zinc-200",
          )}>
          {entry.displayName}
        </span>
        <span className='block text-[11px] tabular-nums text-zinc-500'>
          {t("ranking.record", { wins: entry.wins, losses: entry.losses })}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 font-teko text-2xl font-semibold tabular-nums leading-none",
          isMe ? "text-cyan-200" : "text-zinc-100",
        )}>
        {entry.rating}
      </span>
    </li>
  );
};

/** The ELO ladder — top places, and the player's own row when it falls below them. */
export const DuelRanking = ({
  overview,
  uid,
  myName,
  myAvatar,
}: DuelRankingProps) => {
  const { t } = useTranslation("duels");
  const isMeListed = overview.ranking.some((entry) => entry.userId === uid);
  const showMeBelow = overview.isRated && !!overview.rank && !isMeListed;

  return (
    <Card className='p-5 sm:p-6'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='flex items-center gap-2 text-base font-semibold text-zinc-100'>
          <Trophy size={16} className='text-zinc-400' />
          {t("ranking.title")}
        </h2>
        {overview.rankedPlayers > 0 && (
          <span className='text-xs tabular-nums text-zinc-400'>
            {t("ranking.players", { count: overview.rankedPlayers })}
          </span>
        )}
      </div>

      {overview.ranking.length === 0 ? (
        <p className='mt-4 text-sm leading-relaxed text-zinc-400'>
          {t("ranking.empty")}
        </p>
      ) : (
        // Rows keep their padding for the "you" highlight; the negative margin
        // puts the place numbers back on the card's text edge.
        <ol className='-mx-3 mt-4 space-y-0.5'>
          {overview.ranking.map((entry, i) => (
            <RankRow
              key={entry.userId}
              entry={entry}
              place={i + 1}
              isMe={entry.userId === uid}
            />
          ))}
          {showMeBelow && (
            <>
              <li
                className='px-3 py-1 text-center text-sm leading-none text-zinc-600'
                aria-hidden='true'>
                ⋯
              </li>
              <RankRow
                entry={{
                  displayName: myName,
                  avatar: myAvatar,
                  rating: overview.rating,
                  wins: overview.wins,
                  losses: overview.losses,
                }}
                place={overview.rank!}
                isMe
              />
            </>
          )}
        </ol>
      )}
    </Card>
  );
};
