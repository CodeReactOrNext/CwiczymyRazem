import { motion } from "framer-motion";

import { TimerDisplay } from "./TimerDisplay";

interface MobileTimerDisplayProps {
  timerProgressValue: number;
  formattedTimeLeft: string;
  isPlaying: boolean;
}

export const MobileTimerDisplay = ({
  timerProgressValue,
  formattedTimeLeft,
  isPlaying,
}: MobileTimerDisplayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className='mb-8 flex justify-center'>
      <div className='relative'>
        <div
          className='absolute -inset-8 -z-20 rounded-full opacity-20 blur-lg'
          style={{
            background: `radial-gradient(circle, var(--tw-gradient-from) 0%, transparent 70%)`,
          }}
        />

        <TimerDisplay
          value={timerProgressValue}
          text={formattedTimeLeft}
          isPlaying={isPlaying}
          size='sm'
        />
      </div>
    </motion.div>
  );
};
