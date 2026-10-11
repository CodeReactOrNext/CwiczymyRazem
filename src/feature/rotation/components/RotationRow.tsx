import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Check, ExternalLink, Play, X } from "lucide-react";

import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type { RotationEntry } from "../types/rotation.types";
import { isSessionPlayable, linkLabel } from "../utils/rotation.utils";
import { FreshnessMeter, LEVEL_TEXT } from "./FreshnessMeter";
import { RotationThumb } from "./RotationThumb";

interface RotationRowProps {
  entry: RotationEntry;
  /** Plays the item — or, for a custom item without the timer, ticks it off. */
  onPlay: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ICON_BUTTON =
  "flex shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50";

export const RotationRow = ({
  entry,
  onPlay,
  onRemove,
  disabled,
}: RotationRowProps) => {
  const { describe, playedLabel, t } = useRotationDisplay();
  const { item, freshness } = entry;
  const display = describe(item);
  const played = playedLabel(freshness);
  const ticksOff = !isSessionPlayable(item);

  return (
    // `layout` slides a row into its new group when a session re-sorts the list.
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className='flex items-center gap-4 rounded-lg bg-zinc-900/40 p-3 pr-3 transition-colors hover:bg-zinc-900/70 sm:gap-6 sm:p-4 sm:pr-5'>
      <RotationThumb
        display={display}
        className='h-12 w-12 sm:h-14 sm:w-14'
        iconClassName='h-6 w-6'
      />

      <div className='min-w-0 flex-1'>
        <p className='truncate text-[15px] font-semibold text-zinc-100'>
          {display.title}
        </p>
        <p className='mt-1.5 truncate text-xs text-zinc-400'>
          {t(`types.${item.type}`)} · {display.subtitle}
        </p>
        <p
          className={cn(
            "mt-1.5 text-xs tabular-nums sm:hidden",
            LEVEL_TEXT[freshness.level],
          )}>
          {played}
        </p>
      </div>

      <div className='hidden w-40 shrink-0 flex-col items-end gap-2.5 sm:flex'>
        <FreshnessMeter freshness={freshness} />
        <span className='text-xs tabular-nums text-zinc-400'>{played}</span>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        {item.link && (
          <a
            href={item.link}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={t("row.open_link", { site: linkLabel(item.link) })}
            className={cn(
              ICON_BUTTON,
              "hidden h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 sm:flex",
            )}>
            <ExternalLink className='h-4 w-4' />
          </a>
        )}
        <button
          type='button'
          onClick={onPlay}
          disabled={disabled}
          aria-label={t(ticksOff ? "row.done" : "row.play", {
            title: display.title,
          })}
          className={cn(
            ICON_BUTTON,
            "h-11 w-11 bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
          )}>
          {ticksOff ? (
            <Check className='h-4 w-4' />
          ) : (
            <Play className='h-4 w-4 fill-current' />
          )}
        </button>
        <button
          type='button'
          onClick={onRemove}
          aria-label={t("row.remove", { title: display.title })}
          className={cn(
            ICON_BUTTON,
            "h-9 w-9 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
          )}>
          <X className='h-4 w-4' />
        </button>
      </div>
    </motion.li>
  );
};
