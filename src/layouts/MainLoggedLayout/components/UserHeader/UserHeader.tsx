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
      {/* Modern Header with LevelBar as main element */}
      <div className='relative overflow-hidden border-b border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-xl'>
        {/* Subtle background effects */}
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>

        <div className='relative px-4 py-2 sm:px-6 sm:py-3'>
          <div className='flex w-full items-center justify-between gap-4'>
            {/* Left section - Progress Bar */}
            <div className='flex items-center'>
              <LevelBar
                points={points}
                lvl={lvl}
                currentLevelMaxPoints={currentLevelMaxPoints}
              />
            </div>

            {/* Center - Streak and Practice Info */}
            <div className='hidden flex-1 justify-center md:flex'>
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

            {/* Right section - Navigation and Actions */}
            <div className='flex items-center gap-3'>
              <div className='hidden sm:block'>
                <CopyLinkProfile />
              </div>
              <UserNav />
              <div className='h-4 w-px bg-white/20'></div>
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserHeader;
