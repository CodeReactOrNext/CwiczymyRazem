"use client";

import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { motion, useReducedMotion } from "framer-motion";
import type { UiSound } from "lib/uiSounds/uiSounds";
import { playUiSound } from "lib/uiSounds/uiSounds";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Where a scene is in its three beats:
 *
 *   working  the request is out. The stage winds up — and keeps winding up for as
 *            long as the server takes, so a slow answer reads as effort, not lag.
 *   reveal   the answer is in. The payoff plays, cut to `revealFor` seconds.
 *   settled  the payoff has landed; the caption says what happened and Continue
 *            appears.
 */
export type ScenePhase = "working" | "reveal" | "settled";

interface ArsenalSceneProps {
  /** Whether the server has answered. The reveal waits on this. */
  ready: boolean;
  /**
   * The shortest wind-up, in seconds. A fast connection still gets the beat of
   * anticipation that makes the payoff land — without it the reveal would play
   * over the click that started it.
   */
  windUp?: number;
  /** How long the payoff choreography runs before the scene settles. */
  revealFor: number;
  /** Seconds after settling before it closes itself; `null` waits for Continue. */
  autoClose?: number | null;
  /** The scene's one colour — the done caption is set in it. */
  color: string;
  caption: { working: string; done: string };
  /** What happened, for screen readers. Announced once the scene settles. */
  summary: string;
  /** Classes for the stage, which scenes size to what they draw. */
  stageClassName?: string;
  stage: (phase: ScenePhase) => ReactNode;
  /** The receipt under the stage — parts, a level, a name. */
  footer?: (phase: ScenePhase) => ReactNode;
  sound?: UiSound | null;
  onClose: () => void;
}

/**
 * The shell every arsenal scene shares: a dark full-screen stage with a caption
 * above and a receipt below, cut to the same three beats as the merge.
 *
 * It owns time — the wind-up, the reveal, the settle, the auto-close — and hands
 * the current beat to the scene, which owns what is drawn. That split is what
 * lets a teardown and a delivery feel like the same game without either of them
 * re-implementing a timer.
 *
 * It sits over everything, including an open Radix dialog: pointer events are
 * switched back on for the scene itself (a modal dialog turns them off on
 * `body`), and presses are stopped here so the dialog underneath does not read
 * them as a click outside and close mid-scene.
 */
export const ArsenalScene = ({
  ready,
  windUp = 0.9,
  revealFor,
  autoClose = 2.6,
  color,
  caption,
  summary,
  stageClassName,
  stage,
  footer,
  sound = "reward",
  onClose,
}: ArsenalSceneProps) => {
  const { t } = useArsenalLabels();
  const reduceMotion = useReducedMotion();
  const [woundUp, setWoundUp] = useState(false);
  const [settled, setSettled] = useState(false);

  // The latest callback, without restarting the close timer whenever the
  // parent re-renders with a new inline function.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const id = setTimeout(
      () => setWoundUp(true),
      (reduceMotion ? 0 : windUp) * 1000,
    );
    return () => clearTimeout(id);
  }, [reduceMotion, windUp]);

  const revealing = ready && woundUp;

  useEffect(() => {
    if (!revealing) return undefined;
    if (sound) playUiSound(sound);
    const id = setTimeout(
      () => setSettled(true),
      (reduceMotion ? 0.2 : revealFor) * 1000,
    );
    return () => clearTimeout(id);
  }, [revealing, reduceMotion, revealFor, sound]);

  useEffect(() => {
    if (!settled || autoClose == null) return undefined;
    const id = setTimeout(() => closeRef.current(), autoClose * 1000);
    return () => clearTimeout(id);
  }, [settled, autoClose]);

  useEffect(() => {
    if (!settled) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settled]);

  const phase: ScenePhase = settled
    ? "settled"
    : revealing
      ? "reveal"
      : "working";

  return createPortal(
    <motion.div
      role='status'
      // Clipped sideways: shards and sparks fly past the edge of a phone, and
      // must not open a horizontal scrollbar mid-scene.
      className='fixed inset-0 z-[1100] overflow-y-auto overflow-x-hidden bg-black/95'
      style={{ pointerEvents: "auto" }}
      onPointerDown={(e) => e.stopPropagation()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}>
      {settled && <span className='sr-only'>{summary}</span>}

      {/*
        The stage sits in the middle row of three, so the receipt arriving
        underneath it grows downward instead of pushing the whole scene up — a
        centred column jumped the moment the parts landed. Where a phone is too
        short for that, the rows give way and `layout` glides the stage to its
        new place rather than snapping it there.
      */}
      <div className='grid min-h-full grid-rows-[1fr_auto_1fr] justify-items-center gap-6 px-4 py-8'>
        {/* Caption: what is happening, then what happened. */}
        <motion.div
          layout='position'
          className='relative h-6 w-full self-end text-center'
          aria-hidden>
          <motion.p
            className='absolute inset-x-0 text-sm font-semibold text-zinc-400'
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "working" ? 1 : 0 }}
            transition={{ duration: 0.3 }}>
            {caption.working}
          </motion.p>
          <motion.p
            className='absolute inset-x-0 text-sm font-bold'
            style={{ color }}
            initial={{ opacity: 0, y: 6 }}
            animate={
              phase === "settled" ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
            }
            transition={{ duration: 0.3 }}>
            {caption.done}
          </motion.p>
        </motion.div>

        <motion.div
          layout='position'
          className={cn(
            "relative flex h-56 w-full max-w-sm items-center justify-center sm:h-64",
            stageClassName,
          )}
          aria-hidden>
          {stage(phase)}
        </motion.div>

        <div className='flex w-full max-w-md flex-col items-center gap-6 self-start'>
          {footer && (
            <div className='flex w-full flex-col items-center gap-4'>
              {footer(phase)}
            </div>
          )}

          <motion.button
            type='button'
            onClick={() => closeRef.current()}
            disabled={!settled}
            tabIndex={settled ? 0 : -1}
            className='h-11 min-w-40 shrink-0 rounded-lg bg-white px-6 text-sm font-medium text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none hover:bg-zinc-200'
            initial={{ opacity: 0 }}
            animate={{ opacity: settled ? 1 : 0 }}
            transition={{ duration: 0.3 }}>
            {t("merge_anim.continue")}
          </motion.button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};
