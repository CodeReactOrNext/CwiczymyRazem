import { cn } from "assets/lib/utils";
import { useEffect, useRef } from "react";

import { useTimelineFrame } from "../hooks/useTimelineFrame";
import type { RecordingTempoMap } from "../utils/tempoMap";

/** m:ss. Hours would be a lie for a song. */
function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const whole = Math.floor(sec);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

interface TimelineClockProps {
  /** Where the recording is now, in its own seconds. */
  getPlayheadSec: () => number;
  durationSec: number;
  tempoMap: RecordingTempoMap;
  beatsPerBar: number;
  className?: string;
}

/**
 * Where you are: the time in the recording, and the bar of the tab.
 *
 * The screen had neither. The overview drew a viewport box, which tells you
 * roughly where you are looking but not where you *are* — and with a five-minute
 * video against forty bars of tab, "roughly" is not enough to find the chorus.
 *
 * Written straight into the DOM from an animation frame. The playhead moves
 * continuously, and routing that through React state would re-render the whole
 * editor sixty times a second (the same reason SyncDriftReadout polls a ref).
 */
export function TimelineClock({
  getPlayheadSec,
  durationSec,
  tempoMap,
  beatsPerBar,
  className,
}: TimelineClockProps) {
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);

  const paramsRef = useRef({ getPlayheadSec, durationSec, tempoMap, beatsPerBar });
  useEffect(() => {
    paramsRef.current = { getPlayheadSec, durationSec, tempoMap, beatsPerBar };
  });

  const lastRef = useRef({ time: "", bar: "" });

  useTimelineFrame(() => {
    const last = lastRef.current;
    const p = paramsRef.current;
    const sec = p.getPlayheadSec();

    const time = p.durationSec > 0
      ? `${formatClock(sec)} / ${formatClock(p.durationSec)}`
      : formatClock(sec);
    if (time !== last.time && timeRef.current) {
      timeRef.current.textContent = time;
      last.time = time;
    }

    // Which bar of the *tab* — the thing you are aligning — not of the video.
    const perBar = Math.max(1, Math.round(p.beatsPerBar));
    const beat = p.tempoMap.beatForSec(sec);
    const bar = beat < 0 ? "—" : `Bar ${Math.floor(beat / perBar) + 1}`;
    if (bar !== last.bar && barRef.current) {
      barRef.current.textContent = bar;
      last.bar = bar;
    }
  });

  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <span
        ref={timeRef}
        className='text-sm font-semibold tabular-nums text-zinc-100'
        aria-label='Position in the recording'>
        0:00
      </span>
      <span ref={barRef} className='text-xs tabular-nums text-zinc-400'>
        Bar 1
      </span>
    </div>
  );
}
