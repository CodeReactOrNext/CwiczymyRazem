import { convertMsToHMObject } from "utils/converter";
import { FaPause, FaPlay } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface CategoryBox {
  title: string;
  chosen?: boolean;
  time: number;
  percent: number;
  onClick: () => void;
}

const CategoryBox = ({
  title,
  chosen,
  time,
  percent,
  onClick,
  timerEnabled,
  onStartStop,
}: CategoryBox & {
  timerEnabled?: boolean;
  onStartStop?: () => void;
}) => {
  const { t } = useTranslation("timer");
  const timeObject = convertMsToHMObject(time);
  
  return (
    <div
      className={`m-2 flex w-40 flex-col items-center justify-center p-6 rounded-lg transition-all
        ${chosen 
          ? "bg-gray-800 text-white shadow-lg" 
          : "bg-gray-900 text-gray-300 hover:bg-gray-800"
        }`}
    >
      <p className="text-2xl font-bold mb-1">
        {percent ? Math.round(percent) : 0}%
      </p>
      <p className="text-lg mb-1 font-medium">{title}</p>
      <p className="text-sm text-gray-400 mb-3">
        {timeObject.hours}:{timeObject.minutes}
      </p>
      
      {chosen ? (
        <button
          onClick={onStartStop}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          {timerEnabled ? (
            <>
              <FaPause size={14} />
              {t("pause")}
            </>
          ) : (
            <>
              <FaPlay size={14} />
              {t("start")}
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onClick}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          {t("choose")}
        </button>
      )}
    </div>
  );
};
export default CategoryBox;
