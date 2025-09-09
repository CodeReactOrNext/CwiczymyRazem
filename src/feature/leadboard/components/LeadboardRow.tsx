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
    <li className='mb-3 w-full'>
      <div
        className={`group relative overflow-hidden border backdrop-blur-sm transition-all duration-200 hover:bg-opacity-90 ${
          profileId === currentUserId
            ? "border-cyan-500/50 bg-gradient-to-r from-cyan-900/20 via-zinc-900/50 to-cyan-900/20 shadow-lg shadow-cyan-500/10"
            : "border-zinc-700/50 bg-gradient-to-r from-zinc-900/40 to-zinc-800/30 hover:border-zinc-600/50 hover:bg-zinc-800/50"
        }`}>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div
            className={`h-full w-full bg-gradient-to-br ${
              profileId === currentUserId
                ? "from-cyan-500 to-blue-600"
                : "from-zinc-500 to-zinc-600"
            }`}
          />
        </div>

        <div className='relative flex items-center gap-3 p-4 sm:gap-4 sm:p-5 lg:gap-6 lg:p-6'>
          {/* Rank Number - Smaller and responsive */}
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center border text-lg font-bold sm:h-12 sm:w-12 sm:text-xl lg:h-14 lg:w-14 lg:text-2xl ${
              profileId === currentUserId
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/25"
                : "border-zinc-600/50 bg-zinc-800/50 text-zinc-400"
            }`}>
            {place}
          </div>

          {/* Avatar - Responsive */}
          <div className='hidden flex-shrink-0 sm:block'>
            <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
          </div>

          {/* User Info - Responsive */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-center sm:gap-3'>
              <Link href={`/user/${profileId}`}>
                <h3
                  className={`text-base font-semibold transition-colors hover:text-white sm:text-lg lg:text-xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-200"
                  }`}>
                  {shortenNick(nick)}
                  <FaExternalLinkAlt className='ml-2 inline text-xs opacity-0 transition-opacity group-hover:opacity-60 sm:text-sm' />
                </h3>
              </Link>

              {/* Level Badge - Responsive */}
              <div
                className={`flex w-fit items-center gap-1 border px-2 py-1 sm:px-3 ${
                  profileId === currentUserId
                    ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300"
                    : "border-zinc-600/50 bg-zinc-800/50 text-zinc-400"
                }`}>
                <span className='text-xs font-medium uppercase'>LVL</span>
                <span className='text-sm font-bold sm:text-base lg:text-lg'>
                  {statistics.lvl}
                </span>
              </div>
            </div>

            <div className='hidden sm:block'>
              <DaySinceMessage date={new Date(statistics.lastReportDate)} />
            </div>
          </div>

          {/* Stats - Responsive */}
          <div className='flex items-center gap-4 sm:gap-6 lg:gap-8'>
            <div className='text-center'>
              <div
                className={`text-lg font-bold sm:text-xl lg:text-2xl ${
                  profileId === currentUserId ? "text-cyan-300" : "text-white"
                }`}>
                {statistics.points.toLocaleString()}
              </div>
              <div className='text-xs font-medium uppercase tracking-wide text-zinc-400'>
                {t("points")}
              </div>
            </div>

            <div className='text-center'>
              <div
                className={`font-mono text-lg font-bold sm:text-xl lg:text-2xl ${
                  profileId === currentUserId ? "text-cyan-300" : "text-white"
                }`}>
                {convertMsToHM(
                  time.creativity + time.hearing + time.technique + time.theory
                )}
              </div>
              <div className='text-xs font-medium uppercase tracking-wide text-zinc-400'>
                {t("exercise_time")}
              </div>
            </div>
          </div>

          {/* Achievements - Hidden on mobile */}
          <div className='hidden flex-shrink-0 lg:block'>
            <AchievementsCarousel achievements={statistics.achievements} />
          </div>
        </div>

        {/* Mobile-only bottom section */}
        <div className='border-t border-zinc-700/30 p-3 sm:hidden'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='h-8 w-8'>
                <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
              </div>
              <DaySinceMessage date={new Date(statistics.lastReportDate)} />
            </div>
            <div className='flex-shrink-0'>
              <AchievementsCarousel achievements={statistics.achievements} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
