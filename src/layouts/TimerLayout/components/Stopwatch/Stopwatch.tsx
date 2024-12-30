import { useTranslation } from "react-i18next";
import { FaPause, FaPlay } from "react-icons/fa";
import { addZeroToTime, convertMsToHMObject } from "utils/converter";

export interface StopwatchProps {
  time: number;
  timerEnabled: boolean;
  isSkillChosen: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  chosenSkill?: 'creativity' | 'hearing' | 'technique' | 'theory';
  timerData: {
    creativity: number;
    hearing: number;
    technique: number;
    theory: number;
  };
}

const Stopwatch = ({
  time,
  timerEnabled,
  startTimer,
  stopTimer,
  isSkillChosen,
  chosenSkill,
  timerData,
}: StopwatchProps) => {
  const { t } = useTranslation("timer");

  // Calculate circle progress
  const radius = 120;
  const strokeWidth = 3; // Made thinner
  const circumference = 2 * Math.PI * radius;
  const gap = 8; // Gap between circles
 const getCircleOffset = (skillTime: number) => {
    const progress = (skillTime / (30 * 60 * 1000)) * 100;
    return circumference - (progress / 100) * circumference;
  };
  return (
    <div className='relative mb-6 h-64 w-64'>
      <svg
        className="absolute inset-0 -rotate-90 transform"
        width="100%"
        height="100%"
        viewBox="0 0 264 264"
        style={{ zIndex: 10 }}
      >
        {/* Skill circles */}
        {[
          { skill: 'creativity', color: '#4CAF50', radius: radius },
          { skill: 'hearing', color: '#2196F3', radius: radius - gap },
          { skill: 'technique', color: '#FFC107', radius: radius - (gap * 2) },
          { skill: 'theory', color: '#9C27B0', radius: radius - (gap * 3) }
        ].map(({ skill, color, radius: r }) => (
          <g key={skill}>
            <circle
              cx="132"
              cy="132"
              r={r}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              opacity="0.2"
            />
            <circle
              cx="132"
              cy="132"
              r={r}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: getCircleOffset(timerData[skill]),
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          </g>
        ))}
      </svg>

      {/* Timer Content */}
      <div className='absolute inset-0 flex flex-col items-center justify-center rounded-full bg-gray-900 text-white'>
        <div className='text-center'>
          <p className='text-sm text-gray-400 mb-1'>{t("seconds")}</p>
          <p className='text-6xl font-bold tracking-wider mb-2'>
            {convertMsToHMObject(time).minutes}:{addZeroToTime(convertMsToHMObject(time).seconds)}
          </p>
          {isSkillChosen ? (
            <button
              className='mt-2 text-white hover:text-gray-300 transition-colors'
              onClick={timerEnabled ? stopTimer : startTimer}
            >
              <span className="text-sm block mb-1">{timerEnabled ? t("pause") : t("start")}</span>
              {timerEnabled ? (
                <FaPause size={24} className="mx-auto" />
              ) : (
                <FaPlay size={24} className="mx-auto" />
              )}
            </button>
          ) : (
            <p className='mt-2 text-sm text-gray-400'>{t("choose")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
