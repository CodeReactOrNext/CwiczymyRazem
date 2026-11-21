import { useQuery } from "@tanstack/react-query";
import {
  duelOverviewQueryKey,
  fetchDuelOverview,
} from "feature/duels/services/duels.service";
import { useLastKnown } from "lib/querySnapshot/useLastKnown";
import Link from "next/link";
import { useMemo } from "react";

/**
 * The player's duel rating for the dashboard's progress tile, laid out like the
 * Song tier badge beside it. Renders nothing until the first settled duel —
 * an unrated 1000 would only be noise.
 *
 * Shares the duels page's query key, but without its polling: the dashboard
 * only needs the number as it was when the page opened.
 */
export const DuelEloBadge = ({ uid }: { uid: string | null }) => {
  const { data } = useQuery({
    queryKey: duelOverviewQueryKey(uid),
    queryFn: fetchDuelOverview,
    enabled: !!uid,
    staleTime: 5 * 60_000,
  });

  // The rating from the last visit stands in until the overview answers, so
  // the badge is there from the first frame instead of popping in and pushing
  // its neighbours aside. Only these three fields are kept — the overview's
  // tickets and duels are not something to show stale.
  const fresh = useMemo(
    () =>
      data
        ? { isRated: data.isRated, rating: data.rating, rank: data.rank }
        : undefined,
    [data],
  );
  const shown = useLastKnown("duel-rating", uid, fresh);

  if (!shown?.isRated || shown.rating === undefined) return null;

  return (
    <Link
      href='/duels'
      className='relative flex flex-col items-center gap-1.5 rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/5'>
      <span className='text-xs font-semibold text-zinc-400'>
        ELO
      </span>
      <span className='flex h-14 items-center font-teko text-5xl font-semibold leading-none tabular-nums text-zinc-50'>
        {shown.rating}
      </span>
      {shown.rank ? (
        <span className='text-[11px] font-medium text-zinc-400'>
          #{shown.rank}
        </span>
      ) : null}
    </Link>
  );
};
