import "react-circular-progressbar/dist/styles.css";

import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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

  const getProgressColor = () => {
    if (value > 75) return "hsl(210, 90%, 60%)";
    if (value > 50) return "hsl(260, 90%, 60%)";
    if (value > 25) return "hsl(330, 90%, 60%)";
    return "hsl(0, 90%, 60%)";
  };

  const progressColor = getProgressColor();
  const glowColor = isPlaying ? progressColor : "hsl(var(--muted))";
  const textSize = size === "sm" ? "24px" : size === "md" ? "28px" : "32px";

  return (
    <div className='relative'>
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[25px] transition-all duration-700",
          sizeClasses[size]
        )}
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isPlaying ? 0.25 : 0.1,
        }}
      />

      <div
        className={cn(
          "relative rounded-full backdrop-blur-sm",
          sizeClasses[size]
        )}>
        <AnimatePresence>
          {isPlaying && (
            <div className='absolute inset-0 overflow-hidden rounded-full'>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute h-1 w-1 rounded-full bg-white'
                  initial={{
                    x: "50%",
                    y: "50%",
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: `${50 + 45 * Math.cos(i * (Math.PI / 6))}%`,
                    y: `${50 + 45 * Math.sin(i * (Math.PI / 6))}%`,
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.div
          className='absolute inset-[-2px] rounded-full'
          style={{
            background: `conic-gradient(
              from ${isPlaying ? 0 : 180}deg, 
              transparent, 
              ${glowColor}, 
              transparent
            )`,
            opacity: 0.6,
          }}
          animate={{
            rotate: isPlaying ? 360 : 0,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className='absolute inset-0 p-[3px] font-sans'>
          <CircularProgressbar
            value={value}
            text={text}
            styles={buildStyles({
              pathColor: progressColor,
              textColor: "hsl(var(--foreground))",
              trailColor: "hsl(var(--muted)/0.1)",
              pathTransition: isPlaying
                ? "stroke-dashoffset 0.5s linear"
                : "none",
              textSize: textSize,
              strokeLinecap: "round",
            })}
          />
        </div>

        {isPlaying && (
          <motion.div
            className='absolute inset-0 rounded-full border-2'
            style={{ borderColor: progressColor }}
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </div>
  );
};
