import { Segment, SegmentGroup } from "components/SegmentedControl/SegmentedControl";
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
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-xs text-zinc-400">{t("track", "Track")}</span>
      <SegmentGroup aria-label={t("track", "Track")}>
        {tracks.map((track) => (
          <Segment
            key={track.idx}
            active={selectedIdx === track.idx}
            onClick={() => onSelect(track.idx)}
            className="max-w-[160px]">
            <span className="truncate" title={track.name}>
              {track.name}
            </span>
          </Segment>
        ))}
      </SegmentGroup>
    </div>
  );
};

/** Renders track-selection buttons. Hidden when there is only one track. */
export const TrackSelector = (props: TrackSelectorProps) =>
  props.tracks.length <= 1 ? null : <TrackButtons {...props} />;
