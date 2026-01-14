import { addZeroToTime, convertMsToHMObject } from "utils/converter";

export interface StopwatchProps {
  time: number;
  timerData: {
    creativity: number;
    hearing: number;
    technique: number;
    theory: number;
  };
  activeSkill?: "creativity" | "hearing" | "technique" | "theory" | null;
}
export const skillColors = {
  creativity: "#9C27B0",
  hearing: "#4CAF50",
  technique: "#FF5252",
  theory: "#2196F3",
};

const Stopwatch = ({ time, timerData, activeSkill = null }: StopwatchProps) => {
  const radius = 120;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const gap = 12;
  const getCircleOffset = (skillTime: number) => {
    const progress = (skillTime / (30 * 60 * 1000)) * 100;
    return circumference - (progress / 100) * circumference;
  };

  const getOpacity = (skill: string) => {
    if (!activeSkill) return 0.2;
    return skill === activeSkill ? 0.2 : 0.05;
  };

  const getStrokeOpacity = (skill: string) => {
    if (!activeSkill) return 1;
    return skill === activeSkill ? 1 : 0.2;
  };

  const getStrokeWidth = (skill: string) => {
    if (!activeSkill) return strokeWidth;
    return skill === activeSkill ? strokeWidth + 2 : strokeWidth - 1;
  };

  return (
    <div className='relative mb-6 h-64 w-64'>
      <svg
        className='absolute inset-0 -rotate-90 transform'
        width='100%'
        height='100%'
        viewBox='0 0 264 264'
        style={{ zIndex: 10 }}>
        {Object.keys(skillColors).map((skill, index) => {
          const color = skillColors[skill as keyof typeof skillColors];
          const r = radius - gap * index;
          const isActive = skill === activeSkill;

          const filterEffect =
            isActive && activeSkill
              ? `drop-shadow(0 0 2px ${color}80)`
              : "none";

          return (
            <g key={skill} style={{ filter: filterEffect }}>
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={getStrokeWidth(skill)}
                fill='none'
                opacity={getOpacity(skill)}
                style={{
                  transition: "opacity 0.5s ease, stroke-width 0.5s ease",
                }}
              />
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={getStrokeWidth(skill)}
                fill='none'
                strokeLinecap='round'
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: getCircleOffset(
                    timerData[skill as keyof StopwatchProps["timerData"]]
                  ),
                  transition: "all 0.5s ease",
                  opacity: getStrokeOpacity(skill),
                  filter: isActive ? "brightness(1.1)" : "brightness(1)",
                }}
              />
            </g>
          );
        })}
      </svg>

      <div className='absolute inset-0 flex flex-col items-center justify-center rounded-full text-white'>
        <div className='text-center'>
          <p className='font-sans text-5xl font-semibold tracking-wider'>
            {convertMsToHMObject(time).minutes}:
            {addZeroToTime(convertMsToHMObject(time).seconds)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
