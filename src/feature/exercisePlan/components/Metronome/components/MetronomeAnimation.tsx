import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface MetronomeAnimationProps {
  isPlaying: boolean;
  bpm: number;
  currentBeat?: number;
}

export const MetronomeAnimation = ({
  isPlaying,
  bpm,
  currentBeat = 0,
}: MetronomeAnimationProps) => {
  const [animationKey, setAnimationKey] = useState(0);
  const lastBeatRef = useRef(currentBeat);

  const beatDuration = 60 / bpm;

  useEffect(() => {
    if (isPlaying && currentBeat !== lastBeatRef.current) {
      setAnimationKey((prevKey) => prevKey + 1);
      lastBeatRef.current = currentBeat;
    }
  }, [isPlaying, currentBeat]);

  if (!isPlaying) {
    return null;
  }

  const isFirstBeat = currentBeat % 4 === 0;

  return (
    <div className='flex w-fit items-center gap-2 rounded-md border border-primary/10 bg-primary/5 px-2 py-1'>
      <motion.div
        key={animationKey}
        className={`h-4 w-4 rounded-full ${
          isFirstBeat ? "bg-primary" : "bg-primary/70"
        }`}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: beatDuration * 0.8,
          ease: "easeOut",
          times: [0, 0.1, 1],
        }}
        aria-hidden='true'
      />
      <span className='text-xs font-medium text-primary'>
        {isFirstBeat ? "1" : ((currentBeat % 4) + 1).toString()}
      </span>
    </div>
  );
};
