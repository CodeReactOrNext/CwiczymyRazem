import OldEffect from "components/OldEffect";
import Wrapper from "./components/Wrapper";
import Statistic, { StatisticProps } from "./components/Statistic";
import LandingNav, { LandingNavProps } from "./components/LandingNav";
import StatisticBar from "./components/StatisticBar";
import DesktopHeaderWrapper from "./components/UserHeader/DesktopHeaderWrapper";
import MobileHeaderWrapper from "./components/UserHeader/MobileHeaderWrapper";
import AchievementBox from "./components/Achievement/AchievementBox";
import Decoration from "./components/Decoration";
import { statisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { useTranslation } from "react-i18next";
import UserHeader from "./components/UserHeader/UserHeader";
import { convertMsToHM } from "helpers/timeConverter";
import { achievements, AchievementsInterface } from "data/achievements";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

interface LandingLayoutProps {
  statistics: StatisticProps[];
  navigation: LandingNavProps;
  userStats: statisticsDataInterface;
  userName: string;
}

export default function LandingLayout({
  statistics,
  navigation,
  userStats,
  userName,
}: LandingLayoutProps) {
  const { t } = useTranslation("landing");
  const { time, achievements } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;
  return (
    <main className='h-screen min-h-[600px] p-4 font-sans md:min-h-[900px] lg:p-8 '>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`bg-main-opposed-500"  relative flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-y-auto
          overflow-x-hidden scrollbar-hide`}>
          <Wrapper>
            <DesktopHeaderWrapper>
              <UserHeader userStats={userStats} userName={userName} />
            </DesktopHeaderWrapper>
            <MobileHeaderWrapper>
              <UserHeader userStats={userStats} userName={userName} />
            </MobileHeaderWrapper>

            <LandingNav
              leftSideLinks={navigation.leftSideLinks}
              rightSideLinks={navigation.rightSideLinks}
            />
            <div className=' relative z-40   m-4 mt-28 flex w-[90%]  max-w-[1080px] flex-col justify-center bg-second pb-4 '>
              <Decoration />
              <div className='grid-cols-2 grid-rows-2  items-center md:grid'>
                <div className=' order-2 row-span-2 my-5 flex justify-center '>
                  <StatisticBar
                    title={t("technique")}
                    value={convertMsToHM(time.technique)}
                    percent={Math.round((time.technique / totalTime) * 100)}
                  />
                  <StatisticBar
                    title={t("theory")}
                    value={convertMsToHM(time.theory)}
                    percent={Math.round((time.theory / totalTime) * 100)}
                  />
                  <StatisticBar
                    title={t("hearing")}
                    value={convertMsToHM(time.hearing)}
                    percent={Math.round((time.hearing / totalTime) * 100)}
                  />
                  <StatisticBar
                    title={t("creative")}
                    value={convertMsToHM(time.creativity)}
                    percent={Math.round((time.creativity / totalTime) * 100)}
                  />
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
                <AchievementWrapper userAchievements={achievements} />
              </div>
            </div>
          </Wrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
}
