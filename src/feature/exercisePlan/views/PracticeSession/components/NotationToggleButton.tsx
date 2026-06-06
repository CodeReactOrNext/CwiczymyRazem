import { cn } from "assets/lib/utils";
import { Music } from "lucide-react";
import { memo } from "react";

interface NotationToggleButtonProps {
  showAlphaTabScore: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export const NotationToggleButton = memo(function NotationToggleButton({
  showAlphaTabScore,
  onToggle,
  compact = false,
}: NotationToggleButtonProps) {
  const h = compact ? "h-8" : "h-12";

  return (
    <>
      {!compact && <div className="h-7 w-px bg-white/10 self-center" aria-hidden />}
      <button
        onClick={onToggle}
        title={showAlphaTabScore ? "Switch to tablature" : "Switch to notation"}
        className={cn(
          "flex items-center gap-2 rounded-lg transition-all active:scale-95",
          h,
          compact ? "px-2" : "px-4",
          showAlphaTabScore
            ? "bg-violet-950 text-violet-300 hover:bg-violet-900"
            : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
        )}
      >
        <Music className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
        {!compact && (
          <span className="text-[10px] font-semibold tracking-wide">
            {showAlphaTabScore ? "TAB" : "Notation"}
          </span>
        )}
      </button>
    </>
  );
});
