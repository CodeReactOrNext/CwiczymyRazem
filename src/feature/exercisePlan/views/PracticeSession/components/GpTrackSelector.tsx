import { cn } from "assets/lib/utils";
import { Drum, Music } from "lucide-react";
import { memo } from "react";

import type { BackingTrack } from "../../../types/exercise.types";

interface GpTrackSelectorProps {
  tracks: BackingTrack[];
  selectedIdx: number;
  onChange: (idx: number) => void;
}

export const GpTrackSelector = memo(function GpTrackSelector({ tracks, selectedIdx, onChange }: GpTrackSelectorProps) {
  if (tracks.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Track:</span>
      {tracks.map((track, idx) => (
        <button
          key={track.id}
          onClick={() => onChange(idx)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
            selectedIdx === idx
              ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
              : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
          )}
        >
          {track.trackType === "drums" ? <Drum className="h-3 w-3" /> : <Music className="h-3 w-3" />}
          {track.name}
        </button>
      ))}
    </div>
  );
});
