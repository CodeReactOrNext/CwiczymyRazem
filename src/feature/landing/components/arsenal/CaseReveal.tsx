import { cn } from "assets/lib/utils";
import type {
  ArsenalGear,
  ArsenalPageProps,
} from "feature/landing/lib/arsenalProps";
import { REEL_WIN } from "feature/landing/lib/arsenalProps";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { transitions } from "lib/motion/motion";
import { useEffect, useRef, useState } from "react";

import { RARITY_COLOR } from "./rarity";

/** One opening, in seconds from its start — the reel's spin is the app's: 5 s, the same ease. */
const T = { spin: 0.9, spinFor: 5, hold: 3 };
const TILE = 132;
/** Where the reel stops inside the winning tile, so it doesn't land dead centre every time. */
const LANDING_JITTER = [-18, 11, -6];

const Tile = ({ gear, won }: { gear: ArsenalGear; won: boolean }) => {
  const color = RARITY_COLOR[gear.rarity];
  return (
    <div
      className='flex shrink-0 flex-col items-center gap-1.5 px-1'
      style={{ width: TILE }}>
      <div
        className='relative flex h-[92px] w-full items-center justify-center overflow-hidden rounded-md transition-shadow duration-500'
        style={{
          background: `radial-gradient(circle at center, ${color}26 0%, ${color}0d 45%, rgba(24,24,27,0.85) 85%)`,
          boxShadow: won
            ? `0 0 26px ${color}88, inset 0 0 18px ${color}2e`
            : undefined,
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gear.image}
          alt=''
          draggable={false}
          className={cn(
            "relative select-none object-contain",
            gear.kind === "guitar"
              ? "h-[230px] w-[230px] -rotate-45"
              : "h-[76px] w-[76px]",
          )}
        />
        <span
          className='absolute inset-x-0 bottom-0 h-1'
          style={{ background: color, opacity: won ? 1 : 0.75 }}
        />
      </div>
      <span
        className={cn(
          "w-full truncate text-center text-[11px] font-bold transition-opacity",
          won ? "opacity-100" : "opacity-60",
        )}
        style={{ color }}>
        {gear.name}
      </span>
    </div>
  );
};

/**
 * The hero's moving picture, opened the way the app opens a case: the case and
 * its price, then a reel of real gear of that kind that spins up, slows down
 * and stops on the drop, which lights up in its rarity's colour. Three real
 * cases, one after another. With reduced motion the first reel sits stopped
 * on its drop.
 */
export const CaseReveal = ({
  reveals,
}: {
  reveals: ArsenalPageProps["reveals"];
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"case" | "spin" | "won">(
    still ? "won" : "case",
  );

  useEffect(() => {
    if (still || !inView) return undefined;
    const timers = [
      window.setTimeout(() => setPhase("spin"), T.spin * 1000),
      window.setTimeout(() => setPhase("won"), (T.spin + T.spinFor) * 1000),
      window.setTimeout(
        () => {
          setPhase("case");
          setIndex((value) => (value + 1) % reveals.length);
        },
        (T.spin + T.spinFor + T.hold) * 1000,
      ),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [index, inView, still, reveals.length]);

  const current = reveals[index];
  const color = RARITY_COLOR[current.gear.rarity];
  const won = phase === "won";
  // The strip starts at the viewport's middle; this puts the drop under the marker.
  const stop =
    -(REEL_WIN * TILE + TILE / 2) +
    LANDING_JITTER[index % LANDING_JITTER.length];

  return (
    <div
      ref={ref}
      role='img'
      aria-label={`Opening a ${current.caseName} for ${current.fame} Fame: the reel stops on ${current.gear.name}, a ${current.gear.rarity} ${current.gear.kind}`}
      className='overflow-hidden rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      {/* The case */}
      <div className='flex items-center gap-4'>
        <AnimatePresence mode='wait'>
          <motion.img
            key={`case-${index}`}
            src={current.caseImage}
            alt=''
            draggable={false}
            className='h-20 w-auto select-none sm:h-24'
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={
              phase === "case"
                ? { opacity: 1, y: 0, rotate: [0, -2, 2, -1, 0] }
                : { opacity: 1, y: 0, rotate: 0 }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </AnimatePresence>
        <div>
          <p className='text-sm text-zinc-500'>{current.caseName}</p>
          <p className='text-xl font-bold text-white'>
            <span className='font-teko text-3xl tabular-nums'>
              {current.fame}
            </span>{" "}
            <span className='text-base font-semibold text-zinc-400'>Fame</span>
          </p>
        </div>
      </div>

      {/* The reel */}
      <div className='relative -mx-6 mt-6 h-[124px] overflow-hidden sm:-mx-8'>
        <motion.div
          key={`reel-${index}`}
          className='absolute left-1/2 top-0 flex'
          initial={{ x: still ? stop : -(TILE / 2) }}
          animate={{ x: phase === "case" ? -(TILE / 2) : stop }}
          transition={
            phase === "spin"
              ? { duration: T.spinFor, ease: [0.15, 0, 0.07, 1] }
              : { duration: 0 }
          }>
          {current.reel.map((gear, i) => (
            <Tile key={i} gear={gear} won={won && i === REEL_WIN} />
          ))}
        </motion.div>
        {/* The marker the reel stops under */}
        <span
          aria-hidden
          className='absolute left-1/2 top-0 h-[92px] w-0.5 -translate-x-1/2 bg-white/90'
        />
        <span
          aria-hidden
          className='pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent'
        />
        <span
          aria-hidden
          className='pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent'
        />
      </div>

      {/* What came out */}
      <div className='mt-4 flex h-14 items-end justify-between gap-4'>
        <AnimatePresence mode='wait'>
          {won ? (
            <motion.div
              key={`label-${index}`}
              initial={still ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transitions.base}>
              <p className='text-sm font-semibold' style={{ color }}>
                {current.gear.rarity}{" "}
                <span className='font-normal text-zinc-500'>
                  {current.gear.kind === "guitar"
                    ? "guitar"
                    : `${current.gear.stage ?? "pedal"} pedal`}
                </span>
              </p>
              <p className='text-xl font-bold text-white'>
                {current.gear.name}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key={`opening-${index}`}
              className='text-sm text-zinc-500'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.base}>
              {phase === "spin" ? "Opening…" : "Open the case"}
            </motion.p>
          )}
        </AnimatePresence>
        <span className='flex gap-1.5' aria-hidden>
          {reveals.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors duration-base",
                idx === index ? "bg-zinc-200" : "bg-zinc-800",
              )}
            />
          ))}
        </span>
      </div>
    </div>
  );
};
