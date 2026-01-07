import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaRedo, FaTrophy } from "react-icons/fa";

interface ExerciseCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  exerciseTitle: string;
  duration: number;
}

export const ExerciseCompleteDialog = ({
  isOpen,
  onClose,
  onRestart,
  exerciseTitle,
  duration,
}: ExerciseCompleteDialogProps) => {
  const { t } = useTranslation("exercises");

  const handleConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md z-[99999999]'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            <div className='flex flex-col items-center gap-4'>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                onAnimationComplete={handleConfetti}>
                <div className='rounded-full bg-primary/10 p-3'>
                  <FaTrophy className='h-6 w-6 text-primary' />
                </div>
              </motion.div>
              <span>{t("exercise_complete.title")}</span>
            </div>
          </DialogTitle>
          <DialogDescription className='text-center'>
            <p className='mt-2 text-lg font-medium'>{exerciseTitle}</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t("exercise_complete.duration", { duration })}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-row gap-2 sm:justify-center'>
          <Button variant='outline' onClick={onRestart}>
            <FaRedo className='mr-2 h-4 w-4' />
            {t("exercise_complete.repeat")}
          </Button>
          <Button onClick={onClose}>{t("exercise_complete.continue")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
