import { Card } from "assets/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["common"]);

  if (variant === "compact") {
    return (
      <div className="flex w-full items-center justify-center gap-6 md:gap-12">
          {/* Compact Timer */}
          <div className="relative shrink-0">
             {/* Subtle timer glow */}
             <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl transition-all duration-500" style={{ opacity: isPlaying ? 0.6 : 0 }}></div>
             <TimerDisplay
                value={timerProgressValue}
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
               
               {/* Status Pill (Compact) - Refined */}
               <div className={`hidden md:flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                   isPlaying 
                     ? "border-cyan-500/20 bg-cyan-500/10" 
                     : "border-zinc-700/50 bg-zinc-800/50"
               }`}>
                   <div className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-all ${
                       isPlaying ? "bg-cyan-400 animate-pulse" : "bg-zinc-500"
                   }`} />
                   <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${
                       isPlaying ? "text-cyan-400" : "text-zinc-500"
                   }`}>
                        {isPlaying ? t("common:timer_status.active") : t("common:timer_status.paused")}
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
                  value={timerProgressValue}
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
              <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${
                  isPlaying 
                    ? "border-cyan-500/20 bg-cyan-500/10" 
                    : "border-zinc-700/30 bg-zinc-800/40"
              }`}>
                <div
                  className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-300 ${
                    isPlaying
                      ? "animate-pulse bg-cyan-400"
                      : "bg-zinc-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isPlaying ? "text-cyan-300" : "text-zinc-400"
                  }`}>
                  {isPlaying ? t("common:timer_status.active") : t("common:timer_status.paused")}
                </span>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
