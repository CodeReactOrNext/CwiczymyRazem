import OldEffect from "components/OldEffect";
import Wrapper from "./components/Wrapper";
import UserHeader from "./components/UserHeader/UserHeader";
import DesktopHeaderWrapper from "./components/UserHeader/DesktopHeaderWrapper";
import MobileHeaderWrapper from "./components/UserHeader/MobileHeaderWrapper";
import LandingNav, { LandingNavObjectInterface } from "./components/LandingNav";

import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { NavPagesTypes } from "Hoc/AuthLayoutWrapper";

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
  variant,
  pageId,
}: LandingLayoutProps) => {
  return (
    <main className='h-screen min-h-[600px] p-4 font-sans md:min-h-[900px] lg:p-8  '>
      <div className='relative flex h-full w-full items-center justify-center '>
        <div className='relative flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-y-auto  overflow-x-hidden  bg-main-opposed-400 scrollbar-hide'>
          <Wrapper>
            <DesktopHeaderWrapper >
              <UserHeader
                avatar={userAvatar}
                userStats={userStats}
                userName={userName}
              />
            </DesktopHeaderWrapper>
            <MobileHeaderWrapper >
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
              className={` z-20 m-4  mt-28  flex w-full max-w-[1080px] flex-col justify-center bg-opacity-75 radius-default sm:w-[90%] sm:p-2 `}>
              {children}
            </div>
          </Wrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
