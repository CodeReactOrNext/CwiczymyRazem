import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Pause, Play } from "lucide-react";

import { formatSkillTime, SkillIcon } from "./skillDisplay";

interface CategoryBox {
  title: string;
  chosen?: boolean;
  time: number;
  percent: number;
  timerEnabled: boolean;
  skillColor: string;
  skillId: string;
  onStart: () => void;
  onStop: () => void;
  /** False = a time summary only: no start button, card not clickable. */
  showControls?: boolean;
}

const CategoryBox = ({
  title,
  chosen,
  time,
  percent,
  onStart,
  onStop,
  skillColor,
  skillId,
  timerEnabled,
  showControls = true,
}: CategoryBox) => {
  const { t } = useTranslation("timer");
  const isActive = timerEnabled && chosen;

  const handleCardClick = () => {
    if (!showControls) return;
    if (isActive) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl p-5 text-white transition-colors duration-base",
        chosen ? "bg-zinc-800/70" : "bg-zinc-900",
        showControls && "cursor-pointer"
      )}
      onClick={handleCardClick}>
      <div className='mb-4 flex items-center gap-3'>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-base'
          style={{
            backgroundColor: chosen ? `${skillColor}33` : "rgba(100, 100, 100, 0.15)",
          }}>
          <SkillIcon skillId={skillId} className={cn("h-5 w-5", !chosen && "text-gray-400")} />
        </div>
        <span
          translate='no'
          className={cn("text-base font-semibold", chosen ? "text-white" : "text-gray-300")}>
          {title}
        </span>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-end justify-between gap-2",
          showControls && "mb-6"
        )}>
        {/* A category nobody has touched yet stays quiet: a dim clock, no chip. */}
        <h3
          translate='no'
          className={cn(
            "text-2xl font-bold leading-none tabular-nums md:text-3xl",
            chosen ? "text-white" : time > 0 ? "text-gray-200" : "text-zinc-500"
          )}>
          {formatSkillTime(time)}
        </h3>

        {time > 0 && (
          <span
            translate='no'
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
              !chosen && "bg-gray-700/30 text-gray-400"
            )}
            style={chosen ? { background: `${skillColor}20`, color: skillColor } : undefined}>
            {Math.round(percent)}% of session
          </span>
        )}
      </div>

      {showControls && (
        <Button
          variant='subtle'
          size='lg'
          translate='no'
          className={cn(
            "w-full",
            isActive &&
              "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}>
          {isActive ? (
            <>
              <Pause />
              {t("pause")}
            </>
          ) : (
            <>
              <Play />
              {t("start")}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default CategoryBox;
