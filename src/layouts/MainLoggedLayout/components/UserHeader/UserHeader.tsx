import { Button } from "assets/components/ui/button";
import { Badge } from "assets/components/ui/badge";
import { Separator } from "assets/components/ui/separator";
import { Progress } from "assets/components/ui/progress";
import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";
import UserNav from "components/UserNav";
import { WelcomeMessage } from "layouts/MainLoggedLayout/components/UserHeader/components/WelcomeMessage/WelcomeMessage";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";
import { Target } from "lucide-react";

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

  // Calculate derived values for WelcomeMessage
  const totalPracticeTime = convertMsToHM(
    time.technique + time.theory + time.creativity + time.hearing
  );

  // Calculate level progress for progress bar
  const levelXpStart = lvl > 1 ? Math.pow(lvl - 1, 2) * 100 : 0;
  const levelXpEnd = Math.pow(lvl, 2) * 100;
  const pointsInThisLevel = points - levelXpStart;
  const levelXpDifference = levelXpEnd - levelXpStart;
  const progressPercent = Math.min(
    (pointsInThisLevel / levelXpDifference) * 100,
    100
  );

  return (
    <header className='sticky top-0 z-50 border-b border-white/10 bg-card backdrop-blur-xl'>
      {/* Subtle top accent */}
      <div className='absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent'></div>

      <div className='relative w-full'>
        <div className='flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
          {/* Left Section - Level & Progress */}
          <div className='flex items-center gap-4'>
            {/* Level Badge - Minimalist with Icon */}
            <div className='flex items-center gap-3'>
              <Badge
                variant='outline'
                className='h-10 border-white/10 bg-zinc-800/50 px-3 text-white backdrop-blur-sm'>
                <Target className='mr-2 h-4 w-4' />
                Level {lvl}
              </Badge>

              {/* Progress Bar */}
              <div className='hidden items-center gap-2 sm:flex'>
                <Progress
                  value={progressPercent}
                  className='w-24 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-cyan-600'
                />
                <span className='text-xs font-medium text-cyan-400'>
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
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
          <div className='flex items-center gap-3'>
            <div className='hidden items-center gap-3 sm:flex'>
              <CopyLinkProfile />
              <Separator orientation='vertical' className='h-6 bg-white/10' />
            </div>

            <div className='flex items-center gap-2'>
              <UserNav />
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
