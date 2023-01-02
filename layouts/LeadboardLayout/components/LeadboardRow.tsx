import Avatar from "components/Avatar";
import { convertMsToHM } from "helpers/timeConverter";
import { useTranslation } from "react-i18next";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import Carousel from "./AchievementsCarousel";
interface LeadboardColumnProps {
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
}

const LeadboardRow = ({ place, nick, statistics }: LeadboardColumnProps) => {
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
          <Avatar name={nick} lvl={lvl} />
        </div>
        <div
          className={`mr-5 grid w-full grid-cols-3 grid-rows-3 justify-items-center  bg-second bg-opacity-75 px-2 md:h-16 md:grid-rows-1
        ${place === 1 ? "bg-yellow-500" : ""}
        ${place === 2 ? "bg-slate-400" : ""}
        ${place === 3 ? "bg-yellow-700" : ""}`}>
          <div className='relative top-[-15px] left-[-25px] block h-[65px] scale-75 justify-items-start md:hidden'>
            <Avatar name={nick} lvl={lvl} />
            <div className='absolute top-[5px] right-[-60px] flex  items-center gap-x-1 '>
              <p className='text-xl uppercase text-tertiary drop-shadow'>
                Lvl{" "}
              </p>
              <p className='text-3xl text-main drop-shadow'>{lvl} </p>
            </div>
          </div>
          <div className='relative col-span-2 self-center justify-self-start md:col-span-1 '>
            <p className='whitespace-nowrap text-lg xs:text-2xl lg:text-xl xl:text-2xl'>
              {shortenNick(nick)}
            </p>
            <div className='absolute top-[-20px] right-[-60px]  hidden items-center gap-x-1 md:top-[-35px] md:flex'>
              <p className='text-xl uppercase text-tertiary drop-shadow'>
                Lvl{" "}
              </p>
              <p className='text-4xl text-main drop-shadow md:text-5xl'>
                {statistics.lvl}
              </p>
            </div>
          </div>
          <div className='col-span-3 flex h-full w-full items-center justify-evenly md:col-span-1 md:w-[300px]  md:justify-center  md:gap-x-5'>
            <div className='flex  flex-col items-center md:justify-end md:px-2 '>
              <p className='text-xl leading-[22px] xxs:text-3xl '>
                {statistics.points}
              </p>
              <p className='leading-[25px]  text-tertiary'>{t("points")}</p>
            </div>
            <div className='flex  flex-col items-center md:justify-end md:px-2'>
              <p className='text-xl leading-[22px] xxs:text-3xl'>
                {convertMsToHM(
                  time.creativity + time.hearing + time.technique + time.theory
                )}
              </p>
              <p className='  leading-[25px] text-tertiary'>
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
