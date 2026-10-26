import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Drum, Guitar, Mic } from "lucide-react";
import { memo, useMemo } from "react";

import type { BackingTrack } from "../../../types/exercise.types";

interface GpTrackSelectorProps {
  tracks: BackingTrack[];
  selectedIdx: number;
  onChange: (idx: number) => void;
}

const TRACK_ICONS = { drums: Drum, vocals: Mic } as const;

const hasNotes = (track: BackingTrack) =>
  track.measures.some(measure => measure.beats.some(beat => beat.notes.length > 0));

/**
 * The Guitar Pro file's tracks, one button each. A track with no notes at all
 * stays listed but can't be picked — it would only show an empty staff.
 */
export const GpTrackSelector = memo(function GpTrackSelector({ tracks, selectedIdx, onChange }: GpTrackSelectorProps) {
  const { t } = useTranslation("session");
  const empty = useMemo(() => tracks.map(track => !hasNotes(track)), [tracks]);
  if (tracks.length <= 1) return null;

  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <span className='mr-1 text-xs text-zinc-500'>{t("track")}</span>
      {tracks.map((track, idx) => {
        const selected = selectedIdx === idx;
        const disabled = empty[idx] && !selected;
        const Icon = TRACK_ICONS[track.trackType as keyof typeof TRACK_ICONS] ?? Guitar;
        return (
          <button
            key={track.id}
            type='button'
            onClick={() => onChange(idx)}
            disabled={disabled}
            aria-pressed={selected}
            title={empty[idx] ? t("track_empty", "No notes in this track") : track.name}
            className={cn(
              "flex max-w-[12rem] items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50",
              selected
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              disabled && "cursor-not-allowed text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-600",
            )}>
            <Icon className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-zinc-300" : "text-zinc-500", disabled && "text-zinc-700")} />
            <span className='truncate'>{track.name}</span>
          </button>
        );
      })}
    </div>
  );
});
