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
  showExerciseInfo?: boolean;
  variant?: "default" | "compact";
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
  showExerciseInfo = true,
  variant = "default",
}: MainTimerSectionProps) => {
  if (variant === "compact") {
    return (
      <div className="flex w-full items-center justify-center gap-6 md:gap-12">
          {/* Compact Timer */}
          <div className="relative shrink-0">
             <TimerDisplay
                value={timeLeft}
                text={formattedTimeLeft}
                isPlaying={isPlaying}
                size="xs"
              />
          </div>

          {/* Compact Inline Controls */}
          <div className="flex items-center gap-6">
               <ExerciseControls
                  isPlaying={isPlaying}
                  isLastExercise={isLastExercise}
                  toggleTimer={toggleTimer}
                  handleNextExercise={handleNextExercise}
                  size="md"
                  variant="centered"
                />
               
               {/* Status Pill (Compact) */}
               <div className={`hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 ${isPlaying ? "border-emerald-500/20 bg-emerald-500/10" : "border-amber-500/20 bg-amber-500/10"}`}>
                   <div className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                   <span className={`text-[10px] uppercase tracking-wider font-bold ${isPlaying ? "text-emerald-400" : "text-amber-400"}`}>
                        {isPlaying ? "ON" : "PAUSED"}
                   </span>
               </div>
          </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={exerciseKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className='space-y-6'>
        {/* Conditionally render Exercise Information Card */}
        {showExerciseInfo && (
          <Card className='border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm'>
            <div className='bg-gradient-to-r from-zinc-800/30 to-zinc-800/10'>
              <ExerciseDescription exercise={currentExercise} />
            </div>
          </Card>
        )}

        {/* Timer Card - Always render when showExerciseInfo is false */}
        {!showExerciseInfo && (
          <Card className='border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm'>
            <div className='flex flex-col items-center gap-8 p-8'>
              {/* CRITICAL: Timer section - most important element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                className='relative'>
                {/* Subtle glow for timer importance */}
                <div className='via-cyan-500/8 absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-transparent blur-xl'></div>
                <TimerDisplay
                  value={timeLeft}
                  text={formattedTimeLeft}
                  isPlaying={isPlaying}
                  size='lg'
                />
              </motion.div>

              {/* SECONDARY: Action controls */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className='w-full'>
                <ExerciseControls
                  isPlaying={isPlaying}
                  isLastExercise={isLastExercise}
                  toggleTimer={toggleTimer}
                  handleNextExercise={handleNextExercise}
                  size='lg'
                />
              </motion.div>

              {/* TERTIARY: Status indicator - least important */}
              <div className='flex items-center gap-2 rounded-full border border-zinc-700/30 bg-zinc-800/40 px-3 py-1.5'>
                <div
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? "animate-pulse bg-emerald-400 shadow-sm shadow-emerald-400/50"
                      : "bg-amber-400 shadow-sm shadow-amber-400/30"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isPlaying ? "text-emerald-300" : "text-amber-300"
                  }`}>
                  {isPlaying ? "Aktywne" : "Wstrzymane"}
                </span>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
