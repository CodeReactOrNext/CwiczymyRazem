import "react-circular-progressbar/dist/styles.css";

import { cn } from "assets/lib/utils";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
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

  const [progressColor, setProgressColor] = useState(getProgressColor(value));
  const [prevIsPlaying, setPrevIsPlaying] = useState(isPlaying);
  const playStateAnimProgress = useMotionValue(isPlaying ? 1 : 0);

  useEffect(() => {
    if (prevIsPlaying !== isPlaying) {
      setPrevIsPlaying(isPlaying);
    }
  }, [isPlaying, prevIsPlaying]);

  useEffect(() => {
    const targetValue = isPlaying ? 1 : 0;
    playStateAnimProgress.set(targetValue);
  }, [isPlaying, playStateAnimProgress]);

  useEffect(() => {
    setProgressColor(getProgressColor(value));
  }, [value]);

  const mutedColor = "hsl(var(--muted))";
  const glowColor = isPlaying ? progressColor : mutedColor;
  const textSize = size === "sm" ? "24px" : size === "md" ? "28px" : "32px";

  return (
    <div className='relative font-sans'>
      <div
        className={cn(
          "relative rounded-full backdrop-blur-sm",
          sizeClasses[size]
        )}>
        <AnimatePresence>
          <motion.div
            key={`glow-${isPlaying}-${progressColor}`}
            className='absolute inset-[-2px] rounded-full'
            initial={{
              background: `conic-gradient(
                from ${isPlaying ? 0 : 180}deg, 
                transparent, 
                ${isPlaying ? mutedColor : glowColor}, 
                transparent
              )`,
            }}
            animate={{
              rotate: isPlaying ? 360 : 0,
              background: `conic-gradient(
                from ${isPlaying ? 0 : 180}deg, 
                transparent, 
                ${glowColor}, 
                transparent
              )`,
              opacity: 0.6,
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3 },
            }}
            transition={{
              rotate: {
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              },
              background: {
                duration: 0.6,
                ease: "easeInOut",
              },
              opacity: {
                duration: 0.6,
                ease: "easeInOut",
              },
            }}
          />
        </AnimatePresence>

        <div className='absolute inset-0 p-[3px]'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={`progress-${progressColor}-${isPlaying}`}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.5 }}>
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
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isPlaying && (
            <motion.div
              key='pulse-border'
              className='absolute inset-0 rounded-full border-2'
              initial={{
                scale: 1,
                opacity: 0,
                borderColor: mutedColor,
              }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.2, 0.4, 0.2],
                borderColor: progressColor,
              }}
              exit={{
                scale: 1,
                opacity: 0,
                transition: { duration: 0.3 },
              }}
              transition={{
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                borderColor: {
                  duration: 0.6,
                  ease: "easeInOut",
                },
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
