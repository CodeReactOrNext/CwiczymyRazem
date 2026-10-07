import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useState } from "react";
import { FaPause, FaPlay, FaStepForward } from "react-icons/fa";

// The "Press Start to play" nudge is for a first session only — once someone
// has started an exercise it just covers the Pro Tips underneath the button.
const START_HINT_KEY = "practice:start-hint-seen";

const readStartHintSeen = () => {
  try {
    return typeof window !== "undefined" && localStorage.getItem(START_HINT_KEY) === "1";
  } catch {
    return false;
  }
};

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
  const [startHintSeen, setStartHintSeen] = useState(readStartHintSeen);
  // Space starts the timer without touching this button, so key off isPlaying.
  if (isPlaying && !startHintSeen) setStartHintSeen(true);

  useEffect(() => {
    if (!startHintSeen) return;
    try {
      localStorage.setItem(START_HINT_KEY, "1");
    } catch {
      // Private mode / blocked storage — the hint just shows again next time.
    }
  }, [startHintSeen]);

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
      {!hidePlayButton && !isFinished && (
        <div className={cn("relative", variant !== "centered" && "flex-1")}>
          <Button
            onClick={toggleTimer}
            className={cn(
              variant === "centered" ? (size === "lg" ? "h-14 px-8 w-auto" : "h-12 px-6 w-auto") : "w-full",
              "rounded-lg font-black transition-background click-behavior   relative",
              isPlaying
                ? "bg-white text-black hover:bg-zinc-200 shadow-2xl shadow-white/20"
                : "bg-white text-black hover:bg-zinc-200 shadow-2xl shadow-white/20 animate-pulse"
            )}>
            {!isPlaying && !startHintSeen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 whitespace-nowrap z-[60] pointer-events-none">
                <div className="animate-bounce flex flex-col items-center">
                  <div className="bg-white  px-4 py-1.5 rounded-lg  text-[13px]  tracking-wider shadow-2xl shadow-white/20 flex items-center gap-1.5">
                    <FaPlay className="h-2.5 w-2.5" /> 
                    <span>{t("controls.press_start")}</span>
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white -mt-[1px]"></div>
                </div>
              </div>
            )}
            {isPlaying ? (
              <div className="flex items-center gap-2">
                <span>{t("controls.pause")}</span>
                <FaPause className={iconSizes[size]} />
              </div>
            ) : (
               <div className="flex items-center gap-2">
                <span>{t("start")}</span>
                <FaPlay className={cn(iconSizes[size], "ml-0.5")} />
              </div>
            )}
           </Button>
         </div>
       )}
 
       {handleRestart && (
         <Button
           size={size === "lg" ? "lg" : "default"}
           variant="ghost"
           onClick={handleRestart}
           className={cn(
             btnSizes[size],
             "rounded-lg transition-all click-behavior text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5"
           )}
           title={t("controls.restart")}
         >
           <svg 
             className={iconSizes[size]} 
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
          size={size === "lg" ? "lg" : "default"}
          variant='ghost'
          onClick={handleNextExercise}
          className={cn(
            "flex-1 rounded-lg transition-background click-behavior",
          )}>
          <FaStepForward className={iconSizes[size]} />
        </Button>
      )}
    </div>
  );
};

export default ExerciseControls;
