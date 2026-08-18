import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { CurrencyIcon } from "components/CurrencyIcons/withCurrencyIcons";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { motion } from "framer-motion";
import { Cable, Guitar, Info, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import {
  formatRigFameRate,
  getRigFameRate,
  RIG_FAME_HOURLY_CEILING,
} from "../../data/rigFame";
import { getRigLevel } from "../../data/rigLevel";
import { getChainFameRate } from "../../data/signalChain";
import {
  buildRigTraitContext,
  getRigTraitCategoryRates,
  getRigTraitShowcaseRate,
} from "../../data/traitEval";
import { formatTraitValue, PRACTICE_CATEGORIES } from "../../data/traits";
import type { ArsenalUserData } from "../../types/arsenal.types";
import { CountUp } from "../Workshop/workshopMotion";

/** Spring the sheet rolls its bars with — the same one `CountUp` uses. */
const ROLL = { type: "spring" as const, stiffness: 90, damping: 18 };

/**
 * The currency each headline is quoted in: cyan for level, amber for Fame —
 * the palette the rest of the app already reads them in.
 */
const TONES = {
  level: { value: "text-cyan-300", affix: "text-cyan-500/70" },
  fame: { value: "text-amber-300", affix: "text-amber-500/70" },
} as const;

interface HeadlineProps {
  tone: keyof typeof TONES;
  /** Sits before the number, small — "Lv". */
  prefix?: string;
  /** Sits before the number at its own size — the Fame coin. */
  icon?: React.ReactNode;
  value: number;
  decimals?: number;
  /** Sits after it, same treatment as the prefix — "/h". */
  suffix?: string;
  caption: React.ReactNode;
}

/** One of the two numbers the sheet is read for. */
const Headline = ({
  tone,
  prefix,
  icon,
  value,
  decimals = 0,
  suffix,
  caption,
}: HeadlineProps) => (
  <div className='flex flex-col gap-1'>
    <div className='flex items-baseline gap-1.5'>
      {prefix && (
        <span
          className={cn("font-teko text-xl leading-none", TONES[tone].affix)}>
          {prefix}
        </span>
      )}
      {icon}
      <CountUp
        value={value}
        decimals={decimals}
        className={cn(
          "font-teko text-6xl font-bold tabular-nums leading-none",
          TONES[tone].value,
        )}
      />
      {suffix && (
        <span
          className={cn("font-teko text-xl leading-none", TONES[tone].affix)}>
          {suffix}
        </span>
      )}
    </div>
    <div className='flex items-center gap-2 text-xs tracking-wide text-zinc-500'>
      {caption}
    </div>
  </div>
);

interface StatGroupProps {
  label: string;
  children: React.ReactNode;
}

const StatGroup = ({ label, children }: StatGroupProps) => (
  <div className='flex flex-col gap-3'>
    <p className='text-[11px] font-bold tracking-[0.2em] text-zinc-500'>
      {label}
    </p>
    <dl className='flex flex-col gap-2.5'>{children}</dl>
  </div>
);

interface StatRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  /** 0–1 of the group's best row. Draws the bar; omit it and the row is plain. */
  share?: number;
  /** Brightest line in its group — the rig's strongest category. */
  strong?: boolean;
  /** Nothing to pay: the row stays, the number steps back. */
  muted?: boolean;
}

const StatRow = ({ label, value, icon, share, strong, muted }: StatRowProps) => (
  <div className='flex items-center gap-3'>
    <dt className='flex min-w-0 shrink-0 items-center gap-2'>
      {icon}
      <span className='truncate text-[13px] capitalize tracking-wide text-zinc-300'>
        {label}
      </span>
    </dt>

    {share === undefined ? (
      <div className='flex-1' />
    ) : (
      <div className='h-1.5 flex-1 overflow-hidden rounded bg-zinc-800'>
        <motion.div
          className={cn(
            "h-full rounded",
            strong ? "bg-amber-400" : "bg-amber-400/50",
          )}
          initial={false}
          animate={{ width: `${Math.min(100, share * 100)}%` }}
          transition={ROLL}
        />
      </div>
    )}

    <dd
      className={cn(
        "shrink-0 font-mono text-[15px] tabular-nums",
        muted
          ? "text-zinc-500"
          : strong
            ? "font-bold text-zinc-100"
            : "text-zinc-200",
      )}>
      {value}
    </dd>
  </div>
);

/** The small print, folded away — it explains the numbers, it is not one of them. */
const PayoutNote = () => {
  // Radix opens a tooltip on hover and focus but never on touch, so the trigger
  // also toggles it — otherwise this text simply does not exist on a phone.
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150} open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type='button'
            onClick={() => setOpen((prev) => !prev)}
            className='flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
            <Info size={13} />
            How it pays
          </button>
        </TooltipTrigger>
        <TooltipContent
          side='left'
          className='w-64 border border-zinc-700 bg-zinc-950 p-3'>
          <div className='space-y-2 text-xs font-normal leading-relaxed text-zinc-300'>
            <p>Fame per hour of practice.</p>
            <p>
              <span className='font-semibold text-white'>Traits</span> are quoted
              on an even hour — 15 minutes in each category.
            </p>
            <p>
              <span className='font-semibold text-white'>Signal path</span> is
              what the order of the pedals on the board is worth — see the panel
              above it.
            </p>
            <p>
              <span className='font-semibold text-white'>Per category</span> is
              what those same traits pay on an hour spent only on that one
              category.
            </p>
            <p>Traits pay only while the gear carrying them is on the rig.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface RigStatsPanelProps {
  data: ArsenalUserData;
}

