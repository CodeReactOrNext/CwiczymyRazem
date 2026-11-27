import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Pause, Play } from "lucide-react";

import { formatSkillTime, SkillIcon } from "./skillDisplay";

interface SkillRowProps {
  skillId: string;
  title: string;
  time: number;
  percent: number;
  skillColor: string;
  chosen: boolean;
  timerEnabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

/**
 * The phone's Free Timer category: one key that is the chooser, the time
 * summary and the pause at once. Tap starts or switches to the skill; tapping
 * the running one pauses it. Desktop keeps the chooser + CategoryBox cards.
 */
const SkillRow = ({
  skillId,
  title,
  time,
  percent,
  skillColor,
  chosen,
  timerEnabled,
  onStart,
  onStop,
}: SkillRowProps) => {
  const isActive = timerEnabled && chosen;

  return (
    <button
      type='button'
      aria-pressed={isActive}
      onClick={isActive ? onStop : onStart}
      className={cn(
        PRESSABLE,
        "flex h-14 w-full min-w-0 items-center gap-3 rounded-lg border-b-black/30 px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        chosen
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-white/10 text-zinc-100 hover:bg-white/15"
      )}>
      <span
        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full'
        style={{ backgroundColor: `${skillColor}33` }}>
        <SkillIcon skillId={skillId} className='h-5 w-5 text-white' />
      </span>
      <span translate='no' className='min-w-0 flex-1 break-words'>
        {title}
      </span>
      {time > 0 && (
        <span translate='no' className='text-xs font-medium tabular-nums text-zinc-400'>
          {Math.round(percent)}%
        </span>
      )}
      <span
        translate='no'
        className={cn(
          "text-lg font-bold tabular-nums",
          chosen ? "text-white" : time > 0 ? "text-zinc-100" : "text-zinc-500"
        )}>
        {formatSkillTime(time)}
      </span>
      {isActive ? (
        <Pause className='h-4 w-4 shrink-0 fill-current' />
      ) : (
        <Play className={cn("h-4 w-4 shrink-0 fill-current", !chosen && "text-zinc-400")} />
      )}
    </button>
  );
};

export default SkillRow;
