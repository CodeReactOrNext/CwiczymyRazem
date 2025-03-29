import { Button } from "assets/components/ui/button";
import { motion } from "framer-motion";
import { FaPause, FaPlay, FaStepForward } from "react-icons/fa";

interface SessionModalControlsProps {
  isPlaying: boolean;
  isLastExercise: boolean;
  onClose: () => void;
  onFinish: () => void;
  toggleTimer: () => void;
  handleNextExercise: () => void;
}

export const SessionModalControls = ({
  isPlaying,
  isLastExercise,
  onClose,
  onFinish,
  toggleTimer,
  handleNextExercise,
}: SessionModalControlsProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className='fixed bottom-0 left-0 right-0 z-20 border-t bg-background/80 shadow-lg backdrop-blur-sm'>
      <div className='flex items-center justify-between p-4'>
        <Button
          variant='outline'
          onClick={onClose}
          className='w-24 border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
          Wyjdź
        </Button>

        <div className='flex gap-2'>
          <Button
            onClick={toggleTimer}
            className={`h-12 w-12 rounded-full shadow-md transition-all duration-200 hover:shadow-lg ${
              isPlaying ? "bg-primary/90 hover:bg-primary/80" : ""
            }`}>
            {isPlaying ? (
              <FaPause className='h-5 w-5' />
            ) : (
              <FaPlay className='h-5 w-5' />
            )}
          </Button>
          {!isLastExercise && (
            <Button
              variant='outline'
              onClick={handleNextExercise}
              className='h-12 w-12 rounded-full border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
              <FaStepForward className='h-5 w-5' />
            </Button>
          )}
        </div>

        <Button
          variant='outline'
          onClick={onFinish}
          className='w-24 border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
          Zakończ
        </Button>
      </div>
    </motion.div>
  );
};
