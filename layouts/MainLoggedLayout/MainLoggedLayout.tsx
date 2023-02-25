import OldEffect from "components/OldEffect";
import MainLoggedWrapper from "./components/MainLoggedWrapper";
import UserHeader from "./components/UserHeader/UserHeader";
import DesktopHeaderWrapper from "./components/DesktopHeaderWrapper";
import MobileHeaderWrapper from "./components/MobileHeaderWrapper";

import LandingNav from "./components/LandingNav";

import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { NavPagesTypes } from "wrappers/AuthLayoutWrapper";
import { LandingNavObjectInterface } from "./components/LandingNav/LandingNav";

interface LandingLayoutProps {
  navigation: LandingNavObjectInterface;
  userStats: StatisticsDataInterface;
  userName: string;
  userAvatar?: string;
  pageId: NavPagesTypes;
  variant: "primary" | "secondary" | "landing";
  children: React.ReactNode;
}

const MainLoggedLayout = ({
  navigation,
  userStats,
  userName,
  userAvatar,
  children,
  pageId,
}: LandingLayoutProps) => {
  return (
    <main className='h-screen  bg-tertiary-bg font-sans 2xl:p-4 '>
      <div className='relative flex h-full w-full items-center justify-center '>
        <div className='relative flex h-full max-h-[calc(1200px_-_4rem)] w-full max-w-[2200px] flex-col overflow-y-auto  overflow-x-hidden  bg-main-opposed-bg scrollbar-hide'>
          <MainLoggedWrapper>
            <DesktopHeaderWrapper>
              <UserHeader
                avatar={userAvatar}
                userStats={userStats}
                userName={userName}
              />
            </DesktopHeaderWrapper>
            <MobileHeaderWrapper>
              <UserHeader
                avatar={userAvatar}
                userStats={userStats}
                userName={userName}
              />
            </MobileHeaderWrapper>
            <LandingNav
              leftSideLinks={navigation.leftSideLinks}
              rightSideLinks={navigation.rightSideLinks}
              pageId={pageId}
            />
            <div
              className={`z-20 m-4 mt-28 mb-12  flex w-full max-w-[1400px] flex-col justify-center bg-opacity-75 radius-default sm:p-2 xl:mt-36 `}>
              {children}
            </div>
          </MainLoggedWrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
