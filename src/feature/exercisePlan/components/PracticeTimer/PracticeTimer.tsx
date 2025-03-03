import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { useEffect, useState } from "react";
import { buildStyles,CircularProgressbar } from "react-circular-progressbar";
import { useTranslation } from "react-i18next";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";

interface PracticeTimerProps {
  duration: number;
  onComplete?: () => void;
}

export const PracticeTimer = ({ duration, onComplete }: PracticeTimerProps) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / (duration * 60)) * 100;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-20 w-20">
          <CircularProgressbar
            value={progress}
            strokeWidth={8}
            styles={buildStyles({
              pathColor: 'hsl(var(--primary))',
              trailColor: 'hsl(var(--primary) / 0.2)',
            })}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-medium">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <FaPause className="h-3 w-3" /> : <FaPlay className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(duration * 60);
            }}>
            <FaStop className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
