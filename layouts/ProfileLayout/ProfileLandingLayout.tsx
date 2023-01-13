import { useTranslation } from "react-i18next";

import OldEffect from "components/OldEffect";
import Wrapper from "./components/Wrapper";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import UserHeader from "./components/UserHeader/UserHeader";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import LandingNav, { LandingNavProps } from "./components/LandingNav";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";
import DesktopHeaderWrapper from "./components/UserHeader/DesktopHeaderWrapper";
import MobileHeaderWrapper from "./components/UserHeader/MobileHeaderWrapper";

import { convertMsToHM } from "utils/converter/timeConverter";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  navigation: LandingNavProps;
  userStats: StatisticsDataInterface;
  userName: string;
  userAvatar?: string;
  featSlot: React.ReactNode;
}

const LandingLayout = ({
  statsField,
  navigation,
  userStats,
  userName,
  userAvatar,
  featSlot,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
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
            />
            <div className='z-20 m-4 mt-28 flex w-[90%]  max-w-[1080px] flex-col justify-center bg-second pb-4 '>
              <HeadDecoration title={t("statistics")} />
              <div className='grid-rows-auto grid-cols-2  items-center md:grid'>
                <div className=' order-2 row-span-1 my-5 flex justify-center '>
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
                    title={t("creativity")}
                    value={convertMsToHM(time.creativity)}
                    percent={Math.round((time.creativity / totalTime) * 100)}
                  />
                </div>
                <div className=' row-cols-1  order-1'>
                  {statsField.map(({ Icon, description, value }, index) => (
                    <StatsField
                      key={index}
                      Icon={Icon}
                      description={description}
                      value={value}
                    />
                  ))}
                </div>
                <div className='row-cols-1 order-3 '>
                  <AchievementWrapper userAchievements={achievements} />
                </div>
                {featSlot}
              </div>
            </div>
          </Wrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
};

export default LandingLayout;
