import { cn } from "assets/lib/utils";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { memo, useEffect, useRef, useState } from "react";

import { COMBO_PER_MULTIPLIER, getMultiplierTier, MAX_MULTIPLIER } from "../components/MicHud";
import { useNoteScore } from "../contexts/NoteMatchingContext";
import { getAccuracyDisplay } from "../hooks/noteMatchingFeedback";

/** Notes this close together add up into one "+points" instead of flickering one by one. */
const GAIN_MERGE_MS = 450;
/** How long the "+points" stays up after the last of them. */
const GAIN_HOLD_MS = 800;

/** The points of a run of notes, added up while they keep coming. */
function useRunningGain(score: number) {
  const last = useRef(score);
  const run = useRef({ points: 0, id: 0, until: 0 });
  const [gain, setGain] = useState<{ points: number; id: number } | null>(null);
  useEffect(() => {
    const points = score - last.current;
    last.current = score;
    if (points <= 0) return undefined;
    const now = performance.now();
    if (now < run.current.until) run.current.points += points;
    else run.current = { points, id: run.current.id + 1, until: 0 };
    run.current.until = now + GAIN_MERGE_MS;
    setGain({ points: run.current.points, id: run.current.id });
    const id = window.setTimeout(() => setGain(null), GAIN_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [score]);
  return gain;
}

/**
 * Stage mode's score: centred over the tab, where the eyes already are. The
 * number counts up instead of jumping; a run of notes adds up into one
 * "+points" that rises off it; the multiplier wears its tier's colour over a
 * bar filling toward the next tier. Accuracy and the streak sit beside it.
 */
export const StageScore = memo(function StageScore({ className }: { className?: string }) {
  const { t } = useTranslation("session");
  const { gameState, sessionAccuracy, sessionStats } = useNoteScore();
  const { score, combo, multiplier } = gameState;
  const reduced = useReducedMotion();

  const shown = useSpring(score, { stiffness: 150, damping: 26 });
  const shownText = useTransform(shown, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    if (reduced) shown.jump(score);
    else shown.set(score);
  }, [score, reduced, shown]);

  const gain = useRunningGain(score);
  const tier = getMultiplierTier(multiplier);
  const lit = multiplier > 1;
  const atMax = multiplier >= MAX_MULTIPLIER;
  const toNext = atMax ? 1 : (combo % COMBO_PER_MULTIPLIER) / COMBO_PER_MULTIPLIER;
  const accuracy = getAccuracyDisplay(sessionAccuracy, sessionStats);
  const accuracyText = accuracy.kind === "silent" ? t("hud.no_notes", accuracy.text) : accuracy.text;

  return (
    <div className={cn("flex items-end justify-center gap-12", className)}>
      {/* The multiplier over the streak still needed for the next one. */}
      <div className='flex w-28 flex-col items-end gap-2.5 pb-2'>
        <motion.span
          key={multiplier}
          initial={reduced ? false : { scale: 1.4, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 16 }}
          className={cn("origin-right font-teko text-6xl font-semibold leading-[0.75] tabular-nums", lit ? tier.text : "text-zinc-400")}>
          ×{multiplier}
        </motion.span>
        <div className='relative h-3 w-24 overflow-hidden rounded-full bg-zinc-900/80'>
          <motion.div
            className='absolute inset-y-0 left-0 rounded-full'
            style={{ backgroundColor: lit ? tier.from : "#71717a" }}
            initial={false}
            animate={{ width: `${Math.max(toNext * 100, 0)}%` }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}>
            {toNext > 0.15 && (
              <span aria-hidden className='light-hide absolute inset-x-1.5 top-[3px] h-[3px] rounded-full bg-white/30' />
            )}
          </motion.div>
        </div>
      </div>

      <div className='relative'>
        {/* The run's points, rising off the number. */}
        <div className='pointer-events-none absolute inset-x-0 -top-10 flex justify-center'>
          <AnimatePresence>
            {gain && (
              <motion.span
                key={gain.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={cn("font-teko text-3xl font-semibold leading-none tabular-nums", lit ? tier.text : "text-zinc-300")}>
                +{gain.points.toLocaleString()}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <motion.span className='block font-teko text-[5.5rem] font-semibold leading-[0.75] tabular-nums text-zinc-50'>
          {shownText}
        </motion.span>
      </div>

      {/* Accuracy, and the streak as it stands. */}
      <div className='flex w-28 flex-col items-start gap-1.5 pb-1.5'>
        <span
          title={accuracy.kind === "value" ? undefined : t(`hud.${accuracy.kind}_hint`, accuracy.hint)}
          className={cn("font-bold leading-none tabular-nums", accuracy.kind === "silent" ? "text-sm" : "text-3xl", accuracy.color)}>
          {accuracyText}
        </span>
        <span className='text-sm tabular-nums text-zinc-400'>
          {t("hud.streak")} <span className='font-semibold text-zinc-200'>{combo}</span>
        </span>
      </div>
    </div>
  );
});
