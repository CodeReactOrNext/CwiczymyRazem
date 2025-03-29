import { Card } from "assets/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";

import { ExerciseDescription } from "../../../components/ExerciseDescription";
import ExerciseControls from "./ExerciseControls";
import { TimerDisplay } from "./TimerDisplay";

interface MainTimerSectionProps {
  exerciseKey: number;
  currentExercise: any;
  isLastExercise: boolean;
  isPlaying: boolean;
  timerProgressValue: number;
  formattedTimeLeft: string;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  timeLeft: number;
}

export const MainTimerSection = ({
  exerciseKey,
  currentExercise,
  isLastExercise,
  isPlaying,
  timerProgressValue,
  formattedTimeLeft,
  toggleTimer,
  handleNextExercise,
  timeLeft,
}: MainTimerSectionProps) => {
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={exerciseKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className='space-y-6'>
        <Card className='relative overflow-hidden rounded-xl border-2 border-primary/20 bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-200'>
          <div className='absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent' />
          <div className='relative'>
            <ExerciseDescription exercise={currentExercise} />

            <div className='flex flex-col items-center gap-8 p-8 pt-0'>
              <div className='relative'>
                <div
                  className='absolute -inset-10 -z-20 rounded-full opacity-10 blur-xl'
                  style={{
                    background: `radial-gradient(circle, var(--tw-gradient-from) 0%, transparent 70%)`,
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}>
                  <TimerDisplay
                    value={timeLeft}
                    text={formattedTimeLeft}
                    isPlaying={isPlaying}
                    size='lg'
                  />
                </motion.div>
              </div>

              <ExerciseControls
                isPlaying={isPlaying}
                isLastExercise={isLastExercise}
                toggleTimer={toggleTimer}
                handleNextExercise={handleNextExercise}
                size='lg'
              />
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
