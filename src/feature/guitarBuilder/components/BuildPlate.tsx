import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

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
  const labels = useArsenalLabels();
  const { t } = labels;
  // The sticker line's name is built in the util as "Best 2 of 3".
  const lineName = (line: { slot: string; name: string }) => {
    const best = line.slot === "sticker" && /^Best (\d+) of (\d+)$/.exec(line.name);
    return best
      ? t("builder.best_of", { best: best[1], total: best[2] })
      : line.name;
  };
  return (
    <div className='space-y-5'>
      <div className='flex items-end justify-between gap-4'>
        <div className='min-w-0'>
          <p className='truncate font-display text-xl font-semibold text-zinc-50'>
            {name}
          </p>
          {summary.complete ? (
            <p className='mt-0.5 text-sm' style={{ color }}>
              {labels.rarity(summary.rarity)}
            </p>
          ) : (
            <p className='mt-0.5 text-sm text-zinc-400'>{t("builder.missing_parts")}</p>
          )}
        </div>
        <p
          className='relative font-teko text-5xl leading-none text-zinc-100'
          title={t("card.guitar.level")}>
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
              {labels.slot(line.slot)}
            </dt>
            <dd className='min-w-0 flex-1 truncate text-zinc-300'>
              {lineName(line)}
            </dd>
            <dd className='tabular-nums text-zinc-100'>+{line.level}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
