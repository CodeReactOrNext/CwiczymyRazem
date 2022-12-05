import OldEffect from "components/OldEffect";
import Wrapper from "./components/Wrapper";
import Statistic, { StatisticProps } from "./components/Statistic";
import LandingNav, { LandingNavProps } from "./components/LandingNav";
import StatisticBar from "./components/StatisticBar";
import DesktopHeaderWrapper from "./components/UserHeader/DesktopHeaderWrapper";
import MobileHeaderWrapper from "./components/UserHeader/MobileHeaderWrapper";
import AchievementBox from "./components/AchievementBox";

import Decoration from "./components/Decoration";
import { statisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { useTranslation } from "react-i18next";
import UserHeader from "./components/UserHeader/UserHeader";

interface LandingLayoutProps {
  statistics: StatisticProps[];
  navigation: LandingNavProps;
  userStats: statisticsDataInterface;
}

export default function LandingLayout({
  statistics,
  navigation,
  userStats,
}: LandingLayoutProps) {
  const { t } = useTranslation("landing");
  const {
    points,
    sessionCount,
    habitsCount,
    achivments,
    time,
    dayWithoutBreak,
    maxPoints,
  } = userStats;
  return (
    <main className='h-screen min-h-[600px] p-4 font-sans md:min-h-[900px] lg:p-8 '>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`bg-main-opposed-500"  relative flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-y-auto
          overflow-x-hidden scrollbar-hide`}>
          <Wrapper>
            <DesktopHeaderWrapper>
              <MobileHeaderWrapper>
                <UserHeader />
              </MobileHeaderWrapper>
            </DesktopHeaderWrapper>
    
            <LandingNav
              leftSideLinks={navigation.leftSideLinks}
              rightSideLinks={navigation.rightSideLinks}
            />
            <div className=' relative z-40   m-4 mt-28 flex w-[90%]  max-w-[1080px] flex-col justify-center bg-second pb-4 '>
              <Decoration />
              <div className='grid-cols-2 grid-rows-2 items-center md:grid'>
                <div className=' order-2 row-span-2 my-5 flex justify-center '>
                  <StatisticBar title={t("technique")} value={time.technique} />
                  <StatisticBar title={t("theory")} value={time.theory} />
                  <StatisticBar title={t("hearing")} value={time.hearing} />
                  <StatisticBar title={t("creative")} value={time.creativity} />
                </div>
                <div className=' row-cols-1  order-1'>
                  {statistics.map(({ Icon, description, value }, index) => (
                    <Statistic
                      key={index}
                      Icon={Icon}
                      description={description}
                      value={value}
                    />
                  ))}
                </div>
                <div className=' row-cols-1 order-2 '>
                  <AchievementBox rarity='common' />
                  <AchievementBox rarity='rare' />
                  <AchievementBox rarity='veryRare' />
                </div>
              </div>
            </div>
          </Wrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
}
