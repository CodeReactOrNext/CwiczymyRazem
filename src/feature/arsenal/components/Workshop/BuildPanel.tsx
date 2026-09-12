import { cn } from "assets/lib/utils";
import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import { ArrowRight } from "lucide-react";

import { RARITY_STYLES } from "../RarityBadge";
import { SectionLabel } from "../SectionLabel";

interface SideProps {
  caption: string;
  build: number;
  level: number;
  /** The "next" half: brighter, with the level gain called out. */
  next?: boolean;
  gain?: number;
  /** The tier this build promotes the item to, when it promotes at all. */
  promotesTo?: GuitarRarity | null;
}

/** One half of the upgrade: the build, and the level it is worth. */
const Side = ({
  caption,
  build,
  level,
  next = false,
  gain,
  promotesTo,
}: SideProps) => (
  <div className='flex flex-col gap-3 p-5 sm:p-6'>
    <SectionLabel>{caption}</SectionLabel>
    <div className='flex flex-wrap items-center gap-3'>
      <span
        className={cn(
          "text-2xl font-black leading-none",
          next ? "text-white" : "text-zinc-200",
        )}>
        Build {build}
      </span>
      {next && promotesTo && (
        <span
          className='rounded px-2.5 py-1 text-xs font-bold'
          style={{
            backgroundColor: `${RARITY_STYLES[promotesTo].baseColor}1f`,
            color: RARITY_STYLES[promotesTo].baseColor,
          }}>
          {promotesTo}
        </span>
      )}
    </div>
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
      <span className='text-sm text-zinc-400'>
        Level{" "}
        <span
          className={cn(
            "text-xl font-black tabular-nums",
            next ? "text-white" : "text-zinc-200",
          )}>
          {level}
        </span>
      </span>
      {next && gain != null && gain !== 0 && (
        <span className='text-sm font-bold tabular-nums text-cyan-400'>
          <span className='mr-3 text-zinc-700'>|</span>
          {gain > 0 ? `+${gain}` : gain}{" "}
          {Math.abs(gain) === 1 ? "level" : "levels"}
        </span>
      )}
    </div>
  </div>
);

interface BuildPanelProps {
  fromBuild: number;
  toBuild: number;
  fromLevel: number;
  toLevel: number;
  promotesTo: GuitarRarity | null;
}

/**
 * The upgrade as a before → after, side by side: which build the item is at,
 * which it is about to be, and what each is worth in level. The gain is the
 * one figure in colour, because it is the one the player is paying for.
 */
export const BuildPanel = ({
  fromBuild,
  toBuild,
  fromLevel,
  toLevel,
  promotesTo,
}: BuildPanelProps) => (
  <div className='grid grid-cols-1 rounded-lg bg-zinc-950/40 sm:grid-cols-[1fr_auto_1fr]'>
    <Side caption='Current' build={fromBuild} level={fromLevel} />
    <div className='flex items-center justify-center px-1 py-1 sm:px-2'>
      <ArrowRight size={18} className='rotate-90 text-zinc-500 sm:rotate-0' />
    </div>
    <Side
      caption='Next build'
      build={toBuild}
      level={toLevel}
      gain={toLevel - fromLevel}
      promotesTo={promotesTo}
      next
    />
  </div>
);
