import { cn } from "assets/lib/utils";

import type { ItemUse } from "../utils/inUse";

/**
 * Amber is the profile — what other players see on you. Cyan is the rig and the
 * pedalboard, the gear that is actually being ranked. Same two colours the item
 * cards have always used for this, so the mark means the same thing wherever it
 * turns up.
 */
const USE_STYLES = {
  profile: { label: "equipped", color: "#fbbf24" },
  rig: { label: "rig slot", color: "#22d3ee" },
  board: { label: "pedalboard", color: "#22d3ee" },
} as const;

const describe = (use: ItemUse) => {
  const style = USE_STYLES[use.where];
  return {
    color: style.color,
    label: use.where === "rig" ? `${style.label} ${use.slot + 1}` : style.label,
  };
};

interface InServiceTagsProps {
  uses: ItemUse[];
  className?: string;
}

/**
 * The lit dot that says a piece of gear is in service right now.
 *
 * The workshop is the one place where this actually changes a decision: parts
 * poured into something sitting in the stash do nothing for your Rig Level, and
 * the bench never used to say which of the two you had in front of you.
 */
export const InServiceTags = ({ uses, className }: InServiceTagsProps) => {
  if (uses.length === 0) return null;

  return (
    <span
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {uses.map((use) => {
        const { label, color } = describe(use);
        return (
          <span key={label} className='flex items-center gap-1.5'>
            <span
              aria-hidden
              className='h-1.5 w-1.5 shrink-0 rounded-full'
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span
              className='text-[9px] font-semibold tracking-wide'
              style={{ color: `${color}c4` }}>
              {label}
            </span>
          </span>
        );
      })}
    </span>
  );
};
