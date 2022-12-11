import Avatar from "components/Avatar";
import Logo from "components/Logo";
import UserNav from "components/UserNav";
import { statisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { Level } from "./components/Level";
import { NavDecoration } from "./components/NavDecoration";
import { WelcomeMessage } from "./components/WelcomMessage";

interface UserHeaderProps {
  userStats: statisticsDataInterface;
  userName: string;
}

export default function UserHeader({ userStats, userName }: UserHeaderProps) {
  const { points, lvl } = userStats;
  return (
    <>
      <div className='flex flex-col items-start space-x-2 space-y-2 text-lg '>
        <div className='flex flex-row items-center gap-5 sm:gap-10'>
          <div className=' lg:mr-4'>
            <Logo />
            <Avatar name={userName} lvl={lvl} />
            <UserNav />
          </div>
          <WelcomeMessage userName={userName} place={1} points={points} />
        </div>
      </div>
      <NavDecoration />
      <Level points={points} lvl={lvl} />
    </>
  );
}