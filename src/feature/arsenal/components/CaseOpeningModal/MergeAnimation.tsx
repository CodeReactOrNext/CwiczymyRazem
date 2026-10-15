"use client";

import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type {
  EffectDefinition,
  GuitarDefinition,
  MergeOffer,
} from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";
import { CountUp } from "./CountUp";

/**
 * The timeline, in seconds. One place, so the keyframes below cannot drift from
 * the beats they are cut against:
 *
 *   0.00  both copies fade in, the duplicate off to the side
 *   0.65  the duplicate winds up and flies in, shedding sparks that converge
 *   1.20  impact — the target flashes and bumps, two rings and a burst go out
 *   1.25  the Item Level rolls up and the gain floats off it
 *   2.45  settled; the caption turns to "Merged" and Continue appears
 *   3.80  closes by itself if nobody presses anything
 */
const ENTER = 0.35;
const FLY_START = 0.65;
const IMPACT = 1.2;
const COUNT_FROM = IMPACT + 0.05;
const COUNT_FOR = 1.0;
const SETTLE = COUNT_FROM + COUNT_FOR + 0.2;
const AUTO_CLOSE = SETTLE + 1.35;

/** Sparks that run in to the target ahead of the duplicate. */
const INBOUND = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);
/** Sparks thrown out when it lands. */
const OUTBOUND = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

interface MergeAnimationProps {
  kind: "guitar" | "effect";
  def: GuitarDefinition | EffectDefinition;
  offer: MergeOffer;
  /** Called once, when the player continues or the scene has played out. */
  onDone: () => void;
}

/**
 * The duplicate folds into the copy you own.
 *
 * The scene is the whole point of merging made visible: two copies of the same
 * model, one of them flies into the other, the other takes the hit and its Item
 * Level rolls up by exactly what the server granted. Everything is cut in the
 * rarity's own colour — one hue, so a Mythic looks like a Mythic and a Common
 * does not pretend to be one.
 *
 * Time-driven rather than waiting on the request: the caller starts the merge
 * and the scene together, and decides when both are finished.
 */
