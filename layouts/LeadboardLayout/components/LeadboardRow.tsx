import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaExternalLinkAlt } from "react-icons/fa";

import Avatar from "components/Avatar";
import Carousel from "./AchievementsCarousel";
import DaySince from "components/DaySince/DaySince";

import { convertMsToHM } from "utils/converter/timeConverter";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
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
    <li
      className={`flex w-full justify-center p-7 text-xs xs:text-base 
    ${profileId === currentUserId ? "scale-105" : ""} `}>
      <p
        className={`flex items-center justify-end font-semibold text-tertiary xxs:text-lg xs:text-4xl  lg:text-5xl  xl:w-[100px]  xl:text-6xl
       ${profileId === currentUserId ? "text-mainText" : ""}`}>
        {place + "."}
      </p>
      <div className=' ml-2 flex w-full max-w-[800px] items-center md:h-16 xl:ml-5 '>
        <div className='hidden md:block'>
          <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
        </div>

        <div
          className={`group mr-5 grid w-full  grid-cols-3 grid-rows-2 justify-items-center border-b-2 border-second bg-second bg-opacity-75 radius-default hover:bg-opacity-90 sm:grid-rows-3 md:h-16 md:grid-rows-1 lg:px-2
        ${place === 1 ? "border-yellow-500 bg-[#736d00] bg-opacity-90" : ""}
        ${place === 2 ? "border-slate-400 bg-[#656d6d] bg-opacity-90" : ""}
        ${place === 3 ? "border-yellow-700 bg-[#5D3F17] bg-opacity-90" : ""}
        ${profileId === currentUserId ? "shadow-lg shadow-black/50" : ""}
       `}>
          <div className='relative top-[-23px] left-[-25px] block h-[65px] scale-75 justify-items-start md:hidden'>
            <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />

            <div className='absolute top-[-10px] right-[-60px] flex  items-center gap-x-1  '>
              <p className='text-2xl uppercase text-tertiary drop-shadow'>
                Lvl{" "}
              </p>
              <p className=' text-4xl font-extrabold text-tertiary-300  drop-shadow-3xl md:text-5xl'>
                {statistics.lvl}
              </p>
            </div>
          </div>
          <div className='relative col-span-2 self-center justify-self-start md:col-span-1 '>
            <Link href={`/user/${profileId}`}>
              <p className='flex cursor-pointer flex-row whitespace-nowrap text-lg hover:text-slate-100 active:click-behavior xs:text-2xl lg:text-xl xl:text-2xl '>
                {shortenNick(nick)}
                <FaExternalLinkAlt className='ml-2 text-xs opacity-0  group-hover:opacity-100' />
              </p>
            </Link>
            <DaySince date={new Date(statistics.lastReportDate)} />

            <div className=' absolute top-[-30px] hidden items-center gap-x-1 md:right-[-50px] md:flex lg:right-[-0px] xl:right-[-50px]'>
              <p className='text-xl uppercase text-tertiary drop-shadow'>
                Lvl{" "}
              </p>
              <p className=' text-4xl font-extrabold text-tertiary-300  drop-shadow-3xl md:text-5xl'>
                {statistics.lvl}
              </p>
            </div>
          </div>

          <div className='col-span-3 flex h-full w-full items-center justify-evenly border-y-2 border-black/10 bg-black/10 md:col-span-1 md:w-[300px] md:justify-center md:border-y-0 md:bg-transparent '>
            <div className='flex  flex-col items-center md:justify-end md:px-2 '>
              <p className='text-xl xxs:text-3xl '>{statistics.points}</p>
              <p className='font-openSans text-xs font-bold leading-[15px] text-tertiary-300'>
                {t("points")}
              </p>
            </div>
            <div className='flex flex-col items-center md:justify-end md:px-2'>
              <p className='text-xl  xxs:text-3xl'>
                {convertMsToHM(
                  time.creativity + time.hearing + time.technique + time.theory
                )}
              </p>
              <p className='font-openSans text-xs font-bold leading-[15px] text-tertiary-300 '>
                {t("exercise_time")}
              </p>
            </div>
          </div>

          <Carousel achievements={statistics.achievements} />
        </div>
      </div>
    </li>
  );
};

export default LeadboardRow;
