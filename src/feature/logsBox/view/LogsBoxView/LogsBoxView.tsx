import { Card } from "assets/components/ui/card";
import { firebaseGetLogsStream } from "feature/logs/services/getLogsStream.service";
import { firebaseGetTodayDonationsStream } from "feature/logs/services/getTodayDonationsStream.service";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { mergeTodayDonations } from "feature/logs/utils/pinnedDonations";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import LogsBoxLayout from "layouts/LogsBoxLayout";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

const SkeletonLogRow = () => (
  <div className='my-4 flex flex-col lg:flex-row lg:items-center bg-main-opposed-bg p-3 sm:p-4 rounded-xl gap-3'>
    {/* Timestamp */}
    <div className='lg:mr-4 lg:pr-4 lg:border-r-2 border-main-opposed-400'>
      <div className='h-3 w-24 rounded bg-white/10' />
    </div>

    {/* Main content */}
    <div className='flex flex-1 flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4 w-full min-w-0'>
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-full bg-white/10' />
        <div className='h-3 w-20 rounded bg-white/10' />
        <div className='h-3 w-10 rounded bg-white/10' />
      </div>
      <div className='flex items-center gap-3 lg:ml-auto'>
        <div className='h-5 w-40 rounded-md bg-white/[0.06]' />
        <div className='h-7 w-14 rounded-full bg-white/[0.06]' />
      </div>
    </div>
  </div>
);

const LogsBoxSkeleton = ({ className = "" }: { className?: string }) => (
  <Card
    className={`relative m-auto flex ${
      !className.includes("h-") ? "sm:h-[650px] lg:h-[800px]" : ""
    } font-openSans flex-col p-1 ${
      className.includes("border-none") ? "pb-24" : "pb-3"
    } text-xs leading-5 rounded-xl xs:p-5 xs:pb-0 md:mt-0 lg:text-sm xl:w-[100%] ${className}`}>
    {/* Tab bar */}
    <div className='left-0 top-0 flex flex-row justify-around gap-4 mb-2'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='h-7 w-28 rounded-lg bg-white/[0.06]' />
      ))}
    </div>

    {/* Rows */}
    <div className='overflow-hidden mb-2 animate-pulse sm:h-full'>
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonLogRow key={i} />
      ))}
    </div>
  </Card>
);

const LOGS_PAGE_SIZE = 20;

const LogsBoxView = ({ className }: { className?: string }) => {
  const [logs, setLogs] = useState<AnyFirebaseLog[] | null>(null);
  const [todayDonations, setTodayDonations] = useState<AnyFirebaseLog[]>([]);
  const [logsLimit, setLogsLimit] = useState(LOGS_PAGE_SIZE);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  const userStats = useAppSelector(selectCurrentUserStats);
  const currentUserId = useAppSelector(selectUserAuth);
  const userAchievement = userStats?.achievements;

  useEffect(() => {
    const unsubscribe = firebaseGetLogsStream((logsData) => {
      return setLogs(logsData);
    }, logsLimit);

    return () => unsubscribe();
  }, [logsLimit]);

  // Streamed apart from the page above: a donation is meant to hold the top of the feed until
  // midnight, which it can't do once the newest-20 window has scrolled past it.
  useEffect(() => {
    const unsubscribe = firebaseGetTodayDonationsStream(setTodayDonations);

    return () => unsubscribe();
  }, []);

  // Firestore doesn't return a total count — if we got a full page, assume there's more below
  // the window. The feed needs this on its own, and not just as "is the button showing": the
  // window keeps cutting its last group in half long after "Show more" has bowed out. Read off
  // the page alone, so the donations spliced in below can't be mistaken for a fuller window.
  const hasOlderLogs = (logs?.length ?? 0) >= logsLimit;

  // Only offer "Show more" once — after that the button disappears even if more logs remain.
  const hasMoreLogs = !hasLoadedMore && hasOlderLogs;

  const feedLogs = useMemo(
    () => (logs ? mergeTodayDonations(logs, todayDonations) : null),
    [logs, todayDonations],
  );

  return feedLogs && userAchievement && currentUserId ? (
    <LogsBoxLayout
      logs={feedLogs}
      userAchievements={userAchievement}
      currentUserId={currentUserId}
      className={className}
      hasOlderLogs={hasOlderLogs}
      hasMoreLogs={hasMoreLogs}
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