export const MergeAnimation = ({
  kind,
  def,
  offer,
  onDone,
}: MergeAnimationProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const reduceMotion = useReducedMotion();
  const color = RARITY_STYLES[def.rarity].baseColor;

  // The latest callback, without restarting the close timer whenever the parent
  // re-renders with a new inline function.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  // Once, whichever comes first: Continue or the timer running out.
  const finished = useRef(false);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    doneRef.current();
  };

  useEffect(() => {
    const id = setTimeout(
      () => {
        if (finished.current) return;
        finished.current = true;
        doneRef.current();
      },
      (reduceMotion ? 1.6 : AUTO_CLOSE) * 1000,
    );
    return () => clearTimeout(id);
  }, [reduceMotion]);

  const isGuitar = kind === "guitar";
  const art = isGuitar
    ? getRankBadgeSrc((def as GuitarDefinition).imageId, "medium")
    : getEffectImageSrc((def as EffectDefinition).imageId, "medium");
  // The art is rotated by its own class and the wrappers below are moved by
  // framer, which writes an inline transform that would replace a class one — so
  // the two never share an element.
  const artClass = isGuitar
    ? "h-48 w-48 -rotate-90 object-contain sm:h-60 sm:w-60"
    : "h-36 w-36 object-contain sm:h-44 sm:w-44";
  const artImage = <img src={art} alt='' className={artClass} />;

  const impactDuration = IMPACT + 0.55;
  const flyTimes = [
    0,
    ENTER / IMPACT,
    FLY_START / IMPACT,
    (IMPACT - 0.12) / IMPACT,
    1,
  ];
  const landTimes = [
    0,
    ENTER / impactDuration,
    IMPACT / impactDuration,
    (IMPACT + 0.12) / impactDuration,
    1,
  ];

  const summary = t("merge_anim.sr", {
    name: def.name,
    before: offer.levelBefore,
    after: offer.levelAfter,
  });

  return createPortal(
    <motion.div
      role='status'
      className='fixed inset-0 z-[1100] flex flex-col items-center justify-center gap-6 bg-black/95 px-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}>
      <span className='sr-only'>{summary}</span>

      {/* Caption: what is happening, then what happened. */}
      <div className='relative h-6 w-full text-center' aria-hidden>
        <motion.p
          className='absolute inset-x-0 text-sm font-semibold text-zinc-400'
          initial={{ opacity: 0 }}
          animate={reduceMotion ? { opacity: 0 } : { opacity: [0, 1, 1, 0] }}
          transition={{
            duration: SETTLE,
            times: [0, 0.1, (SETTLE - 0.35) / SETTLE, 1],
          }}>
          {t("merge_anim.caption", { name: def.name })}
        </motion.p>
        <motion.p
          className='absolute inset-x-0 text-sm font-bold'
          style={{ color }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : SETTLE - 0.1,
            duration: 0.3,
          }}>
          {t("merge_anim.done")}
        </motion.p>
      </div>

      {/* The stage. */}
      <div
        className='relative flex h-52 w-full max-w-xs items-center justify-center sm:h-64'
        aria-hidden>
        <div
          className='pointer-events-none absolute inset-0'
          style={{
            background: `radial-gradient(closest-side, ${color}22 0%, transparent 100%)`,
          }}
        />

        {reduceMotion ? (
          artImage
        ) : (
          <>
            {/* The copy being kept. It takes the hit. */}
            <motion.div
              className='absolute'
              initial={{ opacity: 0, scale: 0.92, filter: "brightness(1)" }}
              animate={{
                opacity: [0, 1, 1, 1, 1],
                scale: [0.92, 1, 1, 1.12, 1],
                filter: [
                  "brightness(1)",
                  "brightness(1)",
                  "brightness(1)",
                  "brightness(1.8)",
                  "brightness(1)",
                ],
              }}
              transition={{
                duration: impactDuration,
                times: landTimes,
                ease: "easeOut",
              }}>
              {artImage}
            </motion.div>

            {/* The duplicate. Fades in off to the side, winds up, then goes. */}
            <motion.div
              className='absolute'
              initial={{ opacity: 0, x: "-80%", scale: 1, rotate: -10 }}
              animate={{
                opacity: [0, 1, 1, 1, 0],
                x: ["-80%", "-72%", "-72%", "-8%", "0%"],
                scale: [1, 1, 1, 0.7, 0.5],
                rotate: [-10, -8, -8, -2, 0],
              }}
              transition={{
                duration: IMPACT,
                times: flyTimes,
                ease: ["easeOut", "linear", "easeIn", "linear"],
              }}>
              {artImage}
            </motion.div>

            {/* Sparks converging on the target ahead of the duplicate. */}
            {INBOUND.map((angle, i) => (
              <motion.span
                key={`in-${i}`}
                className='absolute h-1.5 w-1.5 rounded-full'
                style={{ backgroundColor: color }}
                initial={{
                  opacity: 0,
                  x: Math.cos(angle) * 150,
                  y: Math.sin(angle) * 150,
                }}
                animate={{ opacity: [0, 1, 0], x: 0, y: 0, scale: [1, 1, 0.4] }}
                transition={{
                  delay: FLY_START + i * 0.03,
                  duration: IMPACT - FLY_START - i * 0.01,
                  ease: "easeIn",
                }}
              />
            ))}

            {/* Impact: two rings and a burst. */}
            {[0, 0.12].map((lag, i) => (
              <motion.span
                key={`ring-${i}`}
                className='absolute h-28 w-28 rounded-full'
                style={{ border: `${i === 0 ? 3 : 1.5}px solid ${color}` }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.2, 2.6] }}
                transition={{
                  delay: IMPACT + lag,
                  duration: 0.75,
                  times: [0, 0.15, 1],
                  ease: "easeOut",
                }}
              />
            ))}
            {OUTBOUND.map((angle, i) => {
              const distance = 110 + (i % 3) * 30;
              return (
                <motion.span
                  key={`out-${i}`}
                  className='absolute h-1.5 w-1.5 rounded-full'
                  style={{ backgroundColor: color }}
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    scale: [1, 1, 0.3],
                  }}
                  transition={{
                    delay: IMPACT + (i % 4) * 0.02,
                    duration: 0.85,
                    times: [0, 0.1, 1],
                    ease: "easeOut",
                  }}
                />
              );
            })}
          </>
        )}
      </div>

      {/* The number it was all for. */}
      <div className='relative flex flex-col items-center gap-1' aria-hidden>
        <span className='text-xs font-semibold text-zinc-500'>
          {t("merge_anim.level")}
        </span>
        <div className='flex items-baseline gap-3'>
          <motion.span
            className='font-display text-6xl font-black tabular-nums'
            initial={{ color: "#f4f4f5", opacity: reduceMotion ? 1 : 0 }}
            animate={{
              color: ["#f4f4f5", "#f4f4f5", color],
              opacity: 1,
            }}
            transition={{
              color: {
                duration: SETTLE,
                times: [0, (SETTLE - 0.4) / SETTLE, 1],
              },
              opacity: { delay: reduceMotion ? 0 : ENTER, duration: 0.3 },
            }}>
            {reduceMotion ? (
              offer.levelAfter
            ) : (
              <CountUp
                from={offer.levelBefore}
                to={offer.levelAfter}
                delay={COUNT_FROM}
                duration={COUNT_FOR}
              />
            )}
          </motion.span>
          <motion.span
            className='text-2xl font-black tabular-nums'
            style={{ color }}
            initial={{ opacity: 0, y: 10 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0 }
                : { opacity: [0, 1, 1], y: [10, 0, 0], scale: [0.7, 1.25, 1] }
            }
            transition={{
              delay: reduceMotion ? 0 : COUNT_FROM,
              duration: 0.6,
              times: [0, 0.4, 1],
              ease: "easeOut",
            }}>
            +{offer.gain}
          </motion.span>
        </div>
      </div>

      <motion.button
        type='button'
        onClick={finish}
        className='h-11 min-w-40 rounded-lg bg-white px-6 text-sm font-medium text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:bg-zinc-200'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : SETTLE, duration: 0.3 }}>
        {t("merge_anim.continue")}
      </motion.button>
    </motion.div>,
    document.body,
  );
};
