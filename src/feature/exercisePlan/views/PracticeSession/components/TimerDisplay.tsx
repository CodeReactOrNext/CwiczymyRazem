import "react-circular-progressbar/dist/styles.css";

import { cn } from "assets/lib/utils";
import { useMemo } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";

interface TimerDisplayProps {
  value: number;
  text: string;
  isPlaying: boolean;
  size?: "sm" | "md" | "lg";
}

export const TimerDisplay = ({
  value,
  text,
  isPlaying,
  size = "md",
}: TimerDisplayProps) => {
  const sizeClasses = {
    sm: "h-40 w-40",
    md: "h-44 w-44",
    lg: "h-48 w-48",
  };

  const getProgressColor = (val: number) => {
    if (val > 75) return "hsl(210, 90%, 60%)";
    if (val > 50) return "hsl(260, 90%, 60%)";
    if (val > 25) return "hsl(330, 90%, 60%)";
    return "hsl(0, 90%, 60%)";
  };

  // Use useMemo to avoid recalculating progress color on every render
  const progressColor = useMemo(() => getProgressColor(value), [value]);
  const mutedColor = "hsl(var(--muted))";
  const textSize = size === "sm" ? "24px" : size === "md" ? "28px" : "32px";

  return (
    <div className='relative font-sans'>
      <div className={cn("relative rounded-full", sizeClasses[size])}>
        <div className='absolute inset-0 p-[3px]'>
          <CircularProgressbar
            value={value}
            text={text}
            styles={buildStyles({
              pathColor: progressColor,
              textColor: "hsl(var(--foreground))",
              trailColor: "hsl(var(--muted)/0.1)",
              pathTransition: "none",
              textSize: textSize,
              strokeLinecap: "round",
            })}
          />
        </div>

        {/* Simple border that doesn't animate */}
        <div
          className='absolute inset-0 rounded-full border-2'
          style={{
            borderColor: progressColor,
            opacity: isPlaying ? 0.3 : 0.1,
          }}
        />
      </div>
    </div>
  );
};
