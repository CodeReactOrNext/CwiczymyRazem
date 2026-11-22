import { cn } from "assets/lib/utils";

export type CountBadgeTone = "alert" | "info";

interface CountBadgeProps {
  /** A number is capped at `max` ("9+"); a string (e.g. "!") is shown as is. */
  count: number | string;
  /** alert = red (notifications, messages), info = cyan (new feed entries). */
  tone: CountBadgeTone;
  /** Highest number shown before it collapses to "{max}+". */
  max?: number;
  className?: string;
  /** Hidden from screen readers by default — the button it sits on carries the count in its
   *  own label. Pass false when nothing else announces it. */
  "aria-hidden"?: boolean;
}

const TONE_CLASS: Record<CountBadgeTone, string> = {
  alert: "bg-red-500 text-white",
  info: "bg-cyan-500 text-zinc-950",
};

export const formatCount = (count: number | string, max: number) =>
  typeof count === "number" && count > max ? `${max}+` : String(count);

/** The one count dot pinned to the corner of an icon button (bell, community, feed tabs). */
export const CountBadge = ({
  count,
  tone,
  max = 9,
  className,
  "aria-hidden": ariaHidden = true,
}: CountBadgeProps) => (
  <span
    aria-hidden={ariaHidden || undefined}
    className={cn(
      "absolute right-0.5 top-0.5 flex h-5 min-w-5 select-none items-center justify-center rounded-full px-1 text-xs font-bold leading-none tabular-nums",
      TONE_CLASS[tone],
      className
    )}>
    {formatCount(count, max)}
  </span>
);
