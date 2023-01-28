import Avatar from "components/Avatar";
import DaySince from "components/DaySince/DaySince";
import { convertMsToHM } from "utils/converter/timeConverter";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaExternalLinkAlt } from "react-icons/fa";
import { RiExternalLinkFill } from "react-icons/ri";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import Carousel from "./AchievementsCarousel";
interface LeadboardColumnProps {
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
  userAvatar?: string;
  profileId?: string;
}

const LeadboardRow = ({
  place,
  nick,
  statistics,
  userAvatar,
  profileId,
}: LeadboardColumnProps) => {
  const { t } = useTranslation("leadboard");
  const { lvl, time } = statistics;

  const shortenNick = (nick: string) => {
    const MAX_SHOW_NICK_LENGTH = 16;
    if (!nick) return;
    if (nick.length > MAX_SHOW_NICK_LENGTH) {
      return (
        <p data-tip={nick}>{nick.substring(0, MAX_SHOW_NICK_LENGTH) + "..."}</p>
      );
    }
    return nick;
  };

  return (
    <li className='flex w-full justify-center p-5 text-xs xs:text-base'>
      <p className='flex items-center justify-end font-semibold text-tertiary xxs:text-lg xs:text-4xl  lg:text-5xl  xl:w-[100px]  xl:text-6xl'>
        {place + "."}
      </p>
      <div className=' ml-2 flex w-full max-w-[800px] items-center md:h-16 xl:ml-5 '>
        <div className='hidden md:block'>
          <Avatar avatarURL={userAvatar} name={nick} lvl={lvl} />
        </div>
        <div
          className={`group mr-5 grid w-full  grid-cols-3 grid-rows-3 justify-items-center bg-second bg-opacity-75 px-2 radius-default hover:bg-opacity-90 md:h-16 md:grid-rows-1
        ${place === 1 ? "bg-yellow-500" : ""}
        ${place === 2 ? "bg-slate-400" : ""}
        ${place === 3 ? "bg-yellow-700" : ""}`}>
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
          <div className='col-span-3 flex h-full w-full items-center justify-evenly border-y-2 border-white/10  sm:border-y-0 md:col-span-1 md:w-[300px] md:justify-center '>
            <div className='flex  flex-col items-center md:justify-end md:px-2 '>
              <p className='text-xl xxs:text-3xl '>{statistics.points}</p>
              <p className='font-openSans text-xs font-bold leading-[15px] text-tertiary'>
                {t("points")}
              </p>
            </div>
            <div className='flex flex-col items-center md:justify-end md:px-2'>
              <p className='text-xl  xxs:text-3xl'>
                {convertMsToHM(
                  time.creativity + time.hearing + time.technique + time.theory
                )}
              </p>
              <p className='font-openSans text-xs font-bold leading-[15px] text-tertiary '>
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
