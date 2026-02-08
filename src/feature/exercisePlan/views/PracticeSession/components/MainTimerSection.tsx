import { Card } from "assets/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { FaHistory } from "react-icons/fa";
import type { TimerInterface } from "types/api.types";
import { convertMsToHMS } from "utils/converter/timeConverter";

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
  showExerciseInfo?: boolean;
  variant?: "default" | "compact";
  sessionTimerData?: TimerInterface;
  exerciseTimeSpent?: number;
  canSkipExercise?: boolean;
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
  showExerciseInfo = true,
  variant = "default",
  sessionTimerData,
  exerciseTimeSpent = 0,
  canSkipExercise = true
}: MainTimerSectionProps) => {
  const { t } = useTranslation(["common"]);

  const totalSessionMs = sessionTimerData 
    ? (sessionTimerData.creativity + sessionTimerData.hearing + sessionTimerData.technique + sessionTimerData.theory)
    : 0;

  if (variant === "compact") {
    const formattedTotalSession = convertMsToHMS(totalSessionMs);

    return (
      <div className="flex items-center gap-8 relative">
          {/* Playalong Progress Bar (Linear) */}
          {currentExercise.isPlayalong && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[300px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-red-500 transition-all duration-300" 
                    style={{ width: `${timerProgressValue}%` }}
                />
            </div>
          )}
          
          {/* Session Stats (Left) */}
          <div className="flex items-center gap-4 border-r border-white/10 pr-8 mr-4">
             <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Session</span>
                <div className="flex items-center gap-2 text-white">
                    <FaHistory className="h-3.5 w-3.5 text-cyan-500/50" />
                    <span className="font-mono text-lg font-black tracking-wide">{formattedTotalSession}</span>
                </div>
             </div>
          </div>

          {/* Exercise Time Display */}
          <div className="flex flex-col items-start gap-1">
             <div className="flex items-center gap-2">
                 <div className="font-mono text-3xl font-black text-white leading-none tracking-tight">
                     {formattedTimeLeft}
                 </div>
             </div>
          </div>

          {/* Compact Inline Controls */}
          <div className="flex items-center gap-4">
               <ExerciseControls
                  isPlaying={isPlaying}
                  isLastExercise={isLastExercise}
                  toggleTimer={toggleTimer}
                  handleNextExercise={handleNextExercise}
                  size="md"
                  variant="centered"
                  canSkipExercise={canSkipExercise}
                />
               
               {/* Status Pill (Compact) - Integrated */}
               <div className="flex items-center gap-2 px-1 transition-colors">
                   <div className={`h-1.5 w-1.5 rounded-full transition-all ${
                       isPlaying ? "bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.6)]" : "bg-zinc-600"
                   }`} />
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
          <Card className='radius-premium glass-card border-white/5 relative overflow-hidden'>
            {/* Playalong Progress Bar (Top) */}
            {currentExercise.isPlayalong && (
               <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-800">
                  <div 
                      className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-300" 
                      style={{ width: `${timerProgressValue}%` }}
                  />
               </div>
            )}
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
                <div className='absolute inset-0 rounded-full bg-cyan-500/5 blur-xl'></div>
                <TimerDisplay
                  value={timerProgressValue}
                  text={formattedTimeLeft}
                  isPlaying={isPlaying}
                  size='lg'
                />
                
                {/* Time Info (Default) */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-max">
                    <div className="flex items-center gap-6 bg-zinc-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/70 mb-1.5">Session Total</span>
                            <div className="flex items-center gap-2">
                                <FaHistory className="h-3 w-3 text-cyan-500/50" />
                                <span className="text-base font-mono font-black text-cyan-400 tracking-wide">
                                    {convertMsToHMS(totalSessionMs)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
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
                  canSkipExercise={canSkipExercise}
                />
              </motion.div>

              {/* TERTIARY: Status indicator - least important */}
              <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-500 ${
                  isPlaying 
                    ? "border-cyan-500/40 bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-105" 
                    : "border-white/5 bg-zinc-800/40"
              }`}>
                <div
                  className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-300 ${
                    isPlaying
                      ? "animate-pulse bg-cyan-400"
                      : "bg-zinc-500"
                  }`}
                />
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
