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
  pageId,
}: LandingLayoutProps) => {
  return (
    <main className='h-screen min-h-[600px] bg-tertiary-bg p-4 font-sans md:min-h-[900px] lg:p-8  '>
      <div className='relative flex h-full w-full items-center justify-center '>
        <div className='relative flex h-full max-h-[calc(1300px_-_4rem)] w-full max-w-[2200px] flex-col overflow-y-auto  overflow-x-hidden  bg-main-opposed-bg scrollbar-hide'>
          <Wrapper>
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
          </Wrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
