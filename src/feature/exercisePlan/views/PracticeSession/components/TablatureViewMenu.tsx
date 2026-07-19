import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlignJustify, Box, Check, ChevronDown, Music } from "lucide-react";
import { memo } from "react";

type ViewMode = "tab" | "highway" | "notation";

interface ViewConfig {
  label: string;
  desc: string;
  Icon: LucideIcon;
  /** Trigger tint when this view is the active one. */
  trigger: string;
  /** Accent colour for the icon / check inside the menu. */
  accent: string;
}

const VIEWS: Record<ViewMode, ViewConfig> = {
  tab: {
    label: "Tablature",
    desc: "Classic fretboard tab",
    Icon: AlignJustify,
    trigger: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white",
    accent: "text-zinc-200",
  },
  highway: {
    label: "3D Highway",
    desc: "Rocksmith-style note lane",
    Icon: Box,
    trigger: "bg-emerald-950 text-emerald-300 hover:bg-emerald-900",
    accent: "text-emerald-400",
  },
  notation: {
    label: "Notation",
    desc: "Standard sheet music",
    Icon: Music,
    trigger: "bg-violet-950 text-violet-300 hover:bg-violet-900",
    accent: "text-violet-400",
  },
};

interface TablatureViewMenuProps {
  showAlphaTabScore: boolean;
  show3dHighway: boolean;
  /** Flat tablature & 3D highway need rendered measures. */
  hasTablature: boolean;
  /** Notation (sheet music) needs a GP file or tablature, and isn't offered in exams. */
  canNotation: boolean;
  onToggleNotation: () => void;
  onToggle3d: () => void;
  compact?: boolean;
}

/**
 * Single control that swaps between the tablature views (flat tab / 3D highway /
 * notation) via a dropdown. The three views are mutually exclusive, so selecting
 * one just toggles the relevant flag — the playback reducer clears the others.
 */
export const TablatureViewMenu = memo(function TablatureViewMenu({
  showAlphaTabScore,
  show3dHighway,
  hasTablature,
  canNotation,
  onToggleNotation,
  onToggle3d,
  compact = false,
}: TablatureViewMenuProps) {
  const current: ViewMode = showAlphaTabScore ? "notation" : show3dHighway ? "highway" : "tab";

  const options: ViewMode[] = [];
  if (hasTablature) options.push("tab", "highway");
  if (canNotation) options.push("notation");
  if (!options.includes(current)) options.unshift(current);

  const selectView = (mode: ViewMode) => {
    if (mode === current) return;
    if (mode === "notation") onToggleNotation();
    else if (mode === "highway") onToggle3d();
    else if (showAlphaTabScore) onToggleNotation(); // → flat tab
    else if (show3dHighway) onToggle3d(); //           → flat tab
  };

  const { Icon: CurrentIcon, label } = VIEWS[current];
  const h = compact ? "h-8" : "h-12";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Change how the exercise is shown"
          className={cn(
            "flex items-center gap-2 rounded-lg outline-none transition-all active:scale-95",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
            h,
            compact ? "px-2" : "px-4",
            VIEWS[current].trigger,
          )}>
          <CurrentIcon className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
          {!compact && (
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          )}
          <ChevronDown className={cn("shrink-0 opacity-60", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        // Clear the session's full-screen layer (z-[999999] desktop / z-[9999999] mobile) —
        // otherwise the default z-50 paints underneath it.
        className="z-[99999999] w-56 rounded-lg border-white/10 bg-zinc-900/95 p-1.5 text-white backdrop-blur-md">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-400">
          View
        </div>
        {options.map((mode) => {
          const { label: itemLabel, desc, Icon, accent } = VIEWS[mode];
          const active = mode === current;
          return (
            <DropdownMenuItem
              key={mode}
              onSelect={() => selectView(mode)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded px-2 py-2",
                active && "bg-white/5",
              )}>
              <Icon className={cn("h-4 w-4 shrink-0", active ? accent : "text-zinc-400")} />
              <div className="min-w-0 flex-1">
                <div className={cn("text-xs font-semibold", active ? "text-white" : "text-zinc-200")}>
                  {itemLabel}
                </div>
                <div className="text-[10px] text-zinc-500">{desc}</div>
              </div>
              {active && <Check className={cn("h-4 w-4 shrink-0", accent)} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
