import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import {
  getDailyPool,
  getNextDailyReset,
} from "feature/arsenal/data/dailyCase";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { RARITY_STYLES } from "../RarityBadge";
import { DropRates, oddsTooltipClass, rollChance } from "./DropRates";
import { FreeCaseButton } from "./FreeCaseButton";
import { OpenCaseButton } from "./OpenCaseButton";

interface DailyCaseCardProps {
  currentFame: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  isOpening: boolean;
  /** Free cases the player is holding. Zero hides the second button entirely. */
  freeTokens?: number;
}

const formatCountdown = (msLeft: number) => {
  const clamped = Math.max(0, msLeft);
  const d = Math.floor(clamped / 86_400_000);
  const h = Math.floor(clamped / 3_600_000) % 24;
  const m = Math.floor(clamped / 60_000) % 60;
  const s = Math.floor(clamped / 1000) % 60;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};

export const DailyCaseCard = ({
  currentFame,
  onOpen,
  isOpening,
  freeTokens = 0,
}: DailyCaseCardProps) => {
  const caseDef = CASE_DEFINITIONS.daily;
  const canAfford = currentFame >= caseDef.fameCost;

  // Ticking clock drives both the countdown and the automatic pool rollover
  // at the rotation boundary (every 3 UTC days). Deriving the pool each tick
  // is trivial (seeded shuffle over the static catalog) and keeps it in sync.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pool = getDailyPool(now);
  const msLeft = getNextDailyReset(now).getTime() - now.getTime();

  return (
    <section className='overflow-hidden rounded-lg bg-arsenal-section'>
      {/* Hero band. The render was composed for this slot — case in the right
          60%, filling the height, left 40% near-black — so it is simply the
          band's cover image. It is wider than the band is tall, so the cover
          crop trims top and bottom; anchoring at 25% keeps the raised lid
          whole and gives up floor instead. The band clips it, so nothing
          runs under the tiles below. */}
      <div className='relative min-h-[22rem] overflow-hidden'>
        <img
          src='/images/case-featured-hero.webp'
          alt=''
          className='absolute inset-0 h-full w-full object-cover'
          style={{ objectPosition: "right 25%" }}
          draggable={false}
        />
        {/* Edges dissolve into the section rather than ending in a seam: a
            wash from the left for the copy, a fade at the foot, and a touch
            of dark at the top so the ceiling of the render goes quiet. */}
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-arsenal-section via-arsenal-section/70 to-transparent lg:via-arsenal-section/20' />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-arsenal-section via-arsenal-section/50 to-transparent' />
        <div className='pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-arsenal-section/50 to-transparent' />

        <div className='relative flex min-h-[22rem] flex-col justify-center gap-5 p-6 sm:p-8 lg:max-w-[46%]'>
          <div>
            <h2 className='font-display text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl'>
              {caseDef.name}
            </h2>
            <p className='mt-1.5 text-sm text-zinc-300'>
              {pool.length} items. One new possibility.
            </p>
          </div>

          <div className='flex w-fit items-center gap-2 rounded-lg bg-zinc-100/10 px-3.5 py-2 text-xs text-zinc-300'>
            <Clock3 size={14} className='text-zinc-400' />
            Refreshes in
            <span className='font-bold tabular-nums text-zinc-100'>
              {formatCountdown(msLeft)}
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <OpenCaseButton
              canAfford={canAfford}
              isOpening={isOpening}
              onClick={() => onOpen(caseDef.id)}
              fameCost={caseDef.fameCost}
              variant='featured'
            />
            <DropRates probabilities={caseDef.probabilities} variant='inline' />
            {freeTokens > 0 && (
              <FreeCaseButton
                isOpening={isOpening}
                tokens={freeTokens}
                onClick={() => onOpen(caseDef.id, true)}
                className='py-3'
              />
            )}
          </div>
        </div>
      </div>

      {/* Today's pool — the exact ten items this case can drop, best first,
          on the same surface as the hero so they read as its contents.
          Each one carries the odds for its own rarity on hover: standing in
          front of a Mythic, the question is what the chance of *that* is. */}
      <div className='relative p-5 sm:p-6'>
        <p className='text-sm font-semibold text-zinc-300'>Inside this drop</p>

        <TooltipProvider>
          <div className='mt-4 grid grid-cols-2 gap-3.5 xsm:grid-cols-3 sm:grid-cols-5 xl:grid-cols-10'>
            {pool.map((entry) => {
              const rs = RARITY_STYLES[entry.def.rarity];
              const chance = rollChance(
                caseDef.probabilities,
                entry.def.rarity,
              );
              const imageSrc =
                entry.kind === "guitar"
                  ? getRankBadgeSrc(entry.def.imageId, "medium")
                  : getEffectImageSrc(entry.def.imageId, "medium");
              return (
                <Tooltip
                  key={`${entry.kind}-${entry.def.id}`}
                  delayDuration={150}>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      className='group flex cursor-help flex-col gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                      {/* Near-black tile lit from its bottom-left corner: the
                          rarity colour comes in as light from one side — a
                          1px gradient edge that is strongest on the left and
                          fades to a neutral hairline, and a corner glow that
                          spreads across the tile the same way. The bottom
                          darkens so the tile reads as sitting on the panel. */}
                      <div
                        className='rounded-xl p-px shadow-[0_10px_18px_-12px_rgba(0,0,0,0.6)]'
                        style={{
                          background: `linear-gradient(45deg, ${rs.baseColor}a6 0%, ${rs.baseColor}40 30%, rgba(244,244,245,0.10) 60%, rgba(244,244,245,0.10) 100%)`,
                        }}>
                        <div className='relative flex aspect-square items-center justify-center overflow-hidden rounded-[11px] bg-arsenal-bg'>
                          {/* Soft pool of light tucked into the bottom-left corner */}
                          <div
                            className='pointer-events-none absolute -bottom-1/3 -left-1/3 h-full w-full rounded-full opacity-90 blur-2xl transition-opacity group-hover:opacity-100'
                            style={{
                              background: `radial-gradient(circle at center, ${rs.baseColor}8c 0%, ${rs.baseColor}26 50%, transparent 72%)`,
                            }}
                          />
                          {/* Contact shadow only: a pool of dark right under
                              the instrument's base, as if it stood on the
                              tile — no shadow on the silhouette itself. */}
                          <div className='pointer-events-none absolute bottom-[4%] left-1/2 h-[7%] w-[52%] -translate-x-1/2 rounded-[100%] bg-black/85 blur-[5px]' />
                          <div className='relative z-10 flex h-[86%] w-[86%] items-center justify-center transition-transform duration-300 group-hover:scale-[1.04]'>
                            <img
                              src={imageSrc}
                              alt={`${entry.def.brand} ${entry.def.name}`}
                              className={cn(
                                "h-full w-full object-contain",
                                entry.kind === "guitar" && "-rotate-90",
                              )}
                              draggable={false}
                              loading='lazy'
                            />
                          </div>
                        </div>
                      </div>

                      <div className='min-w-0 px-1'>
                        <p className='flex items-start gap-2 text-[13px] font-semibold leading-snug text-zinc-100'>
                          <span
                            className='mt-[5px] h-2 w-2 flex-shrink-0 rounded-full'
                            style={{ backgroundColor: rs.baseColor }}
                          />
                          <span className='line-clamp-2'>{entry.def.name}</span>
                        </p>
                        <p
                          className='mt-1 pl-4 text-[13px] font-medium'
                          style={{ color: rs.baseColor }}>
                          {entry.def.rarity}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side='top' className={oddsTooltipClass}>
                    <p className='truncate text-xs font-bold text-zinc-100'>
                      {entry.def.brand} {entry.def.name}
                    </p>
                    <div className='mt-2.5 flex items-baseline justify-between gap-4'>
                      <span
                        className='text-[11px] font-semibold'
                        style={{ color: rs.baseColor }}>
                        {entry.def.rarity}
                      </span>
                      <span
                        className='text-lg font-black tabular-nums'
                        style={{ color: rs.baseColor }}>
                        {chance !== undefined
                          ? `${(chance * 100).toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                    <p className='mt-0.5 text-[10px] text-zinc-500'>
                      chance from this case
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </section>
  );
};
