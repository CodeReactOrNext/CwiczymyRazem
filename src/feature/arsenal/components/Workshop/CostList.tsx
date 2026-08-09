import { cn } from "assets/lib/utils";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { RecipeLine } from "feature/arsenal/data/workshop";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { PartIcon } from "../Parts/PartIcon";
import { FameCoin } from "./FameCoin";

interface RowProps {
  icon: ReactNode;
  name: string;
  sub?: ReactNode;
  need: number;
  have: number;
  index: number;
}

/**
 * One line of a bill.
 *
 * The *cost* is the headline and the stock is the whisper underneath. Showing
 * both at the same weight — "30 / 8" — reads as a fraction and lands backwards:
 * the eye takes the first, larger number for the thing being asked of it.
 */
const CostRow = ({ icon, name, sub, need, have, index }: RowProps) => {
  const ok = have >= need;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25), duration: 0.25 }}
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-3",
        ok ? "bg-zinc-800/40" : "bg-zinc-800/20",
      )}>
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center",
          !ok && "opacity-40 grayscale",
        )}>
        {icon}
      </span>

      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='text-base font-bold text-zinc-100'>{name}</span>
        {sub}
      </span>

      <span className='flex shrink-0 items-center gap-3'>
        <span className='flex flex-col items-end gap-0.5'>
          <span
            className={cn(
              "text-2xl font-black tabular-nums leading-none",
              ok ? "text-zinc-100" : "text-amber-400",
            )}>
            {need}
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              ok ? "text-zinc-500" : "text-amber-400/80",
            )}>
            {ok
              ? `you have ${have}`
              : `you have ${have} — ${need - have} short`}
          </span>
        </span>

        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            ok ? "bg-emerald-500/15" : "bg-zinc-800",
          )}>
          {ok ? (
            <Check size={13} strokeWidth={3} className='text-emerald-400' />
          ) : (
            <span className='h-1.5 w-1.5 rounded-full bg-zinc-600' />
          )}
        </span>
      </span>
    </motion.div>
  );
};

interface CostListProps {
  recipe: RecipeLine[];
  /** Fame sits in the same list as the parts, because it is the same thing: a cost. */
  fame?: { need: number; have: number };
}

/**
 * Everything the job takes, in one dark panel.
 *
 * Pairing it with a tinted "You get" panel is what makes the dialog readable at a
 * glance: colour means gain, dark means spend, and nothing has to be read to work
 * out which half of the trade you are looking at.
 */
export const CostList = ({ recipe, fame }: CostListProps) => {
  const rows = [
    ...(fame ? [{ kind: "fame" as const, ...fame }] : []),
    ...recipe.map((line) => ({ kind: "part" as const, line })),
  ];
  const short = rows.filter((r) =>
    r.kind === "fame" ? r.have < r.need : !r.line.ok,
  ).length;

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-950/50 p-6'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <span className='text-sm font-black tracking-wide text-zinc-300'>
          You pay
        </span>
        <span
          className={cn(
            "text-sm font-bold",
            short === 0 ? "text-emerald-400" : "text-amber-400",
          )}>
          {short === 0 ? "you have it all" : `${short} still short`}
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        {rows.map((row, i) =>
          row.kind === "fame" ? (
            <CostRow
              key='fame'
              icon={<FameCoin size={30} />}
              name='Fame'
              need={row.need}
              have={row.have}
              index={i}
            />
          ) : (
            <CostRow
              key={`${row.line.partId}:${row.line.tier}`}
              icon={<PartIcon partId={row.line.partId} size={40} />}
              name={getPartLabel(row.line.partId)}
              sub={
                <span
                  className='text-sm font-semibold'
                  style={{ color: PART_TIER_COLORS[row.line.tier] }}>
                  {row.line.tier}
                </span>
              }
              need={row.line.need}
              have={row.line.have}
              index={i}
            />
          ),
        )}
      </div>
    </div>
  );
};
