import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Layers, Play } from "lucide-react";
import { useState } from "react";

import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type { RotationEntry } from "../types/rotation.types";
import {
  drawCard,
  isSessionPlayable,
  rotationKey,
} from "../utils/rotation.utils";
import { FreshnessMeter, LEVEL_TEXT } from "./FreshnessMeter";
import { RotationThumb } from "./RotationThumb";

interface DrawCardDialogProps {
  entries: RotationEntry[];
  onPlay: (entry: RotationEntry) => void;
  onClose: () => void;
  isStarting: boolean;
}

/**
 * One card off the top of the deck: a random item that leans towards what has
 * gone stale. Drawing again flips in another, never the same one twice running.
 * Mounted only while open, so every opening deals a fresh card.
 */
export const DrawCardDialog = ({
  entries,
  onPlay,
  onClose,
  isStarting,
}: DrawCardDialogProps) => {
  const { describe, playedLabel, t } = useRotationDisplay();
  const [drawn, setDrawn] = useState(() => ({
    entry: drawCard(entries),
    round: 0,
  }));
  const { entry } = drawn;
  const display = entry ? describe(entry.item) : null;

  const drawAgain = () =>
    setDrawn((previous) => ({
      entry: drawCard(
        entries,
        Math.random,
        previous.entry ? rotationKey(previous.entry.item) : undefined,
      ),
      round: previous.round + 1,
    }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex flex-col gap-8 border-0 bg-zinc-900 shadow-none sm:max-w-md sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("draw.title")}
          </DialogTitle>
          <DialogDescription className='text-sm text-zinc-400'>
            {t("draw.description")}
          </DialogDescription>
        </div>

        <div className='relative mx-auto h-[23rem] w-64 [perspective:1100px]'>
          {/* The rest of the deck, squared up loosely behind the drawn card. */}
          {entries.length > 1 && (
            <>
              <div
                className='absolute inset-0 translate-x-3 translate-y-2 rotate-[4deg] rounded-lg bg-zinc-800/30'
                aria-hidden
              />
              <div
                className='absolute inset-0 -translate-x-1 rotate-[-3deg] rounded-lg bg-zinc-800/60'
                aria-hidden
              />
            </>
          )}

          <AnimatePresence mode='wait' initial={false}>
            {entry && display && (
              <motion.div
                key={drawn.round}
                initial={{ rotateY: -95, y: 10, opacity: 0.5 }}
                animate={{ rotateY: 0, y: 0, opacity: 1 }}
                exit={{ rotateY: 95, y: -6, opacity: 0.5 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                className='absolute inset-0 flex flex-col rounded-lg bg-zinc-800 p-4'>
                <RotationThumb
                  display={display}
                  className='aspect-square h-auto w-full bg-zinc-700/50 text-zinc-300'
                  iconClassName='h-16 w-16'
                />
                <div className='mt-4 flex min-h-0 flex-1 flex-col'>
                  <p className='text-xs text-zinc-400'>
                    {t(`types.${entry.item.type}`)}
                  </p>
                  <p className='mt-1 line-clamp-2 text-lg font-bold leading-snug text-zinc-100'>
                    {display.title}
                  </p>
                  <p className='mt-0.5 truncate text-sm text-zinc-400'>
                    {display.subtitle}
                  </p>
                  <div className='mt-auto flex items-center justify-between gap-3 pt-3'>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        LEVEL_TEXT[entry.freshness.level],
                      )}>
                      {playedLabel(entry.freshness)}
                    </span>
                    <FreshnessMeter freshness={entry.freshness} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <Button
            onClick={() => entry && onPlay(entry)}
            disabled={!entry || isStarting}
            className='h-12 rounded-lg bg-white font-bold text-black focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
            <span className='flex items-center gap-2.5'>
              {entry && !isSessionPlayable(entry.item) ? (
                <Check className='h-4 w-4' />
              ) : (
                <Play className='h-4 w-4 fill-current' />
              )}
              {entry && !isSessionPlayable(entry.item)
                ? t("draw.done")
                : t("draw.play")}
            </span>
          </Button>
          <Button
            onClick={drawAgain}
            disabled={entries.length < 2 || isStarting}
            className='h-12 rounded-lg bg-zinc-800 font-semibold text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
            <span className='flex items-center gap-2.5'>
              <Layers className='h-4 w-4 text-zinc-400' />
              {t("draw.again")}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
