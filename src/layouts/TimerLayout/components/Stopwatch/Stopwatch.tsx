import { useTranslation } from "react-i18next";
import { FaPause, FaPlay } from "react-icons/fa";
import { addZeroToTime, convertMsToHMObject } from "utils/converter";
export interface StopwachProps {
  time: number;
  timerEnabled: boolean;
  isSkillChosen: boolean;
  startTimer: () => void;
  stopTimer: () => void;
}

const Stopwatch = ({
  time,
  timerEnabled,
  startTimer,
  stopTimer,
  isSkillChosen,
}: StopwachProps) => {
  const { t } = useTranslation("timer");

  return (
    <div className='mb-6 grid h-52 w-52 grid-rows-3 items-center rounded-full border-2 border-tertiary-50 bg-main-opposed-700 bg-gradient-to-tr  from-main-opposed-600 to-main-opposed-700 text-7xl tracking-wider  text-tertiary shadow-inset-cool shadow-main-opposed-400 xs:h-64 xs:w-64 sm:text-8xl'>
      <div className=' row-start-1 flex justify-evenly justify-self-center p-6'>
        <div className='row-start-1 flex w-10 flex-col items-center  text-lg'>
          <p className='text-2xl leading-none '>
            {addZeroToTime(convertMsToHMObject(time).seconds)}
          </p>
          <div
            className='h-1 bg-main-opposed-50 '
            style={{ width: convertMsToHMObject(time).seconds }}></div>
          <p className='font-openSans text-[0.6rem]'>{t("seconds")}</p>
        </div>
      </div>
      <div className=' row-start-2 flex w-full justify-evenly justify-self-center p-5'>
        <p>{convertMsToHMObject(time).hours}</p>
        <span className={`${timerEnabled ? "animate-pulse" : ""} `}>:</span>
        <p>{convertMsToHMObject(time).minutes}</p>
      </div>

      {isSkillChosen && (
        <div className='row-start-3  text-center text-sm text-tertiary'>
          {timerEnabled ? (
            <button
              className='text-mainText hover:text-tertiary active:click-behavior-second'
              onClick={() => stopTimer()}>
              <FaPause size={35} />
              {t("pause")}
            </button>
          ) : (
            <button
              className='text-mainText hover:text-tertiary active:click-behavior-second '
              onClick={() => startTimer()}>
              <FaPlay size={35} /> {t("start")}
            </button>
          )}
        </div>
      )}
      {!isSkillChosen && (
        <p className='m-auto w-24 text-center text-sm text-mainText'>
          {t("choose")}
        </p>
      )}
    </div>
  );
};

export default Stopwatch;
