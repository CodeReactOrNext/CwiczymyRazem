import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { FaCheck,FaPause, FaPlay, FaStepForward } from "react-icons/fa";

interface SessionModalControlsProps {
  isPlaying: boolean;
  isLastExercise: boolean;
  onClose: () => void;
  onFinish: () => void;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  canSkipExercise?: boolean;
}

export const SessionModalControls = ({
  isPlaying,
  isLastExercise,
  onClose,
  onFinish,
  toggleTimer,
  handleNextExercise,
  isFinishing,
  isSubmittingReport,
  canSkipExercise = true,
}: SessionModalControlsProps) => {
  const { t } = useTranslation(["common", "exercises"]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-zinc-950/80 shadow-2xl backdrop-blur-xl'>
      <div className='flex items-center justify-between p-4 gap-3'>
        <Button
          variant='ghost'
          onClick={onClose}
          className='px-4 text-zinc-500 hover:text-white transition-colors'>
          {t("common:practice.exit")}
        </Button>

        <div className='flex items-center gap-3'>
          <Button
            onClick={toggleTimer}
            className={cn(
              "h-12 px-8 radius-premium font-black text-[10px] tracking-[0.2em] transition-all uppercase click-behavior",
              isPlaying 
                ? "bg-white text-black shadow-lg shadow-white/10" 
                : "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
            )}>
            {isPlaying ? (
              <span className="flex items-center gap-2">PAUSE <FaPause className='h-3 w-3' /></span>
            ) : (
              <span className="flex items-center gap-2">START <FaPlay className='h-3 w-3' /></span>
            )}
          </Button>

          <Button
            onClick={isLastExercise ? onFinish : handleNextExercise}
            disabled={isFinishing || isSubmittingReport || !canSkipExercise}
            variant="ghost"
            size="icon"
             className={cn(
              "h-12 w-12 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white transition-all",
              !canSkipExercise && "opacity-50 cursor-not-allowed"
            )}
          >
            {isFinishing || isSubmittingReport ? (
              <div className="h-3 w-3 border-2 border-zinc-500/20 border-t-zinc-500 animate-spin rounded-full" />
            ) : isLastExercise ? (
              <FaCheck className="h-5 w-5" />
            ) : (
              <FaStepForward className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
