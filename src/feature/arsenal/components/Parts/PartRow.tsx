import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { PartId, PartTier } from "feature/arsenal/types/arsenal.types";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { TierPlate } from "../TierPlate";
import { PartIcon } from "./PartIcon";

const partRow = cva("flex items-center rounded-lg", {
  variants: {
    variant: {
      /** A line of a bill the player is about to pay. */
      full: "gap-4 px-4 py-3",
      /** The same line, shrunk for the columns where a dozen bills are compared. */
      compact: "gap-2 py-1.5 pl-1.5 pr-3",
      /** A payout: a flat quantity, nothing to be short of. */
      yield: "justify-between gap-4",
    },
    ok: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: "full", ok: true, className: "bg-zinc-800/40" },
    { variant: "full", ok: false, className: "bg-zinc-800/20" },
    { variant: "compact", ok: true, className: "bg-zinc-800/50" },
    { variant: "compact", ok: false, className: "bg-zinc-800/25" },
  ],
  defaultVariants: { variant: "full", ok: true },
});

/**
 * `box` frames a cost with no socket of its own (Fame); `plate` is the socket a
 * part gets, and `icon` the part inside it — smaller than the plate, because a
 * hollow only reads as one if the thing in it has room to sit.
 */
const ICON_SIZE: Record<
  PartRowVariant,
  { box: string; plate: number; icon: number }
> = {
  full: { box: "h-11 w-11", plate: 46, icon: 36 },
  compact: { box: "h-8 w-8", plate: 32, icon: 26 },
  yield: { box: "h-10 w-10", plate: 42, icon: 34 },
};

type PartRowVariant = NonNullable<VariantProps<typeof partRow>["variant"]>;

interface PartRowProps {
  /** The part this row counts. Omitted only by a cost that is not a part (Fame). */
  partId?: PartId;
  /** Absent on a cost that has no tier — Fame is billed in the same list. */
  tier?: PartTier;
  /** A bill row: what the job asks for, against what the wallet holds. */
  need?: number;
  have?: number;
  /** A payout row: a flat quantity, with nothing to measure it against. */
  qty?: number;
  /** Overrides for a non-part cost — Fame is priced in the same list as the screws. */
  icon?: ReactNode;
  label?: string;
  variant?: PartRowVariant;
  /** Tooltip type scale. Only meaningful on `yield`. */
  dense?: boolean;
  /** Staggers the entry animation when a list renders. */
  index?: number;
}

/**
 * One part, one row — the single place the game draws "icon + name + tier +
 * how many".
 *
 * Bills, mod mini-bills and teardown payouts used to each have their own
 * implementation of this row, with three type scales and two different ideas of
 * what "short" looks like. They are the same concept seen at three sizes, so the
 * variant is a size, not a rewrite.
 *
 * On a bill row the *cost* is the headline and the stock is the whisper below it:
 * showing both at the same weight — "30 / 8" — reads as a fraction and lands
 * backwards, because the eye takes the first, larger number for the ask.
 */
export const PartRow = ({
  partId,
  tier,
  need,
  have,
  qty,
  icon,
  label,
  variant = "full",
  dense = false,
  index = 0,
}: PartRowProps) => {
  const isBill = need != null && have != null;
  const ok = isBill ? have >= need : true;
  const name = label ?? (partId ? getPartLabel(partId) : "");
  const size = ICON_SIZE[variant];
  const tierColor = tier ? PART_TIER_COLORS[tier] : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25), duration: 0.25 }}
      title={
        isBill
          ? `${name}${tier ? ` (${tier})` : ""} — you hold ${have}, this needs ${need}`
          : undefined
      }
      className={partRow({ variant, ok })}>
      {/* A part sits in the same lit hollow the stash hangs it in, so the tier
          is legible before the word under the name is read. A cost that is not
          a part — Fame — brings its own emblem and needs no socket. */}
      {tierColor && !icon ? (
        <TierPlate
          color={tierColor}
          size={dense ? 32 : size.plate}
          muted={!ok}>
          <PartIcon partId={partId!} size={dense ? 26 : size.icon} />
        </TierPlate>
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            dense ? "h-8 w-8" : size.box,
            !ok && "opacity-40 grayscale",
          )}>
          {icon ?? <PartIcon partId={partId!} size={dense ? 30 : size.icon} />}
        </span>
      )}

      {variant === "compact" ? (
        // No room for the name: the icon carries it and the tooltip spells it out.
        <span className='flex shrink-0 flex-1 items-center justify-end gap-2'>
          <span
            className={cn(
              "text-sm font-black tabular-nums",
              ok ? "text-zinc-100" : "text-amber-400",
            )}>
            {have}
            <span className='text-zinc-600'> / </span>
            {need}
          </span>
          {tier && (
            <span className='text-xs font-semibold' style={{ color: tierColor }}>
              {tier}
            </span>
          )}
        </span>
      ) : (
        <>
          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <span
              className={cn(
                "font-bold text-zinc-100",
                dense ? "text-xs" : "text-base",
              )}>
              {name}
            </span>
            {tier && (
              <span
                className={cn(
                  "font-semibold",
                  dense ? "text-[10px]" : "text-sm",
                )}
                style={{ color: tierColor }}>
                {tier}
              </span>
            )}
          </span>

          {isBill ? (
            <span className='flex shrink-0 items-center gap-3'>
              <span className='flex flex-col items-end gap-0.5'>
                <span
                  className={cn(
                    "text-2xl font-black leading-none tabular-nums",
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
                    : `you have ${have} — ${need! - have!} short`}
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
          ) : (
            <span
              className={cn(
                "shrink-0 font-black tabular-nums text-white",
                dense ? "text-xs" : "text-base",
              )}>
              ×{qty}
            </span>
          )}
        </>
      )}
    </motion.div>
  );
};
