import { cn } from "assets/lib/utils";
import { Box } from "lucide-react";
import { memo } from "react";

interface Highway3DToggleButtonProps {
  show3dHighway: boolean;
  onToggle: () => void;
  compact?: boolean;
}

/** Toggles the Rocksmith-style 3D note highway on/off. Shown whenever the
 *  exercise has tablature (independent of the notation/GP toggle). */
export const Highway3DToggleButton = memo(function Highway3DToggleButton({
  show3dHighway,
  onToggle,
  compact = false,
}: Highway3DToggleButtonProps) {
  const h = compact ? "h-8" : "h-12";

  return (
    <button
      onClick={onToggle}
      title={show3dHighway ? "Switch to flat tablature" : "Switch to 3D highway"}
      className={cn(
        "flex items-center gap-2 rounded-lg transition-all active:scale-95",
        h,
        compact ? "px-2" : "px-4",
        show3dHighway
          ? "bg-emerald-950 text-emerald-300 hover:bg-emerald-900"
          : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
      )}
    >
      <Box className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
      {!compact && (
        <span className="text-[10px] font-semibold tracking-wide">3D</span>
      )}
    </button>
  );
});
