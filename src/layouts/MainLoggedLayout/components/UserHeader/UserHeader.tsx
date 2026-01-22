import { Separator } from "assets/components/ui/separator";
import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";
import { HeaderLevelBar } from "components/LevelBar/HeaderLevelBar";
import UserNav from "components/UserNav";
import { WelcomeMessage } from "layouts/MainLoggedLayout/components/UserHeader/components/WelcomeMessage/WelcomeMessage";
import Image from "next/image";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

import { ActivitySheet } from "./components/ActivitySheet";

interface UserHeaderProps {
  userStats: StatisticsDataInterface;
  userName: string;
  avatar?: string;
}

export const UserHeader = ({
  userStats,
  userName,
}: UserHeaderProps) => {
  const {
    points,
    lvl,
    lastReportDate,
    actualDayWithoutBreak,
    time,
  } = userStats;

  // Calculate derived values for WelcomeMessage
  const totalPracticeTime = convertMsToHM(
    time.technique + time.theory + time.creativity + time.hearing
  );

  return (
    <header className='sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 shadow-lg backdrop-blur-xl'>
      {/* Subtle top accent */}
      <div className='absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent'></div>

      <div className='relative w-full'>
        <div className='flex items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8'>
          {/* Left Section - Level & Progress */}
          <div className='flex items-center gap-3 pl-0'>
            <div className="flex sm:hidden h-8 w-8 items-center justify-center">
              <Image 
                src="/images/logolight.svg" 
                alt="Logo" 
                width={28} 
                height={28} 
                className="h-7 w-7"
              />
            </div>
            <HeaderLevelBar
              points={points}
              lvl={lvl}
            />
          </div>

          {/* Center Section - Welcome Message with Weekly Progress */}
          <div className='hidden flex-1 justify-center px-6 md:flex'>
            <WelcomeMessage
              userName={userName}
              lastReportDate={lastReportDate}
              points={points}
              actualDayWithoutBreak={actualDayWithoutBreak}
              totalPracticeTime={totalPracticeTime}
            />
          </div>

          {/* Right Section - Actions */}
            <div className='flex items-center gap-2'>
              {/* Desktop Actions */}
              <div className='hidden sm:flex items-center gap-1'>
                <ActivitySheet />
                <CopyLinkProfile />
                <Separator orientation='vertical' className='mx-2 h-6 bg-white/10' />
                <UserNav />
              </div>
              
              {/* Mobile Actions */}
              <div className='flex items-center gap-1 sm:hidden'>
                 <ActivitySheet />
                 <UserNav showOnlyLogout />
              </div>
            </div>
        </div>
      </div>

      {/* Bottom subtle shadow */}
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent'></div>
    </header>
  );
};

export default UserHeader;
