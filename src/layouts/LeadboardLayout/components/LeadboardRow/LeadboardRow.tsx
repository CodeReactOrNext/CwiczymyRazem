import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaExternalLinkAlt } from "react-icons/fa";

import Avatar from "components/Avatar";
import DaySince from "components/DaySince";
import AchievementsCarousel from "../AchievementsCarousel";

import { convertMsToHM } from "utils/converter";
import { StatisticsDataInterface } from "types/api.types";

interface LeadboardColumnProps {
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
  userAvatar?: string;
  profileId?: string;
  currentUserId: string | null;
}

const LeadboardRow = ({
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
    if (!nick) return;
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
    <li className='flex w-full justify-center p-7 text-xs xs:text-base'>
      <p className={`flex items-center justify-end font-semibold xxs:text-lg xs:text-4xl lg:text-5xl xl:w-[100px] xl:text-6xl
         ${profileId === currentUserId ? "text-blue-400" : "text-gray-400"}`}>
        {place + "."}
      </p>
      <div className='ml-2 flex w-full max-w-[800px] items-center md:h-16 xl:ml-5'>
        <div className='hidden md:block'>
          <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
        </div>

        <div className={`group mr-5 grid w-full grid-cols-3 grid-rows-2 justify-items-center 
          border-b-2 bg-opacity-75 radius-default transition-all duration-200 
          hover:bg-opacity-90 sm:grid-rows-3 md:h-16 md:grid-rows-1 lg:px-2
          ${place === 1 ? "border-yellow-500 bg-yellow-900/40 hover:bg-yellow-900/60" : ""}
          ${place === 2 ? "border-gray-400 bg-gray-800/40 hover:bg-gray-800/60" : ""}
          ${place === 3 ? "border-yellow-700 bg-yellow-950/40 hover:bg-yellow-950/60" : ""}
          ${profileId === currentUserId 
            ? "border-blue-500 bg-blue-900/20 hover:bg-blue-900/40 shadow-lg shadow-blue-500/20" 
            : "border-gray-700 bg-gray-900/40 hover:bg-gray-800/60"}
        `}>
          <div className='relative top-[-23px] left-[-25px] block h-[65px] scale-75 justify-items-start md:hidden'>
            <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />

            <div className='absolute top-[-10px] right-[-60px] flex items-center gap-x-1'>
              <p className='text-2xl uppercase text-gray-400 drop-shadow'>
                Lvl{" "}
              </p>
              <p className='text-4xl font-extrabold text-gray-300 drop-shadow-3xl md:text-5xl'>
                {statistics.lvl}
              </p>
            </div>
          </div>
          <div className='relative col-span-2 self-center justify-self-start md:col-span-1'>
            <Link href={`/user/${profileId}`}>
              <p className='flex cursor-pointer flex-row whitespace-nowrap text-lg hover:text-slate-100 active:click-behavior xs:text-2xl lg:text-xl xl:text-2xl'>
                {shortenNick(nick)}
                <FaExternalLinkAlt className='ml-2 text-xs opacity-0 group-hover:opacity-100' />
              </p>
            </Link>
            <DaySince date={new Date(statistics.lastReportDate)} />

            <div className='absolute top-[-30px] hidden items-center gap-x-1 md:right-[-50px] md:flex lg:right-[-0px] xl:right-[-50px]'>
              <p className='text-xl uppercase text-gray-400 drop-shadow'>
                Lvl{" "}
              </p>
              <p className='text-4xl font-extrabold text-gray-300 drop-shadow-3xl md:text-5xl'>
                {statistics.lvl}
              </p>
            </div>
          </div>

          <div className='col-span-3 flex h-full w-full items-center justify-evenly 
            border-y-2 border-gray-800/30 bg-black/20 backdrop-blur-sm
            md:col-span-1 md:w-[300px] md:justify-center md:border-y-0 md:bg-transparent'>
            <div className='flex flex-col items-center md:justify-end md:px-2'>
              <p className='text-xl xxs:text-3xl'>{statistics.points}</p>
              <p className='font-openSans text-xs font-bold leading-[15px] text-gray-400'>
                {t("points")}
              </p>
            </div>
            <div className='flex flex-col items-center md:justify-end md:px-2'>
              <p className='text-xl xxs:text-3xl'>
                {convertMsToHM(
                  time.creativity + time.hearing + time.technique + time.theory
                )}
              </p>
              <p className='font-openSans text-xs font-bold leading-[15px] text-gray-400'>
                {t("exercise_time")}
              </p>
            </div>
          </div>

          <AchievementsCarousel achievements={statistics.achievements} />
        </div>
      </div>
    </li>
  );
};

export default LeadboardRow;
