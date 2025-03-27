import "react-circular-progressbar/dist/styles.css";

import { motion } from "framer-motion";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";

interface TimerDisplayProps {
  value: number;
  text: string;
  isPlaying: boolean;
  size?: "sm" | "md" | "lg";
}

const TimerDisplay = ({
  value,
  text,
  isPlaying,
  size = "md",
}: TimerDisplayProps) => {
  // Define sizes for different display variants
  const sizeClasses = {
    sm: "h-40 w-40",
    md: "h-44 w-44",
    lg: "h-48 w-48",
  };

  return (
    <div className='relative'>
      <div className={`relative ${sizeClasses[size]}`}>
        <CircularProgressbar
          value={value}
          text={text}
          styles={buildStyles({
            pathColor: isPlaying ? "hsl(var(--primary))" : "hsl(var(--muted))",
            textColor: "hsl(var(--foreground))",
            trailColor: "hsl(var(--muted)/0.2)",
            pathTransition: isPlaying
              ? "stroke-dashoffset 0.5s linear"
              : "none",
            textSize: size === "sm" ? "24px" : "28px",
            strokeLinecap: "round",
          })}
        />
        {isPlaying && (
          <motion.div
            className='absolute inset-0 rounded-full border-2 border-primary/30'
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;
