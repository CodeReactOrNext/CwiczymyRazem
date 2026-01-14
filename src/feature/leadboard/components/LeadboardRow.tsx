import { cn } from "assets/lib/utils";
import { DaySinceMessage } from "components/DaySince/DaySince";
import Avatar from "components/UI/Avatar";
import { AchievementsCarousel } from "feature/leadboard/components/AchievementsCarousel";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaExternalLinkAlt } from "react-icons/fa";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

interface LeadboardColumnProps {
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
  userAvatar?: string;
  profileId?: string;
  currentUserId: string | null;
}

export const LeadboardRow = ({
  place,
  nick,
  statistics,
  userAvatar,
  profileId,
  currentUserId,
}: LeadboardColumnProps) => {
  const { t } = useTranslation("leadboard");
  const { lvl, time } = statistics;

  const shortenNick = (nick: string) => {
    const MAX_SHOW_NICK_LENGTH = 16;
    if (!nick) {
      return null;
    }
    if (nick.length > MAX_SHOW_NICK_LENGTH) {
      return (
        <span data-tip={nick}>
          {nick.substring(0, MAX_SHOW_NICK_LENGTH) + "..."}
        </span>
      );
    }
    return nick;
  };

  return (
    <li className='w-full'>
      <div
        className={cn(
          "relative overflow-hidden radius-premium glass-card transition-background",
          profileId === currentUserId
            ? " bg-gradient-to-r from-cyan-900/20 via-zinc-900/60 to-cyan-900/20 "
            : " hover:glass-card-hover"
        )}>
      

        {/* --- Mobile Layout (<640px) --- */}
        <div className='relative z-10 flex flex-col gap-4 p-4 sm:hidden'>
           {/* Card Header: Rank, Avatar, Name */}
           <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <div 
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg font-black italic tracking-tighter",
                   profileId === currentUserId 
                    ? "bg-cyan-500 text-black" 
                    : "bg-balck/40 text-zinc-400"
                )}
              >
                 #{place}
              </div>

              {/* Avatar & Identity */}
              <div className="flex flex-1 items-center gap-3 overflow-hidden">
                  <Link href={`/user/${profileId}`} className="relative flex-shrink-0">
                     <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} size="sm" />
                  </Link>

                 <div className="flex flex-col min-w-0 gap-0.5">
                    <Link href={`/user/${profileId}`} className="block truncate">
                       <span 
                         className={cn(
                           "flex items-center gap-2 truncate text-sm font-bold tracking-tight hover:underline",
                            profileId === currentUserId ? "text-cyan-400" : "text-white"
                         )}
                       >
                         {nick}
                         <FaExternalLinkAlt className="h-3 w-3 opacity-50" />
                       </span>
                    </Link>
                    
                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500">
                       <div 
                          className={cn(
                            "flex items-center rounded-sm px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            profileId === currentUserId 
                             ? "bg-cyan-500/10 text-cyan-400" 
                             : "bg-zinc-800 text-zinc-400"
                          )}
                       >
                         LVL {lvl}
                       </div>
                       <span className="truncate">
                         <DaySinceMessage date={new Date(statistics.lastReportDate)} />
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Stats Grid - Card within a Card */}
           <div className="grid grid-cols-2 divide-x divide-white/5 rounded-xl bg-black/20">
              <div className="flex flex-col items-center justify-center py-3">
                 <span className={cn(
                    "text-lg font-black tracking-tight",
                     profileId === currentUserId ? "text-cyan-400" : "text-zinc-100"
                 )}>
                    {statistics.points.toLocaleString()}
                 </span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    {t("points")}
                 </span>
              </div>
              
              <div className="flex flex-col items-center justify-center py-3">
                 <span className={cn(
                    "font-mono text-lg font-bold",
                     profileId === currentUserId ? "text-cyan-400" : "text-zinc-300"
                 )}>
                    {convertMsToHM(time.creativity + time.hearing + time.technique + time.theory)}
                 </span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    {t("exercise_time")}
                 </span>
              </div>
           </div>

           {/* Achievements Footer */}
           {statistics.achievements && statistics.achievements.length > 0 && (
              <div className="flex items-center justify-center  pt-3">
                 <div className="scale-90 opacity-80">
                    <AchievementsCarousel achievements={statistics.achievements} />
                 </div>
              </div>
           )}
        </div>

        <div className='relative z-10 hidden items-center gap-3 p-4 sm:flex sm:gap-5 sm:p-5 lg:gap-8 lg:p-6'>
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center text-lg font-black italic tracking-tighter sm:h-12 sm:w-12 sm:text-xl lg:h-14 lg:w-14 lg:text-2xl ${
              profileId === currentUserId
                ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                : place <= 3
                ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                : "text-zinc-500 group-hover:text-zinc-400"
            }`}>
            #{place}
          </div>

          {/* Avatar */}
          <Link href={`/user/${profileId}`} className='flex-shrink-0'>
            <div className='relative transition-transform duration-300 group-hover:scale-105'>
              <Avatar avatarURL={userAvatar} name={nick} lvl={lvl}  />
            </div>
          </Link>

          {/* User Info */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1.5 flex items-center gap-4'>
              <Link href={`/user/${profileId}`} className="flex items-center gap-2 group/link">
                <h3
                  className={`text-lg font-bold tracking-tight transition-colors lg:text-xl group-hover/link:underline ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-200 group-hover:text-white"
                  }`}>
                  {shortenNick(nick)}
                </h3>
                <FaExternalLinkAlt className='text-xs opacity-30 transition-all duration-300 group-hover/link:opacity-100 sm:text-sm' />
              </Link>

              <div
                className={`flex w-fit items-center gap-1.5 rounded-sm px-3 py-1 ${
                  profileId === currentUserId
                    ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "bg-zinc-800 text-zinc-400 ring-1 ring-white/5"
                }`}>
                <span className='text-[10px] font-bold uppercase tracking-wider opacity-70'>
                  LVL
                </span>
                <span className='text-base font-bold'>
                  {statistics.lvl}
                </span>
              </div>
            </div>

            <div className='text-xs font-medium text-zinc-500 group-hover:text-zinc-400'>
              <DaySinceMessage date={new Date(statistics.lastReportDate)} />
            </div>
          </div>

          {/* Stats */}
          <div className='flex items-center gap-8 lg:gap-12'>
            <div className='text-center'>
              <div
                className={`text-xl font-black tracking-tight lg:text-2xl ${
                  profileId === currentUserId
                    ? "text-cyan-300"
                    : "text-white group-hover:scale-105 transition-transform duration-300"
                }`}>
                {statistics.points.toLocaleString()}
              </div>
              <div className='text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                {t("points")}
              </div>
            </div>

            <div className='text-center'>
              <div
                className={`font-mono text-xl font-bold lg:text-2xl ${
                  profileId === currentUserId
                    ? "text-cyan-300"
                    : "text-zinc-300 group-hover:text-white"
                }`}>
                {convertMsToHM(
                  time.creativity + time.hearing + time.technique + time.theory
                )}
              </div>
              <div className='text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                {t("exercise_time")}
              </div>
            </div>
          </div>

          {/* Achievements - Desktop */}
          <div className='flex-shrink-0 hidden lg:block opacity-80 transition-opacity duration-300 group-hover:opacity-100'>
            <AchievementsCarousel achievements={statistics.achievements} />
          </div>
        </div>
      </div>
    </li>
  );
};
