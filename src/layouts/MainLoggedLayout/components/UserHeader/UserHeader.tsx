import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";
import { LevelBar } from "components/LevelBar/LevelBar";
import { LanguageSwitch } from "components/UI";
import UserNav from "components/UserNav";
import { WelcomeMessage } from "layouts/MainLoggedLayout/components/UserHeader/components/WelcomeMessage/WelcomeMessage";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

import NavDecoration from "./components/NavDecoration";

interface UserHeaderProps {
  userStats: StatisticsDataInterface;
  userName: string;
  avatar?: string;
}

export const UserHeader = ({
  userStats,
  userName,
  avatar,
}: UserHeaderProps) => {
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
      {/* Enhanced Modern Header */}
      <header className='sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl'>
        {/* Subtle gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-r from-zinc-900/30 via-zinc-800/20 to-zinc-900/30'></div>

        {/* Top accent line */}
        <div className='absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent'></div>

        <div className='relative w-full'>
          <div className='flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
            {/* Left Section - Level Progress (Far Left) */}
            <div className='flex items-center'>
              <LevelBar
                points={points}
                lvl={lvl}
                currentLevelMaxPoints={currentLevelMaxPoints}
              />
            </div>

            {/* Center Section - Compact Stats */}
            <div className='hidden flex-1 justify-center px-4 md:flex'>
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

            {/* Right Section - User Actions (Far Right) */}
            <div className='flex items-center gap-3'>
              <div className='hidden items-center gap-3 sm:flex'>
                <CopyLinkProfile />
                <div className='h-6 w-px bg-zinc-700/50'></div>
              </div>

              <div className='flex items-center gap-2'>
                <UserNav />
                <div className='h-6 w-px bg-zinc-700/50'></div>
                <LanguageSwitch />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom shadow */}
        <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent'></div>
      </header>
    </>
  );
};

export default UserHeader;
