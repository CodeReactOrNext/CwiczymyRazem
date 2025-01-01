import { addZeroToTime, convertMsToHMObject } from "utils/converter";

export interface StopwatchProps {
  time: number;
  timerData: {
    creativity: number;
    hearing: number;
    technique: number;
    theory: number;
  };
}
export const skillColors = {
  creativity: "#4CAF50",
  hearing: "#2196F3",
  technique: "#FFC107",
  theory: "#9C27B0",
};

const Stopwatch = ({ time, timerData }: StopwatchProps) => {
  const radius = 120;
  const strokeWidth = 3; 
  const circumference = 2 * Math.PI * radius;
  const gap = 8;
  const getCircleOffset = (skillTime: number) => {
    const progress = (skillTime / (30 * 60 * 1000)) * 100;
    return circumference - (progress / 100) * circumference;
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
          return (
            <g key={skill}>
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={strokeWidth}
                fill='none'
                opacity='0.2'
              />
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={strokeWidth}
                fill='none'
                strokeLinecap='round'
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: getCircleOffset(
                    timerData[skill as keyof StopwatchProps["timerData"]]
                  ),
                  transition: "stroke-dashoffset 0.5s ease",
                }}
              />
            </g>
          );
        })}
      </svg>

      <div className='absolute inset-0 flex flex-col items-center justify-center rounded-full  text-white'>
        <div className='text-center'>
          <p className='text-6xl font-semibold tracking-wider'>
            {convertMsToHMObject(time).minutes}:
            {addZeroToTime(convertMsToHMObject(time).seconds)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
