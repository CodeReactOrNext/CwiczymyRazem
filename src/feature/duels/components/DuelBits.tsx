import { cn } from "assets/lib/utils";
import { useNow } from "feature/duels/hooks/useDuels";
import { formatClock } from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";

/** Three dots taking turns — "still looking", without a spinner's urgency. */
export const SearchingDots = () => (
  <span className='flex items-center gap-1' aria-hidden='true'>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className='size-1.5 animate-pulse rounded-full bg-zinc-300'
        style={{ animationDelay: `${i * 200}ms` }}
      />
    ))}
  </span>
);

/**
 * What is left of a duel as a bar burning down — white, orange once the
 * reminder is due. Measured against the duel's own length, so one paired under
 * an older limit reads right.
 */
export const DuelFuse = ({
  createdAt,
  endsAt,
  now,
  isEnding,
  className,
}: {
  createdAt: number;
  endsAt: number;
  now: number;
  isEnding: boolean;
  className?: string;
}) => {
  const share = Math.max(
    0,
    Math.min(1, (endsAt - now) / Math.max(1, endsAt - createdAt)),
  );
  return (
    <div
      className={cn(
        "h-1.5 overflow-hidden rounded-full bg-zinc-800",
        className,
      )}
      aria-hidden='true'>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-1000",
          isEnding ? "bg-orange-400" : "bg-zinc-100",
        )}
        style={{ width: `${share * 100}%` }}
      />
    </div>
  );
};

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
