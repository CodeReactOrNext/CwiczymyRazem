import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Hammer } from "lucide-react";

interface ReadyMarkProps {
  /** Shown after the hammer — "how many" on a tab or a shelf. */
  count?: number;
  className?: string;
}

/**
 * The green hammer plate: "there is bench work you can do here right now".
 *
 * One mark for the whole Arsenal — a socket, a card's Workshop key, a rack row,
 * a job card and the Workshop tab all wear the same one — so it is learnt once.
 * A solid plate rather than a bare glyph: a green icon on its own got lost on
 * top of the gear art. It only ever says what can be done; what is still
 * missing is never drawn.
 */
export const ReadyMark = ({ count, className }: ReadyMarkProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <span
      title={t("workshop.ready_now")}
      aria-label={t("workshop.ready_now")}
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-[5px] bg-emerald-500 px-1 text-[11px] font-black leading-none text-emerald-950 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]",
        className,
      )}>
      <Hammer size={12} strokeWidth={2.75} aria-hidden />
      {count != null && count > 0 && (
        <span className='tabular-nums'>{count}</span>
      )}
    </span>
  );
};
