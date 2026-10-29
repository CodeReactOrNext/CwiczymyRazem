"use client";

import { cn } from "assets/lib/utils";
import type { BossId } from "feature/bosses/types/boss.types";
import type { BossCard, BossLadder } from "feature/landing/lib/bossFightsProps";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STEP_MS = 1900;

interface PhaseLadderProps {
  ladders: BossLadder[];
  bosses: BossCard[];
}

/**
 * Fifteen phases of one run per boss, dealt by the real generators: a bar per
 * phase (how fast it comes at you), and the phase under the cursor spelled out.
 * Steps through on its own until the visitor picks a bar.
 */
export const PhaseLadder = ({ ladders, bosses }: PhaseLadderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  // The bars grow in once; the stepping only runs while the ladder is on screen.
  const shown = useInView(ref, { amount: 0.35, once: true });
  const reduceMotion = useReducedMotion();
  const [bossId, setBossId] = useState<BossId>(ladders[0].id);
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const ladder = ladders.find((l) => l.id === bossId) ?? ladders[0];
  const phase = ladder.phases[index];
  const maxRate = Math.max(...ladder.phases.map((p) => p.rate));
  const auto = inView && !touched && !reduceMotion;

  useEffect(() => {
    if (!auto) return undefined;
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % ladder.phases.length),
      STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [auto, index, ladder.phases.length]);

  const pickBoss = (id: BossId) => {
    setBossId(id);
    setIndex(0);
  };

  return (
    <div ref={ref} className='rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <div className='flex flex-wrap gap-2' role='tablist' aria-label='Boss'>
        {bosses.map((boss) => (
          <button
            key={boss.id}
            type='button'
            role='tab'
            aria-selected={boss.id === bossId}
            onClick={() => pickBoss(boss.id)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 sm:px-3",
              boss.id === bossId
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300",
            )}>
            {boss.name.replace(/^The /, "")}
          </button>
        ))}
      </div>

      <div className='mt-6 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'>
        <div>
          <p className='mb-3 text-xs text-zinc-500'>
            {ladder.unit[0].toUpperCase() + ladder.unit.slice(1)}, phase by
            phase
          </p>
          <div className='flex h-44 items-end gap-1 sm:gap-1.5'>
            {ladder.phases.map((p, i) => (
              <button
                key={`${ladder.id}-${p.phase}`}
                type='button'
                onClick={() => {
                  setTouched(true);
                  setIndex(i);
                }}
                aria-label={`Phase ${p.phase}: ${p.bpm} BPM${p.gate ? ", a gate" : ""}`}
                aria-pressed={i === index}
                className='group flex h-full flex-1 flex-col justify-end focus-visible:outline-none'>
                <motion.span
                  className={cn(
                    "block w-full rounded-sm transition-colors",
                    i === index
                      ? "bg-white"
                      : p.gate
                        ? "bg-amber-400/45 group-hover:bg-amber-300/70"
                        : "bg-zinc-700 group-hover:bg-zinc-500",
                  )}
                  initial={reduceMotion ? false : { height: 0 }}
                  animate={
                    shown || reduceMotion
                      ? { height: `${Math.max(6, (p.rate / maxRate) * 100)}%` }
                      : { height: 0 }
                  }
                  transition={{
                    duration: 0.6,
                    delay: i * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </button>
            ))}
          </div>
          <div className='mt-2 flex gap-1 sm:gap-1.5' aria-hidden='true'>
            {ladder.phases.map((p, i) => (
              <span
                key={p.phase}
                className={cn(
                  "flex-1 text-center text-[11px] tabular-nums",
                  i === index ? "text-white" : "text-zinc-600",
                )}>
                {p.phase}
              </span>
            ))}
          </div>
          <p className='mt-4 flex items-center gap-2 text-xs text-zinc-500'>
            <span
              className='inline-block h-2.5 w-2.5 rounded-sm bg-amber-400/45'
              aria-hidden='true'
            />
            Gate: more HP, harder bites, a savepoint once reached
          </p>
        </div>

        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={`${ladder.id}-${phase.phase}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-live='polite'>
            <div className='flex items-baseline gap-3'>
              <p className='font-landingHeading text-xl font-bold text-white'>
                Phase {phase.phase}
              </p>
              {phase.gate && (
                <span className='rounded bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300'>
                  Gate
                </span>
              )}
            </div>
            <p className='mt-3 font-teko text-5xl tabular-nums leading-none text-white'>
              {phase.bpm}
              <span className='ml-1.5 text-2xl text-zinc-500'>BPM</span>
            </p>
            <p className='mt-1 text-sm text-zinc-400'>{phase.rhythm}</p>
            <dl className='mt-5 space-y-3 text-sm'>
              <div>
                <dt className='text-xs text-zinc-500'>
                  {ladder.id === "fretweaver" ? "Finger orders" : "Progression"}
                </dt>
                <dd className='mt-0.5 break-words font-semibold text-zinc-100'>
                  {phase.drill}
                </dd>
                <dd className='text-zinc-400'>{phase.detail}</dd>
              </div>
              <div>
                <dt className='text-xs text-zinc-500'>Boss HP this phase</dt>
                <dd className='mt-0.5 tabular-nums text-zinc-200'>
                  {phase.hp}
                </dd>
              </div>
              <div>
                <dt className='text-xs text-zinc-500'>Threats</dt>
                <dd className='mt-0.5 text-zinc-300'>
                  {phase.threats.length === 0
                    ? "None yet: just the drill"
                    : phase.threats.map((threat, i) => (
                        <span key={threat}>
                          {i > 0 && ", "}
                          <span
                            className={
                              phase.joins.includes(threat)
                                ? "font-semibold text-orange-300"
                                : undefined
                            }>
                            {threat}
                          </span>
                        </span>
                      ))}
                </dd>
                {phase.joins.length > 0 && (
                  <dd className='mt-1 text-xs text-orange-300/80'>
                    New this phase
                  </dd>
                )}
              </div>
            </dl>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
