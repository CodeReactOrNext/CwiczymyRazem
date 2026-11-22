import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { firebaseGetLogsStream } from "feature/logs/services/getLogsStream.service";
import { firebaseGetPinnedDonationsStream } from "feature/logs/services/getPinnedDonationsStream.service";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { mergePinnedDonations } from "feature/logs/utils/pinnedDonations";
import { selectUserAuth } from "feature/user/store/userSlice";
import LogsBoxLayout from "layouts/LogsBoxLayout";
import { panelHeightClass } from "layouts/LogsBoxLayout/logsBoxPanel";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

const SkeletonLogRow = () => (
  <div className='my-4 flex items-center gap-3 rounded-lg bg-zinc-900/40 p-3 sm:p-4'>
    <Skeleton className='h-10 w-10 shrink-0 rounded-lg' />
    <div className='flex min-w-0 flex-1 flex-col gap-2'>
      <Skeleton className='h-3 w-32' />
      <Skeleton className='h-3 w-48 max-w-full' />
    </div>
    <Skeleton className='hidden h-7 w-14 sm:block' />
  </div>
);

export const LogsBoxSkeleton = ({ className = "" }: { className?: string }) => (
  <Card
    // Same box the loaded panel gets, so the feed doesn't jump when it arrives.
    className={`relative m-auto flex ${panelHeightClass({
      tab: "logs",
      hasOwnHeight: className.includes("h-"),
    })} flex-col p-1 ${
      className.includes("border-none") ? "pb-24" : "pb-3"
    } rounded-lg text-xs leading-5 xs:p-5 xs:pb-0 md:mt-0 lg:text-sm w-full min-w-0 ${className}`}>
    {/* Tab bar */}
    <div className='left-0 top-0 mb-2 flex flex-row justify-around gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className='h-7 w-28' />
      ))}
    </div>

    {/* Rows */}
    <div className='mb-2 min-h-0 flex-1 overflow-hidden' aria-busy='true'>
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonLogRow key={i} />
      ))}
    </div>
  </Card>
);

const LOGS_PAGE_SIZE = 20;

interface LogsBoxViewProps {
  className?: string;
  /** Fills a box it doesn't own and scrolls inside it — see `LogsBoxLayout`. */
  contained?: boolean;
}

// What the feed last showed, kept for the lifetime of the tab. The feed is
// unmounted with every page change, and the stream needs a round trip before
// its first answer — without this, each return to Home redrew the skeleton
// over a list the player was reading a moment ago.
const lastFeed: {
  uid: string | null;
  logs: AnyFirebaseLog[] | null;
  pinned: AnyFirebaseLog[];
} = { uid: null, logs: null, pinned: [] };

const LogsBoxView = ({ className, contained = false }: LogsBoxViewProps) => {
  const currentUserId = useAppSelector(selectUserAuth);
  const hasLastFeed = !!currentUserId && lastFeed.uid === currentUserId;

  const [logs, setLogs] = useState<AnyFirebaseLog[] | null>(() =>
    hasLastFeed ? lastFeed.logs : null,
  );
  const [pinnedDonations, setPinnedDonations] = useState<AnyFirebaseLog[]>(
    () => (hasLastFeed ? lastFeed.pinned : []),
  );
  const [logsLimit, setLogsLimit] = useState(LOGS_PAGE_SIZE);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseGetLogsStream((logsData) => {
      // Only the first page is kept: a return visit opens on the first page too.
      if (logsLimit === LOGS_PAGE_SIZE) {
        lastFeed.uid = currentUserId;
        lastFeed.logs = logsData;
      }
      return setLogs(logsData);
    }, logsLimit);

    return () => unsubscribe();
  }, [logsLimit, currentUserId]);

  // Streamed apart from the page above: a donation is meant to hold the top of the feed for 24
  // hours, which it can't do once the newest-20 window has scrolled past it.
  useEffect(() => {
    const unsubscribe = firebaseGetPinnedDonationsStream((donations) => {
      lastFeed.pinned = donations;
      setPinnedDonations(donations);
    });

    return () => unsubscribe();
  }, []);

  // Firestore doesn't return a total count — if we got a full page, assume there's more below
  // the window. The feed needs this on its own, and not just as "is the button showing": the
  // window keeps cutting its last group in half long after "Show more" has bowed out. Read off
  // the page alone, so the donations spliced in below can't be mistaken for a fuller window.
  const hasOlderLogs = (logs?.length ?? 0) >= logsLimit;

  // Only offer "Show more" once — after that the button disappears even if more logs remain.
  const hasMoreLogs = !hasLoadedMore && hasOlderLogs;

  // The separately-streamed donations are spliced back in here — without this the feed can only
  // pin what its own newest-20 window still happens to carry, and the card drops off the top
  // within the hour.
  const feedLogs = useMemo(
    () => (logs ? mergePinnedDonations(logs, pinnedDonations) : null),
    [logs, pinnedDonations],
  );

  return feedLogs && currentUserId ? (
    <LogsBoxLayout
      logs={feedLogs}
      currentUserId={currentUserId}
      className={className}
      hasOlderLogs={hasOlderLogs}
      hasMoreLogs={hasMoreLogs}
      contained={contained}
      onLoadMoreLogs={() => {
        setHasLoadedMore(true);
        setLogsLimit((prev) => prev + LOGS_PAGE_SIZE);
      }}
    />
  ) : (
    <LogsBoxSkeleton className={className} />
  );
};

export default LogsBoxView;
