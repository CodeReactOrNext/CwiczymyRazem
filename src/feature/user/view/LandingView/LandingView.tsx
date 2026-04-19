import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import ProfileLandingLayout from "feature/profile/ProfileLandingLayout";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useAppSelector } from "store/hooks";

const LandingView = () => {

  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

  if (!userStats ) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <PageLoadingLayout />
      </div>
    );
  }

  return (
    <ProfileLandingLayout
      userStats={userStats}
      featSlot={<LogsBoxView />}
      userAuth={userAuth as string}
      userInfo={userInfo}
    />
  );
};

export default LandingView;
