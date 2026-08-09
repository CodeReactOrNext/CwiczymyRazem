import { cn } from "assets/lib/utils";
import {
  BUILDS_PER_PROMOTION,
  getPromotions,
  getPromotionsAvailable,
  RARITY_LADDER,
} from "feature/arsenal/data/itemStats";
import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import { motion } from "framer-motion";

import { RARITY_STYLES } from "../RarityBadge";

interface RarityPathProps {
  mintRarity: GuitarRarity;
  buildLevel: number;
}

/**
 * Where this instrument started, where it is, and how far it can still go.
 *
 * The promotion ladder is the whole reason to commit parts to one item, but it
 * was only ever legible as a sentence — "3 more to the next promotion". As a
 * track it answers the three questions at once: how many rungs are left, which
 * tiers they are, and how far along the current one you are. The connector to
 * the next tier fills with build progress, so the countdown needs no number.
 */
export const RarityPath = ({ mintRarity, buildLevel }: RarityPathProps) => {
  const start = RARITY_LADDER.indexOf(mintRarity);
  if (start === -1) return null;

  const available = getPromotionsAvailable(mintRarity);
  if (available === 0) return null;

  const done = getPromotions(mintRarity, buildLevel);
  const steps = RARITY_LADDER.slice(start, start + available + 1);
  // How far into the current flight of three the item is.
  const progress =
    done < available
      ? (buildLevel % BUILDS_PER_PROMOTION) / BUILDS_PER_PROMOTION
      : 1;

  return (
    <div className='flex items-center gap-1.5' aria-label='Promotion path'>
      {steps.map((rarity, i) => {
        const color = RARITY_STYLES[rarity].baseColor;
        const reached = i <= done;
        const isCurrent = i === done;

        return (
          <div key={rarity} className='flex items-center gap-1.5'>
            <span
              title={
                reached
                  ? isCurrent
                    ? `${rarity} — where it is now`
                    : rarity
                  : `${rarity} — not yet`
              }
              className={cn(
                "block shrink-0 rounded-full transition-all",
                isCurrent ? "h-3 w-3" : "h-2 w-2",
              )}
              style={{
                backgroundColor: reached ? color : "transparent",
                border: reached ? undefined : `1.5px solid ${color}55`,
                boxShadow: isCurrent ? `0 0 8px ${color}` : undefined,
              }}
            />

            {i < steps.length - 1 && (
              <span className='relative h-[2px] w-7 overflow-hidden rounded-full bg-zinc-800'>
                <motion.span
                  className='absolute inset-y-0 left-0 rounded-full'
                  style={{
                    backgroundColor: RARITY_STYLES[steps[i + 1]].baseColor,
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      i < done ? "100%" : i === done ? `${progress * 100}%` : 0,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
