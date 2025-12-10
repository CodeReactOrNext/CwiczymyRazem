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
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-md ${
          profileId === currentUserId
            ? "border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 via-zinc-900/60 to-cyan-900/20 shadow-lg shadow-cyan-500/10"
            : "border-white/5 bg-zinc-900/40 shadow-xl shadow-black/20"
        }`}>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.06]'>
          <div
            className={`h-full w-full bg-gradient-to-br ${
              profileId === currentUserId
                ? "from-cyan-400 to-blue-500"
                : "from-white to-zinc-400"
            }`}
          />
        </div>

        <div className='relative flex items-center gap-3 p-4 sm:gap-5 sm:p-5 lg:gap-8 lg:p-6'>
          {/* Rank Number - Cleaner, no box */}
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

          {/* Avatar - Responsive */}
          <div className='hidden flex-shrink-0 sm:block'>
            <div className='relative transition-transform duration-300 group-hover:scale-105'>
              <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
            </div>
          </div>

          {/* User Info - Responsive */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1.5 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-center sm:gap-4'>
              <Link href={`/user/${profileId}`}>
                <h3
                  className={`text-base font-bold tracking-tight transition-colors sm:text-lg lg:text-xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-200 group-hover:text-white"
                  }`}>
                  {shortenNick(nick)}
                  <FaExternalLinkAlt className='ml-2 inline -translate-y-0.5 text-xs opacity-0 transition-all duration-300 group-hover:opacity-40 sm:text-sm' />
                </h3>
              </Link>

              {/* Level Badge - Pill Style */}
              <div
                className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 ${
                  profileId === currentUserId
                    ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "bg-zinc-800 text-zinc-400 ring-1 ring-white/5"
                }`}>
                <span className='text-[10px] font-bold uppercase tracking-wider opacity-70'>
                  LVL
                </span>
                <span className='text-sm font-bold sm:text-base'>
                  {statistics.lvl}
                </span>
              </div>
            </div>

            <div className='hidden sm:block'>
              <div className='text-xs font-medium text-zinc-500 group-hover:text-zinc-400'>
                <DaySinceMessage date={new Date(statistics.lastReportDate)} />
              </div>
            </div>
          </div>

          {/* Stats - Responsive */}
          <div className='flex items-center gap-6 sm:gap-8 lg:gap-12'>
            <div className='text-center'>
              <div
                className={`text-lg font-black tracking-tight sm:text-xl lg:text-2xl ${
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
                className={`font-mono text-lg font-bold sm:text-xl lg:text-2xl ${
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

          {/* Achievements - Hidden on mobile */}
          <div className='hidden flex-shrink-0 lg:block opacity-80 transition-opacity duration-300 group-hover:opacity-100'>
            <AchievementsCarousel achievements={statistics.achievements} />
          </div>
        </div>

        {/* Mobile-only bottom section */}
        <div className='border-t border-white/5 bg-zinc-900/20 p-3 sm:hidden'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='h-8 w-8'>
                <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
              </div>
              <div className='text-xs font-medium text-zinc-500'>
                <DaySinceMessage date={new Date(statistics.lastReportDate)} />
              </div>
            </div>
            <div className='flex-shrink-0 scale-90'>
              <AchievementsCarousel achievements={statistics.achievements} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
