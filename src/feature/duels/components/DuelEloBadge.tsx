import { useQuery } from "@tanstack/react-query";
import {
  duelOverviewQueryKey,
  fetchDuelOverview,
} from "feature/duels/services/duels.service";
import Link from "next/link";

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

  if (!data?.isRated || data.rating === undefined) return null;

  return (
    <Link
      href='/duels'
      className='relative flex flex-col items-center gap-1.5 rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/5'>
      <span className='text-xs font-semibold tracking-widest text-zinc-400'>
        ELO
      </span>
      <span className='flex h-14 items-center font-teko text-5xl font-semibold leading-none tabular-nums text-zinc-50'>
        {data.rating}
      </span>
      {data.rank ? (
        <span className='text-[11px] font-medium text-zinc-400'>
          #{data.rank}
        </span>
      ) : null}
    </Link>
  );
};
