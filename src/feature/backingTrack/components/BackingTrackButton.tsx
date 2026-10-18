import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Music2, Plus } from "lucide-react";

import type { BackingTrackStatus } from "../utils/backingTrackStatus";

interface BackingTrackButtonProps {
  status: BackingTrackStatus;
  onClick: () => void;
  className?: string;
}

/**
 * The session's way into the backing-track editor, docked under Calibrate
 * timing beside the tab.
 *
 * The label names the thing it acts on, so it never reads as another timing
 * tool. Whether the recording is lined up yet is the icon's colour; the tooltip
 * says it in words.
 */
export function BackingTrackButton({ status, onClick, className }: BackingTrackButtonProps) {
  const { t } = useTranslation("backing_track");

  return (
    <button
      type='button'
      onClick={onClick}
      title={t(`bar.hint_${status}`)}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50 hover:bg-white/10 hover:text-zinc-100",
        className,
      )}>
      {status === "empty" ? (
        <Plus className='h-3.5 w-3.5' />
      ) : (
        <Music2
          className={cn(
            "h-3.5 w-3.5",
            status === "aligned" ? "text-emerald-400" : "text-amber-400",
          )}
        />
      )}
      <span>{status === "empty" ? t("bar.add") : t("bar.sync")}</span>
    </button>
  );
}
