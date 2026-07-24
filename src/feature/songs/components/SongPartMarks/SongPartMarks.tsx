import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import type { SongPart } from "feature/songs/types/songs.type";
import {
  isPartCovered,
  SONG_PART_ORDER,
  toggleSongPart,
} from "feature/songs/utils/songParts.utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AudioWaveform, Disc3, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const PART_META: Record<
  SongPart,
  {
    label: string;
    icon: LucideIcon;
    /** Chip colors when the part is marked. */
    activeChip: string;
    /** Color of the one-shot burst ring played on marking. */
    ping: string;
    /** Tooltip copy explaining what this mark means. */
    hint: string;
  }
> = {
  riff: {
    label: "Riff / Fragment",
    icon: AudioWaveform,
    activeChip: "bg-cyan-500/15 text-cyan-400",
    ping: "bg-cyan-400/40",
    hint: "You can play the main riff or a fragment of this song.",
  },
  solo: {
    label: "Solo",
    icon: Zap,
    activeChip: "bg-purple-500/15 text-purple-400",
    ping: "bg-purple-400/40",
    hint: "You can play this song's solo.",
  },
  wholeSong: {
    label: "Whole song",
    icon: Disc3,
    activeChip: "bg-amber-500/15 text-amber-400",
    ping: "bg-amber-400/40",
    hint: "You can play this song start to finish — riff and solo included.",
  },
};

interface SongPartMarksProps {
  parts: SongPart[];
  /** Omit to render a read-only display. */
  onChange?: (parts: SongPart[]) => void;
  /** "sm": icon chips (cards / rows), "lg": labeled chips (song detail). */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * The three "I can play this" marks of a song: riff/fragment, solo, whole song.
 * Marking the whole song grays out riff and solo — they're covered by it.
 */
export const SongPartMarks = ({
  parts,
  onChange,
  size = "sm",
  className,
}: SongPartMarksProps) => {
  // The mark that was just switched on — drives the one-shot pop/burst animation.
  const [justMarked, setJustMarked] = useState<SongPart | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

  const handleToggle = (part: SongPart) => {
    if (!onChange) return;
    const next = toggleSongPart(parts, part);
    if (next === parts) return;
    if (!parts.includes(part)) {
      setJustMarked(part);
      clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setJustMarked(null), 600);
    }
    onChange(next);
  };

  const isSm = size === "sm";

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "flex items-center",
          isSm ? "gap-1.5" : "flex-wrap gap-2",
          className
        )}
      >
        {SONG_PART_ORDER.map((part) => {
          const meta = PART_META[part];
          const Icon = meta.icon;
          const isMarked = parts.includes(part);
          const isCovered = isPartCovered(parts, part);
          const isInteractive = !!onChange && !isCovered;

          return (
            <Tooltip key={part}>
              <TooltipTrigger asChild>
                {/* Covered chips stay enabled (a disabled button would swallow the
                    tooltip) — the tap is just a no-op. */}
                <motion.button
                  type="button"
                  aria-label={meta.label}
                  aria-pressed={isMarked}
                  aria-disabled={!isInteractive}
                  whileTap={isInteractive ? { scale: 0.85 } : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(part);
                  }}
                  className={cn(
                    "relative flex items-center justify-center rounded-[4px] transition-colors duration-300",
                    isSm ? "h-6 w-6" : "h-10 gap-2 whitespace-nowrap px-3.5",
                    isCovered
                      ? "bg-zinc-700/40 text-zinc-500"
                      : isMarked
                      ? meta.activeChip
                      : "bg-white/5 text-zinc-500",
                    isInteractive && !isMarked && "hover:text-zinc-300",
                    isInteractive ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {justMarked === part && (
                    <motion.span
                      initial={{ opacity: 0.5, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.8 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-[4px]",
                        meta.ping
                      )}
                    />
                  )}
                  <motion.span
                    animate={
                      justMarked === part
                        ? {
                            scale: [0.5, 1.25, 1],
                            rotate: part === "wholeSong" ? [0, 360] : 0,
                          }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="flex items-center justify-center"
                  >
                    <Icon className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  </motion.span>
                  {!isSm && <span className="text-xs font-semibold">{meta.label}</span>}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[230px] border-white/10 bg-zinc-900 text-xs text-zinc-200"
              >
                <p className="font-bold">
                  {meta.label}
                  {isMarked && !isCovered && " — marked"}
                </p>
                <p className="mt-1 text-zinc-400">
                  {isCovered
                    ? "Covered by Whole song — you already play the full track."
                    : meta.hint}
                </p>
                {isInteractive && (
                  <p className="mt-1 text-zinc-500">
                    {isMarked ? "Tap to unmark." : "Tap to mark it."}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
