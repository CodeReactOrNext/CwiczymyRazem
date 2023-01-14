import Logo from "components/Logo";
import Level from "./components/Level";
import Avatar from "components/Avatar";
import UserNav from "components/UserNav";
import NavDecoration from "./components/NavDecoration";
import WelcomeMessage from "./components/WelcomMessage";

import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
interface UserHeaderProps {
  userStats: StatisticsDataInterface;
  userName: string;
  avatar?: string;
}

const UserHeader = ({ userStats, userName, avatar }: UserHeaderProps) => {
  const { points, lvl, pointsToNextLvl, lastReportDate } = userStats;
  return (
    <>
      <div className='flex flex-col items-start space-x-2 space-y-2 text-lg '>
        <div className='flex flex-row items-center gap-5 sm:gap-10'>
          <div className=' lg:mr-4'>
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
      </div>
      <NavDecoration />
      <Level points={points} lvl={lvl} pointsToNextLvl={pointsToNextLvl} />
    </>
  );
};

export default UserHeader;
