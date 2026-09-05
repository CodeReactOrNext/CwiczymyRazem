import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { getDailyPool, getNextDailyReset } from "feature/arsenal/data/dailyCase";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { RARITY_STYLES } from "../RarityBadge";
import { oddsTooltipClass, rollChance } from "./DropRates";
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
    // Quiet, flat surface on purpose: the ten item cards are what this section
    // is for, and they only read as cards while the thing behind them stays
    // darker and plainer than they are.
    <section className='relative flex flex-col gap-6 overflow-hidden rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      {/* Guitar icon watermark — same texture as /login */}
      <GuitarPatternBackground opacity={0.04} />

      {/* Single cyan wash off the top-left corner, carrying the section's identity */}
      <div
        className='pointer-events-none absolute -left-24 -top-32 h-80 w-[36rem] rounded-full blur-[80px]'
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.16) 0%, transparent 70%)",
        }}
      />

      <div className='relative flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h3 className='font-display text-3xl font-black tracking-wide text-zinc-100'>
            {caseDef.name}
          </h3>
          <p className='mt-1.5 text-sm text-zinc-400'>{caseDef.description}</p>
        </div>
        <div className='flex items-center gap-2 rounded bg-zinc-100/10 px-3 py-2 text-xs font-bold tabular-nums text-zinc-100'>
          <Clock3 size={14} className='text-zinc-400' />
          New pool in {formatCountdown(msLeft)}
        </div>
      </div>

      {/* Today's pool — the exact ten items this case can drop, best first.
          Each one carries the odds for its own rarity on hover: standing in
          front of a Mythic, the question is what the chance of *that* is. */}
      <TooltipProvider>
        <div className='relative grid grid-cols-1 gap-3 xsm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
          {pool.map((entry) => {
            const rs = RARITY_STYLES[entry.def.rarity];
            const chance = rollChance(caseDef.probabilities, entry.def.rarity);
            const imageSrc =
              entry.kind === "guitar"
                ? getRankBadgeSrc(entry.def.imageId, "medium")
                : getEffectImageSrc(entry.def.imageId, "medium");
            return (
              <Tooltip key={`${entry.kind}-${entry.def.id}`} delayDuration={150}>
                <TooltipTrigger asChild>
                  <div
                    tabIndex={0}
                    className='group relative flex cursor-help items-center gap-3 overflow-hidden rounded-lg p-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                    style={{
                      background: `linear-gradient(120deg, ${rs.baseColor}30 0%, rgba(13,15,18,0.95) 65%)`,
                    }}>
                    {/* Rarity stripe down the leading edge */}
                    <div
                      className='absolute inset-y-0 left-0 w-[2px]'
                      style={{
                        background: `linear-gradient(180deg, transparent, ${rs.baseColor}, transparent)`,
                      }}
                    />

                    {/* Art on a rarity-colored pool of light */}
                    <div className='relative flex h-20 w-20 flex-shrink-0 items-center justify-center'>
                      <div
                        className='pointer-events-none absolute h-16 w-16 rounded-full opacity-70 blur-[22px] transition-opacity group-hover:opacity-100'
                        style={{
                          background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 50%, transparent 75%)`,
                        }}
                      />
                      <img
                        src={imageSrc}
                        alt={`${entry.def.brand} ${entry.def.name}`}
                        className={cn(
                          "relative z-10 h-20 w-20 object-contain",
                          entry.kind === "guitar" && "-rotate-90",
                        )}
                        draggable={false}
                        loading='lazy'
                      />
                    </div>

                    <div className='relative min-w-0 flex-1'>
                      <p className='line-clamp-2 text-sm font-bold leading-tight text-zinc-100'>
                        {entry.def.name}
                      </p>
                      <p
                        className='mt-1 truncate text-[11px] font-semibold'
                        style={{ color: rs.baseColor }}>
                        {entry.def.brand} · {entry.def.rarity}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side='top' className={oddsTooltipClass}>
                  <p className='truncate text-xs font-bold text-zinc-100'>
                    {entry.def.brand} {entry.def.name}
                  </p>
                  <div className='mt-2.5 flex items-baseline justify-between gap-4'>
                    <span className='text-[11px] font-semibold' style={{ color: rs.baseColor }}>
                      {entry.def.rarity}
                    </span>
                    <span
                      className='text-lg font-black tabular-nums'
                      style={{ color: rs.baseColor }}>
                      {chance !== undefined ? `${(chance * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <p className='mt-0.5 text-[10px] text-zinc-500'>chance from this case</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* The two ways to pay stack rather than sit side by side: the Fame
          button is the loud CTA of the whole screen, and a second bar of the
          same width beside it would have split that emphasis in half. */}
      <div className='relative flex w-full flex-col gap-2 sm:ml-auto sm:w-80'>
        <OpenCaseButton
          canAfford={canAfford}
          isOpening={isOpening}
          onClick={() => onOpen(caseDef.id)}
          fameCost={caseDef.fameCost}
          className='w-full py-3.5'
        />
        {freeTokens > 0 && (
          <FreeCaseButton
            isOpening={isOpening}
            tokens={freeTokens}
            onClick={() => onOpen(caseDef.id, true)}
            className='w-full'
          />
        )}
      </div>
    </section>
  );
};
