import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Volume1, Volume2, VolumeX } from "lucide-react";

interface MasterVolumeButtonProps {
  /** Overall boost on top of every track's own volume (1 = normal, up to 2 = +100%). */
  volume: number;
  onVolumeChange: (v: number) => void;
  /** Icon-only trigger sized for the compact toolbar layout. */
  compact?: boolean;
  /** Height class to align with sibling toolbar buttons (e.g. "h-12" / "h-8"). */
  h?: string;
}

export const MasterVolumeButton = ({
  volume,
  onVolumeChange,
  compact = false,
  h = "h-12",
}: MasterVolumeButtonProps) => {
  const isBoosted = volume > 1;
  const VolumeIcon = volume <= 0.0001 ? VolumeX : volume < 1 ? Volume1 : Volume2;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RippleButton
          title={`Playback volume: ${Math.round(volume * 100)}%`}
          className={cn(
            "flex items-center justify-center shrink-0 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
            compact ? "h-8 w-8 active:scale-90" : cn("w-12 active:scale-95", h),
            isBoosted
              ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
              : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
          )}>
          <VolumeIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
        </RippleButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        className="w-60 rounded-xl border border-white/10 bg-zinc-900/95 p-3.5 text-white shadow-xl shadow-black/40 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400">Playback volume</span>
          <span
            className={cn(
              "min-w-[2.75rem] rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] font-bold tabular-nums",
              isBoosted ? "bg-cyan-500/15 text-cyan-400" : "bg-white/10 text-white"
            )}>
            {Math.round(volume * 100)}%
          </span>
        </div>
        <Slider
          value={[volume * 100]}
          min={0}
          max={200}
          step={5}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          className={cn(
            "cursor-pointer",
            "[&>span:first-child]:bg-white/15",
            isBoosted
              ? "[&>span:first-child>span]:bg-cyan-400 [&_[role=slider]]:border-cyan-400/60 [&_[role=slider]]:bg-cyan-400"
              : "[&>span:first-child>span]:bg-white [&_[role=slider]]:border-white/60 [&_[role=slider]]:bg-white"
          )}
        />
        <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
          Boost the Guitar Pro playback above 100% if it sounds too quiet.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
