import { convertMsToHMObject } from "utils/converter";
import { useTranslation } from "react-i18next";
import { VscDebugStart, VscDebugPause } from "react-icons/vsc";

interface CategoryBox {
  title: string;
  chosen?: boolean;
  time: number;
  percent: number;
  timerEnabled: boolean;
  skillColor: string;
  onStart: () => void;
  onStop: () => void;
}

const CategoryBox = ({
  title,
  chosen,
  time,
  percent,
  onStart,
  onStop,
  skillColor,
  timerEnabled,
}: CategoryBox) => {
  const { t } = useTranslation("timer");
  const timeObject = convertMsToHMObject(time);

  return (
    <div
      className={`w m-2 flex flex-col  justify-center rounded-lg border border-dashed  bg-second p-6 px-12 transition-all
        ${
          chosen
            ? "text-whit !border-solid  border-white bg-second"
            : " border-second-200  text-secondText transition-colors hover:bg-second-400"
        }`}>
      <p className='mb-3 flex items-center gap-2 font-openSans text-xl font-semibold '>
        {title}{" "}
        <span
          className={`  inline-flex h-2 w-2 rounded-full bg-[${skillColor}] ${
            timerEnabled && chosen ? "animate-pulse" : ""
          }`}></span>
      </p>
      <p className='mb-1 font-openSans text-sm font-normal'>
        Procent:{" "}
        <span className='font-semibold text-white'>
          {percent ? Math.round(percent) : 0}%
        </span>
      </p>

      <p className='mb-1 font-openSans text-sm font-normal'>
        Czas:{" "}
        <span className='font-semibold text-white'>
          {timeObject.hours}:{timeObject.minutes}
        </span>
      </p>

      <button
        onClick={timerEnabled && chosen ? onStop : onStart}
        className='${} mt-5 flex items-center justify-center gap-2 rounded-md bg-white  px-4 py-1 font-openSans text-black transition-colors transition-colors first-letter:uppercase hover:bg-white/80 '>
        {timerEnabled && chosen ? (
          <>
            <VscDebugPause />
            {t("pause")}
          </>
        ) : (
          <>
            <VscDebugStart />
            {t("start")}
          </>
        )}
      </button>
    </div>
  );
};
export default CategoryBox;
