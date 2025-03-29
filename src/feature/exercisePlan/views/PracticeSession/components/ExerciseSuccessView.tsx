import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaCheck, FaTrophy } from "react-icons/fa";

interface ExerciseSuccessViewProps {
  planTitle: string;
  onFinish: () => void;
  onRestart?: () => void;
}

export const ExerciseSuccessView = ({
  planTitle,
  onFinish,
  onRestart,
}: ExerciseSuccessViewProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: [
            "#26ccff",
            "#a25afd",
            "#ff5e7e",
            "#88ff5a",
            "#fcff42",
            "#ffa62d",
          ],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: [
            "#26ccff",
            "#a25afd",
            "#ff5e7e",
            "#88ff5a",
            "#fcff42",
            "#ffa62d",
          ],
        });
      }, 250);

      return () => {
        clearInterval(interval);
      };
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={
        isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
      }
      className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'>
      <Card className='relative w-full max-w-md overflow-hidden border-2 border-primary/20 bg-card/95 shadow-xl backdrop-blur-md'>
        <div className='absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent' />

        <div className='relative flex flex-col items-center space-y-6 p-6 text-center'>
          <div className='mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20'>
            <FaTrophy className='h-10 w-10 text-primary' />
          </div>

          <div className='space-y-2'>
            <h2 className='text-2xl font-bold'>Gratulacje!</h2>
            <p className='text-muted-foreground'>
              Ukończyłeś sesję treningową:
            </p>
            <p className='text-lg font-semibold'>{planTitle}</p>
          </div>

          <div className='flex w-full flex-col justify-center gap-3 pt-4 sm:flex-row'>
            {onRestart && (
              <Button
                variant='outline'
                onClick={onRestart}
                className='flex items-center gap-2'>
                Trenuj ponownie
              </Button>
            )}

            <Button onClick={onFinish} className='flex items-center gap-2'>
              <span>Zakończ</span>
              <FaCheck className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
