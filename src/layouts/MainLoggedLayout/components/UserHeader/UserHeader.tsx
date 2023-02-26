import Logo from "components/Logo";
import Avatar from "components/Avatar";
import UserNav from "components/UserNav";
import LevelBar from "components/UI/LevelBar";
import ThemeToggle from "components/UI/ThemeToggle";
import LanguageSwitch from "components/UI/LanguageSwitch";
import NavDecoration from "./components/NavDecoration";
import WelcomeMessage from "./components/WelcomeMessage";

import { StatisticsDataInterface } from "constants/userStatisticsInitialData";

interface UserHeaderProps {
  userStats: StatisticsDataInterface;
  userName: string;
  avatar?: string;
}

const UserHeader = ({ userStats, userName, avatar }: UserHeaderProps) => {
  const { points, lvl, currentLevelMaxPoints, lastReportDate } = userStats;
  return (
    <>
      <div className='z-30 flex flex-col items-start space-x-2 space-y-2 text-lg '>
        <div className='flex flex-row items-center gap-5 sm:gap-10 '>
          <div className='scale-75 sm:scale-100 lg:mr-4'>
            <Logo />
            <Avatar avatarURL={avatar} name={userName} lvl={lvl} />
            <div className='mt-3'>
              <UserNav />
            </div>
          </div>
          <WelcomeMessage
            userName={userName}
            lastReportDate={lastReportDate}
            points={points}
          />
        </div>
        <div className='absolute -right-2 top-0 flex w-full scale-[85%] items-end justify-between gap-4 xs:right-2 xs:top-2 xs:w-auto sm:scale-100 sm:flex-col'>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </div>
      <NavDecoration />
      <LevelBar
        points={points}
        lvl={lvl}
        currentLevelMaxPoints={currentLevelMaxPoints}
      />
    </>
  );
};

export default UserHeader;
