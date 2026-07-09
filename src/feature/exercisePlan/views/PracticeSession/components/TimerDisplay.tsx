import "react-circular-progressbar/dist/styles.css";

import { cn } from "assets/lib/utils";
import type { CSSProperties } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";

interface TimerDisplayProps {
  value: number;
  text: string;
  isPlaying: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  x: `${50 + 45 * Math.cos(i * (Math.PI / 6))}%`,
  y: `${50 + 45 * Math.sin(i * (Math.PI / 6))}%`,
  delay: i * 0.15,
}));

export const TimerDisplay = ({
  value,
  text,
  isPlaying,
  size = "md",
}: TimerDisplayProps) => {
  const sizeClasses = {
    xs: "h-24 w-24",
    sm: "h-40 w-40",
    md: "h-44 w-44",
    lg: "h-48 w-48",
  };

  const getProgressColor = () => {
    // Theme consistency: Use Cyan/Teal range
    if (value > 66) return "#06b6d4"; // cyan-500
    if (value > 33) return "#22d3ee"; // cyan-400
    return "#67e8f9"; // cyan-300
  };

  const progressColor = getProgressColor();
  const glowColor = isPlaying ? progressColor : "hsl(var(--muted))";
  const textSize = size === "xs" ? "20px" : size === "sm" ? "24px" : size === "md" ? "28px" : "32px";

  return (
    <div className='relative'>
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg blur-[20px] transition-all duration-700",
          sizeClasses[size]
        )}
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isPlaying ? 0.3 : 0.1,
        }}
      />

      <div
        className={cn(
          "relative rounded-lg bg-zinc-900/50",
          sizeClasses[size]
        )}>
        {isPlaying && (
          <div className='absolute inset-0 overflow-hidden rounded-lg'>
            {PARTICLES.map((particle, i) => (
              <div
                key={i}
                className='absolute h-1 w-1 rounded-lg bg-white animate-timer-particle'
                style={{
                  "--particle-x": particle.x,
                  "--particle-y": particle.y,
                  animationDelay: `${particle.delay}s`,
                } as CSSProperties}
              />
            ))}
          </div>
        )}

        <div
          className={cn(
            "absolute inset-[-2px] rounded-lg",
            isPlaying && "animate-[spin_8s_linear_infinite]"
          )}
          style={{
            background: `conic-gradient(
              from ${isPlaying ? 0 : 180}deg,
              transparent,
              ${glowColor},
              transparent
            )`,
            opacity: 0.6,
          }}
        />

        <div className='absolute inset-0 p-[3px] font-sans'>
          <CircularProgressbar
            value={value}
            text={text}
            strokeWidth={10}
            styles={buildStyles({
              pathColor: progressColor,
              textColor: "white",
              trailColor: "rgba(255,255,255, 0.05)",
              pathTransition: isPlaying
                ? "stroke-dashoffset 0.5s linear"
                : "none",
              textSize: textSize,
              strokeLinecap: "round",
            })}
          />
        </div>

        {isPlaying && (
          <div
            className='absolute inset-0 rounded-lg animate-timer-pulse-glow'
            style={{ backgroundColor: progressColor + "20" }}
          />
        )}
      </div>
    </div>
  );
};
