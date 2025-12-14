import { HeroView } from "feature/hero/HeroView";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const ProfileOverviewPage = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);

  return userStats ? (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={(t as any)("profile")}
      variant='secondary'>
      <div className='relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-950/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl backdrop-blur-xl'>
        <div className='from-red-600/8 to-red-500/8 absolute inset-0 -z-10 bg-gradient-to-br via-transparent'></div>

        <div className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_75%,rgba(239,68,68,0.08)_0%,transparent_50%)] opacity-25'></div>

        <div className='relative border-b border-white/10 p-6'>
          <h1 className='text-center font-display text-2xl font-semibold tracking-tight text-white'>
            {(t as any)("statistics", "Statistics")}
          </h1>
          <div className='mx-auto mt-2 h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent'></div>
        </div>

        <NavigationCards />

        <div className='relative p-6'>
          <div className='absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5'></div>
          <LogsBoxView />
        </div>
      </div>
    </AuthLayoutWrapper>
  ) : (
    <HeroView />
  );
};

export default ProfileOverviewPage;
