import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";

import type { Track } from "./types";

interface TrackSelectorProps {
  tracks: Track[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

/**
 * Split out so single-track scores (the public song-guide riffs) never ask for
 * the app-only `session` namespace, which public pages do not bundle.
 */
const TrackButtons = ({ tracks, selectedIdx, onSelect }: TrackSelectorProps) => {
  const { t } = useTranslation("session");

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-zinc-500 shrink-0">{t("track", "Track")}</span>
      {tracks.map((track) => (
        <button
          key={track.idx}
          onClick={() => onSelect(track.idx)}
          title={track.name}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium transition-colors truncate max-w-[140px]",
            selectedIdx === track.idx
              ? "bg-blue-600 text-white"
              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600",
          )}
        >
          {track.name}
        </button>
      ))}
    </div>
  );
};

/** Renders track-selection buttons. Hidden when there is only one track. */
export const TrackSelector = (props: TrackSelectorProps) =>
  props.tracks.length <= 1 ? null : <TrackButtons {...props} />;
