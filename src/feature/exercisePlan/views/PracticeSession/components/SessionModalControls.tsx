import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { FaPause, FaPlay, FaStepForward, FaCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";

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

        <div className='flex items-center gap-4'>
          <Button
            onClick={toggleTimer}
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full border border-white/5 bg-white/5 transition-all duration-300",
              isPlaying ? "text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "text-zinc-400"
            )}>
            {isPlaying ? (
              <FaPause className='h-5 w-5' />
            ) : (
              <FaPlay className='h-5 w-5 ml-1' />
            )}
          </Button>

          <Button
            onClick={isLastExercise ? onFinish : handleNextExercise}
            disabled={isFinishing || isSubmittingReport || !canSkipExercise}
            className={cn(
              "h-12 px-6 radius-premium font-black text-[10px] tracking-[0.2em] transition-all uppercase click-behavior",
              isLastExercise 
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400" 
                : "bg-white text-black shadow-lg shadow-white/10 hover:bg-zinc-200",
              !canSkipExercise && "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500 hover:bg-zinc-800 shadow-none border border-white/5"
            )}
          >
            {isFinishing || isSubmittingReport ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                <span>Saving...</span>
              </div>
            ) : isLastExercise ? (
              <span className="flex items-center gap-2">{t("common:finish_session")} <FaCheck className="h-3 w-3" /></span>
            ) : (
              <span className="flex items-center gap-2">{t("common:next_step")} <FaStepForward className="h-3 w-3" /></span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
