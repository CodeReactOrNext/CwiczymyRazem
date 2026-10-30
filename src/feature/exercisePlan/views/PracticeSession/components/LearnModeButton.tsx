import { PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { GraduationCap } from "lucide-react";
import { memo } from "react";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { SessionTooltip } from "./SessionTooltip";

/**
 * Switches learn mode on and off: the tab stops keeping time and waits on each
 * note until it has been played. Renders nothing where the exercise can't be
 * learned that way (no tab, phone, exam).
 */
export const LearnModeButton = memo(function LearnModeButton({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("session");
  const { learn } = useNoteMatchingContext();
  if (!learn?.available) return null;

  const needsMic = !learn.micReady;
  const hint = needsMic
    ? t("learn.hint_needs_mic")
    : learn.enabled
      ? t("learn.hint_on")
      : t("learn.hint_off");

  return (
    <SessionTooltip label={hint}>
      <button
        type='button'
        onClick={() => learn.setEnabled(!learn.enabled)}
        disabled={needsMic}
        aria-pressed={learn.enabled}
        className={cn(
          PRESSABLE_KEY,
          "flex items-center gap-2 rounded-lg px-4 font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
          compact ? "h-8 px-2" : "h-12",
          learn.enabled
            ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
          needsMic && "cursor-not-allowed opacity-50 hover:bg-zinc-800 hover:text-zinc-400",
        )}>
        <GraduationCap className='h-4 w-4 shrink-0' />
        {!compact && <span className='text-[10px] font-semibold tracking-wide'>{t("learn.button")}</span>}
      </button>
    </SessionTooltip>
  );
});