/**
 * The rig's character sheet: what the gear in service is worth per hour of
 * practice, and which kind of practice it is worth it on.
 *
 * These numbers used to sit in the Arsenal banner, above the tabs — three tabs
 * away from the only screen where the player can change them. Swapping a pedal
 * is what moves them, so they belong beside the pedalboard.
 *
 * Two numbers lead, because two are what a player carries around: the level the
 * gear adds up to, and the Fame an hour of practice is now worth. Everything
 * else is the working that produces them and sits to the side at stat size.
 *
 * Colour is spent only where it names a currency — cyan for level, amber for
 * Fame, the same pairing the header and the item cards use. The working stays
 * neutral, so nothing in it competes with the two numbers it adds up to.
 *
 * The numbers roll rather than snap: swapping a pedal is the whole point of the
 * screen below, and a rate that visibly climbs is the feedback for it.
 */
export const RigStatsPanel = ({ data }: RigStatsPanelProps) => {
  const rigLevel = getRigLevel(data);
  const baseRate = getRigFameRate(rigLevel);
  // The saved board, not the live one: this is the sheet of what the gear pays,
  // and the panel over the pedalboard is where a rate still being dragged around
  // belongs.
  const chainRate = getChainFameRate(data);

  const { traitRate, categoryRates } = useMemo(() => {
    const rig = buildRigTraitContext(data);
    return {
      traitRate: getRigTraitShowcaseRate(rig),
      categoryRates: getRigTraitCategoryRates(rig),
    };
  }, [data]);

  // Traits are paid out of whatever headroom the base rate leaves under the one
  // ceiling in the system (see `calculateSessionFame`), so the honest total is
  // the clamped one — base + traits raw would advertise Fame no report pays.
  // The ceiling itself stays off the sheet: nothing in the game reaches it, so
  // showing it only invited the question of why the number was short.
  const rawTotal = baseRate + chainRate + traitRate;
  const totalRate = Math.min(RIG_FAME_HOURLY_CEILING, rawTotal);

  // Three sources now, so "brightest line in the group" has to be worked out
  // rather than written as one comparison.
  const bestSourceRate = Math.max(baseRate, chainRate, traitRate);

  const bestCategoryRate = Math.max(
    ...PRACTICE_CATEGORIES.map((category) => categoryRates[category]),
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-end justify-between gap-4'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
            Loadout
          </p>
          <p className='text-base font-black capitalize tracking-wide text-white'>
            Rig Sheet
          </p>
        </div>
        <PayoutNote />
      </div>

      <div className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-12'>
          <div className='flex flex-col gap-5'>
            <Headline
              tone='level'
              prefix='Lv'
              value={rigLevel}
              caption='Rig level'
            />

            <Headline
              tone='fame'
              icon={
                <CurrencyIcon
                  currency='fame'
                  className='mr-0 h-7 w-7 self-center'
                />
              }
              value={totalRate}
              decimals={1}
              suffix='/h'
              caption='Fame per hour'
            />
          </div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10'>
            <StatGroup label='Sources'>
              <StatRow
                label='Base'
                value={`+${formatRigFameRate(rigLevel)}`}
                icon={<Guitar size={14} className='shrink-0 text-zinc-500' />}
                share={rawTotal > 0 ? baseRate / rawTotal : 0}
                strong={baseRate === bestSourceRate}
              />
              <StatRow
                label='Signal path'
                value={formatTraitValue(chainRate)}
                icon={<Cable size={14} className='shrink-0 text-zinc-500' />}
                share={rawTotal > 0 ? chainRate / rawTotal : 0}
                strong={chainRate > 0 && chainRate === bestSourceRate}
                muted={chainRate === 0}
              />
              <StatRow
                label='Traits'
                value={formatTraitValue(traitRate)}
                icon={<Sparkles size={14} className='shrink-0 text-zinc-500' />}
                share={rawTotal > 0 ? traitRate / rawTotal : 0}
                strong={traitRate > 0 && traitRate === bestSourceRate}
                muted={traitRate === 0}
              />
            </StatGroup>

            <StatGroup label='Per category'>
              {PRACTICE_CATEGORIES.map((category) => {
                const Icon = SKILL_CATEGORY_ICONS[category];
                const rate = categoryRates[category];

                return (
                  <StatRow
                    key={category}
                    label={category}
                    value={rate > 0 ? formatTraitValue(rate) : "—"}
                    icon={
                      <Icon
                        size='medium'
                        className='shrink-0 self-center text-zinc-500'
                      />
                    }
                    // Bars only once there is something to compare — four empty
                    // tracks would read as a broken chart, not as "pays nothing
                    // extra on any category yet".
                    share={
                      bestCategoryRate > 0 ? rate / bestCategoryRate : undefined
                    }
                    strong={rate > 0 && rate === bestCategoryRate}
                    muted={rate === 0}
                  />
                );
              })}
            </StatGroup>
          </div>
        </div>
      </div>
    </div>
  );
};
