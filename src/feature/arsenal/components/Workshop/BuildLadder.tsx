import { cn } from "assets/lib/utils";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import type { WorkshopSubject } from "feature/arsenal/data/workshop";
import {
  getBuildRecipeParts,
  getBuildRequirement,
  priceRecipe,
} from "feature/arsenal/data/workshop";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { RARITY_STYLES } from "../RarityBadge";
import { PartTally } from "./PartTally";

interface BuildLadderProps {
  subject: WorkshopSubject;
  /** Stock is shown against every rung, not just the next one — that is the point. */
  wallet: ScrapPart[];
}

/** How many levels the map covers — the whole promotion ladder, plus a little. */
const LADDER_LENGTH = 9;

/**
 * The full build path, not just the next step.
 *
 * The design asks the player to commit one instrument to a long climb, and that
 * decision cannot be made from a single level's bill. Every rung is derivable from
 * the item's BOM, so the map costs nothing to show and turns "should I sink parts
 * into this one?" into a question with an answer on screen.
 */
export const BuildLadder = ({ subject, wallet }: BuildLadderProps) => {
  const [open, setOpen] = useState(false);

  const levels = Array.from({ length: LADDER_LENGTH }, (_, i) => i + 1).map(
    (level) => {
      const requirement = getBuildRequirement(
        level,
        subject.mintRarity,
        getEffectiveRarity(subject.mintRarity, level - 1),
      );
      return {
        level,
        requirement,
        recipe: priceRecipe(
          getBuildRecipeParts(level, subject.bom, subject.mintRarity),
          wallet,
        ),
        done: level <= subject.buildLevel,
        next: level === subject.buildLevel + 1,
      };
    },
  );

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/30 p-5'>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className='flex items-center justify-between gap-4 rounded text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 hover:text-zinc-200'>
        <span className='flex flex-col gap-0.5'>
          <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
            Build path
          </span>
          <span className='text-base font-bold text-zinc-200'>
            All {LADDER_LENGTH} builds and where they promote
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className='flex flex-col gap-2'>
          {levels.map(({ level, requirement, recipe, done, next }) => (
            <div
              key={level}
              className={cn(
                "flex flex-col gap-2 rounded-lg px-4 py-3",
                next
                  ? "bg-zinc-800/70 ring-1 ring-cyan-500/30"
                  : "bg-zinc-800/25",
                done && "opacity-50",
              )}>
              <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
                <span className='flex items-center gap-2'>
                  {done ? (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className='text-emerald-400'
                    />
                  ) : (
                    <span className='h-1.5 w-1.5 rounded-full bg-zinc-600' />
                  )}
                  <span className='text-base font-bold text-zinc-200'>
                    Build {level}
                  </span>
                  {next && (
                    <span className='text-xs font-semibold text-cyan-400'>
                      next
                    </span>
                  )}
                </span>

                <span className='flex items-center gap-3'>
                  {requirement.promotesTo && (
                    <span
                      className='rounded px-2 py-0.5 text-xs font-bold'
                      style={{
                        backgroundColor: `${RARITY_STYLES[requirement.promotesTo].baseColor}1f`,
                        color: RARITY_STYLES[requirement.promotesTo].baseColor,
                      }}>
                      → {requirement.promotesTo}
                    </span>
                  )}
                  <span className='text-xs text-zinc-500'>
                    {requirement.condition}
                  </span>
                </span>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                {recipe.map((line, i) => (
                  <PartTally
                    key={`${line.partId}:${line.tier}`}
                    line={line}
                    variant='compact'
                    index={i}
                  />
                ))}
              </div>
            </div>
          ))}

          {subject.buildLevel >= LADDER_LENGTH && (
            <p className='px-1 text-xs text-zinc-500'>
              Past build {LADDER_LENGTH} the recipe keeps scaling up, but there
              are no promotions left to earn.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
