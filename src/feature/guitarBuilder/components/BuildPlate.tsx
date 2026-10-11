import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

import { SLOT_LABELS } from "../data/components";
import type { buildLevel } from "../utils/components";

type Summary = ReturnType<typeof buildLevel>;

/** One change of the build's level, to float beside the number. */
export interface LevelPulse {
  key: number;
  delta: number;
  color: string;
}

interface BuildPlateProps {
  name: string;
  summary: Summary;
  pulse?: LevelPulse | null;
}

/** The level counts to its new value instead of jumping there. */
const CountingLevel = ({ value }: { value: number }) => {
  const reduceMotion = useReducedMotion();
  const shown = useMotionValue(value);
  const rounded = useTransform(shown, (v) => Math.round(v));
  useEffect(() => {
    if (reduceMotion) {
      shown.set(value);
      return undefined;
    }
    const controls = animate(shown, value, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduceMotion, shown]);
  return <motion.span>{rounded}</motion.span>;
};

/**
 * The plate under the bay: what the build is, what it adds up to, and which
 * part brings what — so the number in the emblem above is never a mystery.
 */
export const BuildPlate = ({ name, summary, pulse }: BuildPlateProps) => {
  const color = getRarityColor(summary.rarity);
  return (
    <div className='space-y-5'>
      <div className='flex items-end justify-between gap-4'>
        <div className='min-w-0'>
          <p className='truncate font-display text-xl font-semibold text-zinc-50'>
            {name}
          </p>
          {summary.complete ? (
            <p className='mt-0.5 text-sm' style={{ color }}>
              {summary.rarity}
            </p>
          ) : (
            <p className='mt-0.5 text-sm text-zinc-400'>Missing parts</p>
          )}
        </div>
        <p
          className='relative font-teko text-5xl leading-none text-zinc-100'
          title='Guitar level'>
          <CountingLevel value={summary.total} />
          {pulse && (
            <motion.span
              key={pulse.key}
              aria-hidden
              className='pointer-events-none absolute -top-1 right-0 font-sans text-sm font-semibold tabular-nums'
              style={{ color: pulse.color }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: [0, 1, 1, 0], y: -22 }}
              transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1] }}>
              {pulse.delta > 0 ? `+${pulse.delta}` : pulse.delta}
            </motion.span>
          )}
        </p>
      </div>
      <dl className='space-y-1.5 text-sm'>
        {summary.lines.map((line) => (
          <div key={line.slot} className='flex items-baseline gap-3'>
            <dt className='w-20 shrink-0 text-zinc-400'>
              {SLOT_LABELS[line.slot]}
            </dt>
            <dd className='min-w-0 flex-1 truncate text-zinc-300'>
              {line.name}
            </dd>
            <dd className='tabular-nums text-zinc-100'>+{line.level}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
