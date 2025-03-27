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
}

const ExerciseControls = ({
  isPlaying,
  isLastExercise,
  toggleTimer,
  handleNextExercise,
  size = "md",
  variant = "default",
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
      <Button
        size={size === "lg" ? "lg" : "default"}
        onClick={toggleTimer}
        className={cn(
          variant === "centered" ? btnSizes[size] : "flex-1",
          variant === "centered" ? "rounded-full" : "",
          isPlaying ? "bg-primary/90 hover:bg-primary/80" : ""
        )}>
        {isPlaying ? (
          <FaPause className={iconSizes[size]} />
        ) : (
          <FaPlay className={iconSizes[size]} />
        )}
      </Button>

      {!isLastExercise && (
        <Button
          size={size === "lg" ? "lg" : "default"}
          variant='outline'
          onClick={handleNextExercise}
          className={cn(
            variant === "centered" ? btnSizes[size] : "flex-1",
            variant === "centered" ? "rounded-full" : ""
          )}>
          <FaStepForward className={iconSizes[size]} />
        </Button>
      )}
    </div>
  );
};

export default ExerciseControls;
