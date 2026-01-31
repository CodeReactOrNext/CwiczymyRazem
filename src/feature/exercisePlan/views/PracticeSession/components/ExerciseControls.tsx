import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FaPause, FaPlay, FaStepForward } from "react-icons/fa";

interface ExerciseControlsProps {
  isPlaying: boolean;
  isLastExercise: boolean;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "centered";
  canSkipExercise?: boolean;
}

const ExerciseControls = ({
  isPlaying,
  isLastExercise,
  toggleTimer,
  handleNextExercise,
  size = "md",
  variant = "default",
  canSkipExercise = true
}: ExerciseControlsProps) => {
  const btnSizes = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const containerClasses =
    variant === "centered"
      ? "flex justify-center items-center gap-4"
      : "flex w-full max-w-sm gap-4";

  return (
    <div className={containerClasses}>
      <div className="relative">
        {!isPlaying && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce pointer-events-none">
            <div className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/50">
              ▶ Press PLAY to Start
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-cyan-500"></div>
          </div>
        )}
        <Button
          size={size === "lg" ? "lg" : "default"}
          onClick={toggleTimer}
          className={cn(
            variant === "centered" ? (size === "lg" ? "h-14 px-8 w-auto" : "h-12 px-6 w-auto") : "flex-1",
            "radius-premium transition-background click-behavior font-black text-[10px] tracking-[0.2em] uppercase",
            isPlaying 
              ? "bg-white text-black hover:bg-zinc-200 shadow-2xl shadow-white/20" 
              : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-2xl shadow-cyan-500/30 animate-pulse"
          )}>
          {isPlaying ? (
            <div className="flex items-center gap-2">
              <span>Pause</span>
              <FaPause className={iconSizes[size]} />
            </div>
          ) : (
             <div className="flex items-center gap-2">
              <span>Start</span>
              <FaPlay className={cn(iconSizes[size], "ml-0.5")} />
            </div>
          )}
        </Button>
      </div>

      {/* Primary Action Button - ONLY if NOT centered deck (where it's separate) */}
      {variant !== "centered" && !isLastExercise && (
        <Button
          size={size === "lg" ? "lg" : "default"}
          variant='ghost'
          onClick={handleNextExercise}
          disabled={!canSkipExercise}
          className={cn(
            "flex-1 radius-premium transition-background click-behavior",
            !canSkipExercise && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}>
          <FaStepForward className={iconSizes[size]} />
        </Button>
      )}
    </div>
  );
};

export default ExerciseControls;
