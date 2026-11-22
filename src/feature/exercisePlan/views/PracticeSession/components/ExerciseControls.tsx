import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Pause, Play, SkipForward } from "lucide-react";

interface ExerciseControlsProps {
  isPlaying: boolean;
  isLastExercise: boolean;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "centered";

  hidePlayButton?: boolean;
  isFinished?: boolean;
  riddleConfig?: any;
  handleRestart?: () => void;
}

const ExerciseControls = ({
  isPlaying,
  isLastExercise,
  toggleTimer,
  handleNextExercise,
  size = "md",
  variant = "default",

  hidePlayButton = false,
  isFinished = false,
  handleRestart
}: ExerciseControlsProps) => {
  const { t } = useTranslation("session");

  // One size for the whole row: the compact deck gets lg, the full one the
  // big xl key. Restart is the same key made square, so it lines up with Start.
  const buttonSize = size === "sm" ? "lg" : "xl";

  const containerClasses =
    variant === "centered"
      ? "flex justify-center items-center gap-4"
      : "flex w-full max-w-sm gap-4";

  return (
    <div className={containerClasses}>
      {!hidePlayButton && !isFinished && (
        <div className={cn("relative", variant !== "centered" && "flex-1")}>
          <Button
            size={buttonSize}
            onClick={toggleTimer}
            className={variant === "centered" ? "w-auto" : "w-full"}>
            {!isPlaying && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 whitespace-nowrap z-[60] pointer-events-none">
                <div className="animate-bounce flex flex-col items-center">
                  <div className="bg-white  px-4 py-1.5 rounded-lg  text-[13px]  shadow-2xl shadow-white/20 flex items-center gap-1.5">
                    <Play />
                    <span>{t("controls.press_start")}</span>
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white -mt-[1px]"></div>
                </div>
              </div>
            )}
            {isPlaying ? (
              <div className="flex items-center gap-2">
                <span>{t("controls.pause")}</span>
                <Pause />
              </div>
            ) : (
               <div className="flex items-center gap-2">
                <span>{t("start")}</span>
                <Play />
              </div>
            )}
           </Button>
         </div>
       )}
 
       {handleRestart && (
         <Button
           size={buttonSize}
           variant="subtle"
           onClick={handleRestart}
           className="aspect-square px-0 text-zinc-400"
           title={t("controls.restart")}
         >
           <svg
             viewBox="0 0 24 24" 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="2.5" 
             strokeLinecap="round" 
             strokeLinejoin="round"
           >
             <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
             <path d="M3 3v5h5" />
           </svg>
         </Button>
       )}

      {/* Primary Action Button - ONLY if NOT centered deck (where it's separate) */}
      {variant !== "centered" && !isLastExercise && (
        <Button
          size={buttonSize}
          variant='subtle'
          onClick={handleNextExercise}
          className='flex-1'>
          <SkipForward />
        </Button>
      )}
    </div>
  );
};

export default ExerciseControls;
