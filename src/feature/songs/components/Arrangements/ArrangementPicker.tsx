import { cn } from "assets/lib/utils";
import type { SongArrangement } from "feature/songs/types/songs.type";
import { ARRANGEMENT_META, ARRANGEMENT_ORDER } from "feature/songs/utils/arrangements.utils";

interface ArrangementPickerProps {
  value: SongArrangement | null;
  onChange: (arrangement: SongArrangement | null) => void;
  /**
   * Adds an option that leaves the arrangement unset ("Not sure") — time then
   * lands only in the song totals. Omit to force a pick.
   */
  noneLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

/** Segmented Lead / Rhythm / Bass picker — which guitar part of the song is being practised. */
export const ArrangementPicker = ({
  value,
  onChange,
  noneLabel,
  size = "md",
  className,
}: ArrangementPickerProps) => {
  const options: (SongArrangement | null)[] = noneLabel
    ? [...ARRANGEMENT_ORDER, null]
    : ARRANGEMENT_ORDER;

  return (
    <div
      role='radiogroup'
      aria-label='Arrangement'
      className={cn("flex gap-1 rounded-lg bg-zinc-900/60 p-1", className)}>
      {options.map((option) => {
        const isActive = value === option;
        const meta = option ? ARRANGEMENT_META[option] : null;
        return (
          <button
            key={option ?? "none"}
            type='button'
            role='radio'
            aria-checked={isActive}
            title={meta?.hint}
            onClick={() => onChange(option)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded font-semibold transition-background click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
              isActive
                ? "bg-zinc-700/80 text-white"
                : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
            )}>
            {meta && (
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full transition-opacity",
                  meta.dot,
                  !isActive && "opacity-70"
                )}
              />
            )}
            {meta ? meta.label : noneLabel}
          </button>
        );
      })}
    </div>
  );
};
