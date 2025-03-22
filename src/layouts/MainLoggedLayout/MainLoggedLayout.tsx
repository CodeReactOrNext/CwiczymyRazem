import OldEffect from "components/OldEffect";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import type { StatisticsDataInterface } from "types/api.types";
import type { NavPagesTypes } from "wrappers/AuthLayoutWrapper";

import DesktopHeaderWrapper from "./components/DesktopHeaderWrapper";
import LandingNav from "./components/LandingNav";
import type { LandingNavObjectInterface } from "./components/LandingNav/LandingNav";
import MainLoggedWrapper from "./components/MainLoggedWrapper";
import MobileHeaderWrapper from "./components/MobileHeaderWrapper";
import UserHeader from "./components/UserHeader/UserHeader";

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
        <div className='relative flex h-full  w-full max-w-[2200px] flex-col overflow-y-auto  overflow-x-hidden  bg-main-opposed-bg scrollbar-hide'>
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
              className={`z-20 m-4 mb-12 mt-10  flex w-full max-w-[1400px] flex-col justify-center bg-opacity-75 radius-default sm:p-2 xl:mt-[170px] `}>
              <AnimatePresence mode='wait'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className='relative z-10 col-span-2'>
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </MainLoggedWrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
};

export default MainLoggedLayout;
