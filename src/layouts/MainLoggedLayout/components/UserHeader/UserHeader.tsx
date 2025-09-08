import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";
import { LevelBar } from "components/LevelBar/LevelBar";
import { Logo } from "components/Logo/Logo";
import { LanguageSwitch } from "components/UI";
import Avatar from "components/UI/Avatar";
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
          <div className='flex w-full items-center justify-between gap-3 sm:gap-4'>
            {/* Left section - User info */}
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Avatar avatarURL={avatar} name={userName} lvl={lvl} />
              </div>

              <div className='hidden sm:block'>
                <div className='flex flex-col'>
                  <span className='text-sm font-bold text-white'>
                    {userName}
                  </span>
                  <div className='flex items-center gap-2 text-xs text-white/70'>
                    <span className='flex items-center gap-1'>
                      <div className='h-1.5 w-1.5 rounded-full bg-white/60'></div>
                      Level {lvl}
                    </span>
                    <span>•</span>
                    <span>
                      {convertMsToHM(
                        time.technique +
                          time.theory +
                          time.creativity +
                          time.hearing
                      )}{" "}
                      practiced
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - LevelBar as main element - full width */}
            <div className='max-w-2xl flex-1'>
              <LevelBar
                points={points}
                lvl={lvl}
                currentLevelMaxPoints={currentLevelMaxPoints}
              />
            </div>

            {/* Right section - Actions */}
            <div className='flex items-center gap-2'>
              <div className='hidden items-center gap-2 md:flex'>
                <div className='flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs'>
                  <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-green-400'></div>
                  <span className='font-medium text-white/90'>Online</span>
                </div>
              </div>

              <div className='hidden sm:block'>
                <CopyLinkProfile />
              </div>

              <div className='flex items-center gap-2'>
                <UserNav />
                <div className='h-3 w-px bg-white/30'></div>
                <LanguageSwitch />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserHeader;
