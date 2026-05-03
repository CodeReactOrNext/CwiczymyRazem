import { useEffect, useState } from 'react';
import { useTimerContext } from '../contexts/TimerContext';

interface CompletionToastProps {
  isMounted: boolean;
  showCompleteDialog: boolean;
  hasReportResult: boolean;
  showSuccessView: boolean;
  isLastExercise: boolean;
  onPlayCompletionSound: () => void;
}

export const CompletionToast = ({
  isMounted,
  showCompleteDialog,
  hasReportResult,
  showSuccessView,
  isLastExercise,
  onPlayCompletionSound,
}: CompletionToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { timeLeft } = useTimerContext();

  useEffect(() => {
    if (
      timeLeft <= 0 &&
      isMounted &&
      !showCompleteDialog &&
      !hasReportResult &&
      !showSuccessView &&
      !isLastExercise
    ) {
      onPlayCompletionSound();
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isMounted, showCompleteDialog, hasReportResult, showSuccessView, isLastExercise, onPlayCompletionSound]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[10000000] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 rounded-full bg-emerald-500/90 px-6 py-3 font-bold text-white shadow-2xl backdrop-blur-md">
        <div className="h-2 w-2 animate-ping rounded-full bg-white" />
        <span className="uppercase tracking-widest text-[10px]">Exercise Completed!</span>
      </div>
    </div>
  );
};
