import { Skeleton } from "assets/components/ui/skeleton";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { Music2 } from "lucide-react";

import { WidgetHeader, WidgetLink } from "./WidgetHeader";

/**
 * The song board's three counters and the tier. `SongLearningStats` draws its
 * own cards, so this is a label above them rather than a card around them —
 * a card inside a card is exactly what the phone layout must not do.
 */
export const SongsWidget = () => {
  const { userAuth } = useDashboardData();
  const { songs, isLoading, isError } = useUserSongs(userAuth);

  return (
    <div>
      <WidgetHeader
        icon={Music2}
        title='Songs'
        className='mb-3 px-1'
        action={<WidgetLink href='/songs?view=board'>Song board</WidgetLink>}
      />

      {isError ? (
        <p className='rounded-lg bg-zinc-900/40 p-4 text-sm text-zinc-400'>
          Couldn&apos;t load your songs right now.
        </p>
      ) : isLoading || !songs ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-32 rounded-lg' />
          ))}
        </div>
      ) : (
        <SongLearningStats userSongs={songs} />
      )}
    </div>
  );
};
