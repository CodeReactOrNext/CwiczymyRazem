import Achievement from "components/Achievement";
import Avatar from "components/Avatar";
import { achievements } from "data/achievements";
import { convertMsToHM } from "helpers/timeConverter";
import { useTranslation } from "react-i18next";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
interface LeadboardColumnProps {
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
}

const LeadboardColumn = ({ place, nick, statistics }: LeadboardColumnProps) => {
  const { t } = useTranslation("leadboard");
  const { lvl, time } = statistics;
  return (
    <div className='flex w-full justify-center p-5 text-xs xs:text-base'>
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
              <p className='text-xl uppercase text-tertiary'>Lvl </p>
              <p className='text-3xl text-main '>{lvl} </p>
            </div>
          </div>
          <div className='relative col-span-2 self-center justify-self-start md:col-span-1 '>
            <p className='whitespace-nowrap text-lg xs:text-2xl lg:text-xl xl:text-2xl'>
              {nick}
            </p>
            <div className='absolute top-[-20px] right-[-60px]  hidden items-center gap-x-1 md:top-[-35px] md:flex'>
              <p className='text-xl uppercase text-tertiary'>Lvl </p>
              <p className='text-4xl text-main  md:text-5xl'>
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
          <div className=' col-span-3 flex h-full w-full flex-col items-center justify-center  md:col-span-1  md:w-fit md:justify-end '>
            <div className='flex  text-base xxs:text-2xl lg:text-xl xl:text-2xl '>
              <FaAngleLeft className='cursor-pointer text-main-opposed hover:text-mainText' />
              <div className='flex w-[100px] justify-around text-base xxs:text-xl xs:w-[150px] lg:w-[100px] xl:w-[150px] '>
                {statistics.achievements.length === 0 && "Brak"}
                {statistics.achievements.map((achivId, index) => {
                  const achievementData = achievements.find(
                    (achiv) => achiv.id === achivId
                  );
                  const { Icon, description, rarity } = achievementData!;
                  return (
                    <Achievement
                      key={index}
                      Icon={Icon}
                      description={description}
                      rarity={rarity}
                    />
                  );
                })}
              </div>
              <FaAngleRight className='cursor-pointer text-main-opposed hover:text-mainText' />
            </div>
            <p className=' text-tertiary'>
              {t("achievements")} {statistics.achievements.length}/
              {achievements.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadboardColumn;
