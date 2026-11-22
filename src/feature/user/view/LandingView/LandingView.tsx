import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import ProfileLandingLayout from "feature/profile/ProfileLandingLayout";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

/** Mirrors ProfileLandingLayout: HomeHero (stage + stat strip), then the widget grid. */
const HomeSkeleton = () => (
  <PageShell aria-busy='true'>
    <div className='flex flex-col justify-end gap-5 px-5 pb-6 pt-[166px] md:h-64 md:max-w-[400px] md:justify-center md:gap-6 md:p-0 md:pl-10'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-8 w-64 max-w-full md:h-9' />
        <Skeleton className='h-4 w-40' />
      </div>
      <Skeleton className='h-12 w-full md:w-36' />
    </div>
    <div className='hidden h-[76px] items-center gap-10 bg-zinc-800/40 px-10 md:flex lg:gap-14'>
      <Skeleton className='h-8 w-28' />
      <Skeleton className='h-8 w-28' />
      <Skeleton className='h-8 w-28' />
    </div>
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-2", PAGE_CONTENT)}>
      <Skeleton variant='block' className='h-64' />
      <Skeleton variant='block' className='h-64' />
      <Skeleton variant='block' className='h-48 lg:col-span-2' />
    </div>
  </PageShell>
);

const LandingView = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

  return (
    <LoadingSwap isLoading={!userStats} skeleton={<HomeSkeleton />}>
      {() =>
        userStats && (
          <ProfileLandingLayout
            userStats={userStats}
            featSlot={<LogsBoxView />}
            userAuth={userAuth as string}
            userInfo={userInfo}
          />
        )
      }
    </LoadingSwap>
  );
};

export default LandingView;
