import { cn } from "assets/lib/utils";
import { useNow } from "feature/duels/hooks/useDuels";
import { formatClock } from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";

/**
 * The duel clock, ticking every second. Its own component so only these
 * digits re-render each second, not the card around them.
 */
export const DuelCountdown = ({
  endsAt,
  isEnding,
  className,
}: {
  endsAt: number;
  isEnding: boolean;
  className?: string;
}) => {
  const now = useNow(1000);
  return (
    <span
      className={cn(
        "font-teko text-3xl font-semibold tabular-nums leading-none",
        isEnding ? "text-orange-400" : "text-zinc-100",
        className,
      )}>
      {formatClock(endsAt - now)}
    </span>
  );
};

/** Most attempts drawn as ticks; past this they collapse into "+N". */
const MAX_TICKS = 12;

/**
 * Attempts as a row of ticks — how hard each side is trying, read at a glance.
 * The one thing a duel shows about the opponent before it ends.
 */
export const AttemptTicks = ({
  count,
  align = "start",
  tone = "light",
}: {
  count: number;
  align?: "start" | "end";
  tone?: "light" | "muted";
}) => {
  if (count === 0) return null;
  const ticks = Math.min(count, MAX_TICKS);
  return (
    <span
      aria-hidden='true'
      className={cn(
        "flex items-center gap-1",
        align === "end" && "flex-row-reverse",
      )}>
      {Array.from({ length: ticks }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-1 rounded-full",
            tone === "light" ? "bg-zinc-200" : "bg-zinc-500",
          )}
        />
      ))}
      {count > MAX_TICKS && (
        <span className='px-0.5 text-[11px] font-semibold tabular-nums text-zinc-400'>
          +{count - MAX_TICKS}
        </span>
      )}
    </span>
  );
};

const FORM_STYLE = {
  won: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-zinc-800 text-zinc-400",
  draw: "bg-zinc-800 text-zinc-200",
} as const;

/** The last results as letter squares, oldest first — a football-style form guide. */
export const FormGuide = ({
  form,
  className,
}: {
  form: ("won" | "lost" | "draw")[];
  className?: string;
}) => {
  const { t } = useTranslation("duels");
  if (form.length === 0) return null;
  return (
    <ol
      className={cn("flex items-center gap-1", className)}
      aria-label={t("form.aria")}>
      {form.map((result, i) => (
        <li
          key={i}
          title={t(`recent.${result}`)}
          className={cn(
            "flex size-5 items-center justify-center rounded text-[10px] font-bold",
            FORM_STYLE[result],
          )}>
          {t(`form.${result}`)}
        </li>
      ))}
    </ol>
  );
};

const SPARK_W = 112;
const SPARK_H = 28;
const SPARK_PAD = 3;

/**
 * The rating across the recent duels as a thin line, the last point marked —
 * emerald when the last duel gained, zinc when it did not.
 */
export const RatingSparkline = ({ trail }: { trail: number[] }) => {
  const { t } = useTranslation("duels");
  if (trail.length < 2) return null;
  const min = Math.min(...trail);
  const max = Math.max(...trail);
  const span = max - min || 1;
  const points = trail.map((value, i) => {
    const x = SPARK_PAD + (i / (trail.length - 1)) * (SPARK_W - SPARK_PAD * 2);
    // A flat trail sits in the middle instead of on the floor.
    const y =
      max === min
        ? SPARK_H / 2
        : SPARK_PAD + (1 - (value - min) / span) * (SPARK_H - SPARK_PAD * 2);
    return [x, y] as const;
  });
  const [lastX, lastY] = points[points.length - 1];
  const gained = trail[trail.length - 1] > trail[trail.length - 2];

  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      width={SPARK_W}
      height={SPARK_H}
      role='img'
      aria-label={t("form.trend_aria")}
      className='overflow-visible'>
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill='none'
        stroke='currentColor'
        strokeWidth={1.5}
        strokeLinejoin='round'
        strokeLinecap='round'
        className='text-zinc-500'
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={3}
        className={gained ? "fill-emerald-400" : "fill-zinc-300"}
      />
    </svg>
  );
};
