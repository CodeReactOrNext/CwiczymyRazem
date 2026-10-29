import { cn } from "assets/lib/utils";
import type { ArsenalPageProps } from "feature/landing/lib/arsenalProps";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const STEP_MS = 900;
const HOLD_MS = 3200;

/** A board as a player might first set it down: everything out of place. */
const SCRAMBLE = [4, 1, 3, 0, 2];

/**
 * Every order the board passes through on its way from scrambled to wired:
 * one swap of neighbours at a time, the way carrying a pedal across a row
 * trades it with each one it passes.
 */
const sortSteps = (start: number[]): number[][] => {
  const steps = [start];
  const order = [...start];
  for (let pass = 0; pass < order.length; pass++) {
    for (let i = 0; i < order.length - 1; i++) {
      if (order[i] > order[i + 1]) {
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
        steps.push([...order]);
      }
    }
  }
  return steps;
};

/**
 * The pedalboard's wiring bonus, played out: five real pedals stand out of
 * order with red cables between them, then get carried into place one swap
 * at a time until every cable is green — and the board's Fame per hour
 * climbs as each run is fixed. The signal enters on the right and leaves for
 * the amp on the left, as on the board in the app.
 */
export const PedalChainDemo = ({
  chain,
  chainFame,
}: {
  chain: ArsenalPageProps["chain"];
  chainFame: ArsenalPageProps["chainFame"];
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const steps = useMemo(
    () => sortSteps(SCRAMBLE.slice(0, chain.length)),
    [chain.length],
  );
  const [step, setStep] = useState(still ? steps.length - 1 : 0);

  useEffect(() => {
    if (still || !inView) return undefined;
    const isLast = step === steps.length - 1;
    const id = window.setTimeout(
      () => setStep(isLast ? 0 : step + 1),
      isLast || step === 0 ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [step, steps.length, inView, still]);

  // Chain order, first pedal the guitar meets first.
  const order = steps[step];
  const cablesRight = order
    .slice(0, -1)
    .map((stage, idx) => order[idx + 1] > stage);
  const right = cablesRight.filter(Boolean).length;
  const flawless =
    right === cablesRight.length && order.length >= chainFame.flawlessMinPedals;
  const fame = right * chainFame.perCable + (flawless ? chainFame.flawless : 0);

  return (
    <div ref={ref} className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='flex items-baseline justify-between gap-4 text-xs text-zinc-500'>
        <span>Amp</span>
        <span>Guitar in</span>
      </div>

      {/* Right to left, like a real board: the guitar plugs in on the right. */}
      <ol
        aria-label='Pedals in signal order, from the guitar to the amp'
        className='mt-4 flex flex-row-reverse items-end justify-between gap-1 sm:gap-2'>
        {order.map((stageIdx, position) => {
          const pedal = chain[stageIdx];
          const cable = cablesRight[position];
          return (
            <motion.li
              key={pedal.name}
              layout={!still}
              transition={transitions.spring}
              className='flex min-w-0 flex-1 flex-row-reverse items-center'>
              <span className='flex min-w-0 flex-col items-center gap-2'>
                <Image
                  src={pedal.image}
                  alt={pedal.name}
                  width={321}
                  height={400}
                  className='h-14 w-auto select-none sm:h-24'
                  draggable={false}
                />
                <span className='truncate text-[11px] text-zinc-400'>
                  {pedal.stage}
                </span>
              </span>
              {cable !== undefined && (
                <span
                  aria-hidden
                  className={cn(
                    "mb-6 h-0.5 flex-1 rounded-full transition-colors duration-base",
                    cable ? "bg-emerald-400" : "bg-red-400",
                  )}
                />
              )}
            </motion.li>
          );
        })}
      </ol>

      <div className='mt-6 flex flex-wrap items-baseline justify-between gap-3'>
        <span
          className={cn(
            "text-sm transition-colors duration-base",
            flawless ? "font-semibold text-emerald-400" : "text-zinc-400",
          )}>
          {flawless
            ? "Wired in order"
            : `${cablesRight.length - right} cables run backwards`}
        </span>
        <span className='text-sm text-zinc-400'>
          <span className='font-teko text-3xl tabular-nums text-white'>
            +{fame}
          </span>{" "}
          Fame per hour of practice
        </span>
      </div>
    </div>
  );
};
