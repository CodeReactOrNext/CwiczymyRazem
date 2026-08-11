import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import {
  FaCheck,
  FaPause,
  FaPlay,
  FaStepBackward,
  FaStepForward,
  FaUndo,
} from "react-icons/fa";

interface SessionModalControlsProps {
  isPlaying: boolean;
  isLastExercise: boolean;
  onFinish: () => void;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  handleBackExercise: () => void;
  currentExerciseIndex: number;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  onRestart?: () => void;
  examMode?: boolean;
}

export const SessionModalControls = ({
  isPlaying,
  isLastExercise,
  onFinish,
  toggleTimer,
  handleNextExercise,
  isFinishing,
  isSubmittingReport,
  handleBackExercise,
  currentExerciseIndex,
  onRestart,
  examMode,
}: SessionModalControlsProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className='pb-safe bg-zinc-950/80 backdrop-blur-xl'>
      {/* Transport only — leaving the session lives in the header's close
          button, so the phone's bottom row stays a set of big tap targets. */}
      <div className='flex items-center justify-center gap-2 px-3 py-3'>
        {currentExerciseIndex > 0 && (
          <Button
            onClick={handleBackExercise}
            variant='ghost'
            size='icon'
            className='h-12 w-12 rounded-lg bg-white/5 text-zinc-400 transition-all hover:text-white'>
            <FaStepBackward className='h-4 w-4' />
          </Button>
        )}

        {onRestart && (
          <Button
            onClick={onRestart}
            variant='ghost'
            size='icon'
            className='h-12 w-12 rounded-lg bg-white/5 text-amber-400 transition-all hover:bg-amber-500/10 hover:text-amber-300'>
            <FaUndo className='h-4 w-4' />
          </Button>
        )}

        <Button
          onClick={toggleTimer}
          className={cn(
            "h-12 rounded-lg px-8 text-[10px] font-black tracking-[0.2em] transition-all click-behavior",
            isPlaying
              ? "bg-white text-black shadow-lg shadow-white/10"
              : "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20",
          )}>
          {isPlaying ? (
            <span className='flex items-center gap-2'>
              PAUSE <FaPause className='h-3 w-3' />
            </span>
          ) : (
            <span className='flex items-center gap-2'>
              START <FaPlay className='h-3 w-3' />
            </span>
          )}
        </Button>

        {!examMode && (
          <Button
            onClick={isLastExercise ? onFinish : handleNextExercise}
            disabled={isFinishing || isSubmittingReport}
            variant='ghost'
            size='icon'
            className={cn(
              "h-12 w-12 rounded-lg bg-white/5 text-zinc-400 transition-all hover:text-white",
            )}>
            {isFinishing || isSubmittingReport ? (
              <div className='h-3 w-3 animate-spin rounded-lg border-2 border-zinc-500/20 border-t-zinc-500' />
            ) : isLastExercise ? (
              <FaCheck className='h-5 w-5' />
            ) : (
              <FaStepForward className='h-5 w-5' />
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
};
