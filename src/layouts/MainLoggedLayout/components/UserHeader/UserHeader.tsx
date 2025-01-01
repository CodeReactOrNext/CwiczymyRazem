import Logo from "components/Logo";
import Avatar from "components/Avatar";
import UserNav from "components/UserNav";
import LevelBar from "components/LevelBar";
import NavDecoration from "./components/NavDecoration";
import WelcomeMessage from "./components/WelcomeMessage";
import { LanguageSwitch } from "components/UI";

import { StatisticsDataInterface } from "types/api.types";
import CopyLinkProfile from "components/CopyLinkProfile";
import { convertMsToHM } from "utils/converter";

interface UserHeaderProps {
  userStats: StatisticsDataInterface;
  userName: string;
  avatar?: string;
}

const UserHeader = ({ userStats, userName, avatar }: UserHeaderProps) => {
  const {
    points,
    lvl,
    currentLevelMaxPoints,
    lastReportDate,
    actualDayWithoutBreak,
    time,
  } = userStats;
  return (
    <>
      <div className='z-30 flex flex-col items-start space-x-2 space-y-2 text-lg '>
        <div className='flex flex-row items-center gap-5 lg:gap-4 xl:gap-8 '>
          <div className='scale-75 sm:scale-100 lg:mr-4'>
            <Logo />
            <div className='flex flex-col items-center'>
              <Avatar avatarURL={avatar} name={userName} lvl={lvl} />
              <div className='mt-3'>
                <UserNav />
              </div>
            </div>
          </div>
          <WelcomeMessage
            userName={userName}
            lastReportDate={lastReportDate}
            points={points}
            actualDayWithoutBreak={actualDayWithoutBreak}
            totalPracticeTime={convertMsToHM(
              time.technique + time.theory + time.creativity + time.hearing
            )}
          />
        </div>
        <div className='absolute -right-2 top-0 flex w-full scale-[85%] items-end justify-between gap-4 xs:right-2 xs:top-2 xs:w-auto sm:scale-100 sm:flex-col'>
          <LanguageSwitch />
        </div>
      </div>
      <NavDecoration />
      <div className=' col-span-2 m-auto flex w-[90%] flex-col gap-2  md:col-auto md:items-center '>
        <CopyLinkProfile />
        <LevelBar
          points={points}
          lvl={lvl}
          currentLevelMaxPoints={currentLevelMaxPoints}
        />
      </div>
    </>
  );
};

export default UserHeader;
