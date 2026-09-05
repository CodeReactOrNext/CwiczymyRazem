import { cn } from "assets/lib/utils";

interface AccentGridProps {
  /** One entry per click-grid step: 2 accent, 1 plain click, 0 silent. */
  pattern: number[];
  /**
   * Entries each bar takes, when the pattern spans a meter change. Every bar
   * then starts a fresh row, so the accents line up with the bar lines the
   * player is reading instead of wrapping wherever the row runs out.
   */
  barLengths?: number[] | null;
  /** Index of the entry currently sounding, ringed while playing. */
  currentBeat?: number;
  isPlaying?: boolean;
  /** Read-only — the exercise owns this grid, so there is nothing to click. */
  locked?: boolean;
  onCycle?: (index: number) => void;
}

/** Widest row the grid may use. Eight keeps a 12-entry bar inside a 16rem popover. */
const MAX_COLUMNS = 8;

const levelTitle = (level: number) =>
  level === 2
    ? "Accent — click to mute"
    : level === 1
      ? "Click — click to accent"
      : "Muted — click to reset";

export const AccentGrid = ({
  pattern,
  barLengths,
  currentBeat,
  isPlaying = false,
  locked = false,
  onCycle,
}: AccentGridProps) => {
  const bars = barLengths?.length ? barLengths : [pattern.length];
  const columns = Math.min(MAX_COLUMNS, Math.max(1, ...bars));

  // Where each bar begins, so the first entry of every bar can be pushed to
  // column one. A bar longer than the row simply wraps and the next one still
  // starts clean.
  const barStarts = new Set<number>();
  let offset = 0;
  for (const length of bars) {
    barStarts.add(offset);
    offset += length;
  }

  return (
    <div
      className='grid gap-1.5'
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {pattern.map((level, index) => (
        <button
          key={index}
          type='button'
          onClick={() => onCycle?.(index)}
          disabled={locked}
          title={locked ? "This exercise sets its own accents" : levelTitle(level)}
          className={cn(
            "flex h-8 select-none items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors",
            level === 2 && "bg-cyan-500/20 text-cyan-300",
            level === 1 && "bg-zinc-800/60 text-zinc-300",
            level === 0 && "bg-zinc-900/60 text-zinc-700",
            !locked && level === 1 && "hover:bg-zinc-700/70",
            !locked && level === 0 && "hover:bg-zinc-800/60",
            locked && "cursor-default",
            isPlaying && currentBeat === index && "ring-2 ring-cyan-400",
          )}
          style={barStarts.has(index) ? { gridColumnStart: 1 } : undefined}>
          {index + 1}
        </button>
      ))}
    </div>
  );
};
