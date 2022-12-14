import { convertMsToHMObject } from "utils/converter/timeConverter";
import { useTranslation } from "react-i18next";
import { FaPause, FaPlay } from "react-icons/fa";

export interface StopwachProps {
  time: number;
  timerEnabled: boolean;
  startTimer: () => void;
  stopTimer: () => void;
}

const Stopwatch = ({
  time,
  timerEnabled,
  startTimer,
  stopTimer,
}: StopwachProps) => {
  const { t } = useTranslation("timer");
  return (
    <div className='mb-6 grid h-52 w-52 grid-rows-3 items-center rounded-full border-2 border-white bg-main-opposed-700 text-7xl tracking-wider text-tertiary xs:h-64 xs:w-64 sm:text-8xl'>
      <div className=' row-start-1 flex justify-evenly justify-self-center p-6'>
        <div className='row-start-1 flex w-10 flex-col items-center  text-lg'>
          <p className='text-2xl leading-none'>
            {convertMsToHMObject(time).seconds}
          </p>
          <div
            className='h-1 bg-white '
            style={{ width: convertMsToHMObject(time).seconds }}></div>
          <p className='text-xs'>{t("seconds")}</p>
        </div>
      </div>
      <div className=' row-start-2 flex w-full justify-evenly justify-self-center p-6'>
        <p>{convertMsToHMObject(time).hours}</p>
        <span className={`${timerEnabled ? "animate-pulse" : ""} `}>:</span>
        <p>{convertMsToHMObject(time).minutes}</p>
      </div>
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
    </div>
  );
};

export default Stopwatch;
